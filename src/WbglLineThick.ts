// --- Constants ---
// Offsets within the LineData struct in the UBO (std140 layout)
// struct LineData {
//   vec4 transform;  // offset 0, size 16 bytes (scale.xy, offset.xy)
//   vec4 color;      // offset 16, size 16 bytes (rgba)
//   ivec4 indices;   // offset 32, size 16 bytes (startIndex, numPoints, enabledFlag (use numPoints=0), unused)
//   float thickness; // offset 48, size 4 bytes
//   // vec3 _padding;   // offset 52, size 12 bytes (implicit padding for std140)
// }; // Total size (stride) = 64 bytes (must be multiple of 16 due to vec4)
const OFFSET_TRANSFORM = 0;
const OFFSET_COLOR = 16;
const OFFSET_INDICES = 32;
const OFFSET_THICKNESS = 48;
const BYTES_PER_FLOAT = 4;
const BYTES_PER_INT = 4;
// Stride must be a multiple of the largest member's base alignment (vec4 = 16 bytes)
const LINE_DATA_STRIDE = 64;

// Uniform locations
type UniformLocationsMulti = {
  uPointsTex: WebGLUniformLocation | null;
  uTexWidth: WebGLUniformLocation | null;
  uTexHeight: WebGLUniformLocation | null;
};

// Input structure for initializing lines
export type LineInitData = {
  points: Float32Array; // Should contain [x1, y1, x2, y2, ...] in ORIGINAL data space (before auto-scaling)
  scale: [number, number]; // Initial per-line scale [scaleX, scaleY] in NDC (can be overridden by auto-scale)
  offset: [number, number]; // Initial per-line offset [offsetX, offsetY] in NDC (can be overridden by auto-scale)
  color: [number, number, number, number]; // Per-line color [r, g, b, a] (0-1)
  thickness: number; // Per-line thickness in Normalized Device Coordinates (NDC)
};

// --- Main Class ---
export class WebglLineThick {
  private gl: WebGL2RenderingContext;
  public prog: WebGLProgram | null;
  private maxLines: number;
  private pointsTexture: WebGLTexture | null;
  private vao: WebGLVertexArrayObject | null;
  private vertexBuffer: WebGLBuffer | null;
  private locations: UniformLocationsMulti;

  // UBO related members
  private lineDataUBO: WebGLBuffer | null;
  private lineDataUBObindingPoint: number = 0; // UBO binding point 0
  private lineDataStride: number = LINE_DATA_STRIDE;
  private lineDataArrayBuffer: ArrayBuffer = new ArrayBuffer(0); // CPU-side copy for bulk updates / reference
  private lineDataView: DataView = new DataView(this.lineDataArrayBuffer);

  // Total vertex count for single draw call (includes degenerates for ALL lines, enabled or not)
  private totalVertexCount: number = 0;

  // The number of lines currently represented in the buffers/texture (max potential lines).
  private numLines: number = 0;

  // Points data texture related members
  private pointsData: Float32Array = new Float32Array(0); // CPU-side copy of ALL points data for updates and auto-scaling
  private texWidth: number = 0;
  private texHeight: number = 0;
  // Store original numPoints per line for enabling/disabling and validation
  private lineOriginalNumPointsCache: number[] = [];
  // Store start index per line for quick access in updates and auto-scaling
  private lineStartIndexCache: number[] = [];
  // Track enabled status of each line
  private lineEnabledStatus: boolean[] = [];

  /**
   * Creates an instance of WebglLineThick.
   * @param wglp Context wrapper object.
   * @param maxLines Maximum number of lines this instance can handle. Affects UBO size.
   */
  constructor(wglp: { gl: WebGL2RenderingContext }, maxLines: number) {
    this.gl = wglp.gl;
    this.maxLines = Math.max(1, maxLines);
    const gl = this.gl;

    // --- Vertex Shader Source ---
    // No changes needed here, disabling happens by setting uLines[lineId].indices.y (numPoints) to 0 in the UBO
    const vsSource = `#version 300 es
precision highp float;
precision highp int;
#define MAX_LINES ${this.maxLines}

// --- Uniforms ---
uniform sampler2D uPointsTex;
uniform int uTexWidth;
uniform int uTexHeight;

// --- UBO Definition (std140 layout) ---
struct LineData {
  vec4 transform; // scale.x, scale.y, offset.x, offset.y
  vec4 color;     // r, g, b, a
  ivec4 indices;  // start index in texture, number of points (set to 0 to disable line), unused, unused
  float thickness; // line thickness in NDC
};

layout(std140) uniform LineDataBlock {
  LineData uLines[MAX_LINES];
};

// --- Vertex Attributes ---
in float aLineId;
in float aIndex;
in float aSide;

// --- Outputs ---
flat out vec4 vColor;

// --- Helper Function: Get Point from Texture ---
vec2 getPoint(int globalPointIndex) {
  int texX = globalPointIndex % uTexWidth;
  int texY = globalPointIndex / uTexWidth;
  float u = (float(texX) + 0.5) / float(uTexWidth);
  float v = (float(texY) + 0.5) / float(uTexHeight);
  return texture(uPointsTex, vec2(u, v)).xy;
}

// --- Main ---
void main() {
  int lineId = int(aLineId);
  int localIndex = int(aIndex);

  // Access line data from UBO
  int globalStartIndex = uLines[lineId].indices.x;
  int numPoints = uLines[lineId].indices.y; // If 0, the line is disabled

  // Early exit for disabled lines or invalid indices
  // This prevents processing vertices for lines where numPoints is 0
  if (numPoints <= 0 || localIndex >= numPoints) {
     gl_Position = vec4(0.0, 0.0, 0.0, 0.0); // Collapse to origin (effectively invisible)
     vColor = vec4(0.0); // Transparent black
     return;
  }

  vec2 lineScale = uLines[lineId].transform.xy;
  vec2 lineOffset = uLines[lineId].transform.zw;
  float lineThickness = uLines[lineId].thickness;
  vColor = uLines[lineId].color; // Assign color early

  int globalIndex = globalStartIndex + localIndex;

  // Retrieve points
  vec2 p = getPoint(globalIndex);
  // Boundary checks are important, especially if numPoints is small
  vec2 pPrev = (localIndex == 0) ? p : getPoint(globalStartIndex + max(0, localIndex - 1));
  vec2 pNext = (localIndex == numPoints - 1) ? p : getPoint(globalStartIndex + min(numPoints - 1, localIndex + 1));

  // Apply per-line transformation (scale and offset are in NDC)
  p = p * lineScale + lineOffset;
  pPrev = pPrev * lineScale + lineOffset;
  pNext = pNext * lineScale + lineOffset;

  // --- Calculate Miter/Bevel Normal ---
  vec2 offsetNormalDir;
  float offsetScale = 0.5 * lineThickness;

  vec2 dirToNext = pNext - p;
  vec2 dirFromPrev = p - pPrev;

  float lenToNext = length(dirToNext);
  float lenFromPrev = length(dirFromPrev);

  bool isStart = (localIndex == 0);
  bool isEnd = (localIndex == numPoints - 1);
  // Check for *very* close points which might cause normalization issues
  bool prevCoincident = (lenFromPrev < 0.00001);
  bool nextCoincident = (lenToNext < 0.00001);

  if ((isStart || prevCoincident) && (isEnd || nextCoincident)) {
     offsetNormalDir = vec2(0.0, 1.0); // Single distinct point case
  } else if (isStart || prevCoincident) {
     vec2 dir = normalize(dirToNext);
     offsetNormalDir = vec2(-dir.y, dir.x);
  } else if (isEnd || nextCoincident) {
     vec2 dir = normalize(dirFromPrev);
     offsetNormalDir = vec2(-dir.y, dir.x);
  } else {
     // Regular interior point: Calculate miter join
     vec2 dir0 = normalize(dirFromPrev);
     vec2 dir1 = normalize(dirToNext);
     vec2 n0 = vec2(-dir0.y, dir0.x);
     vec2 n1 = vec2(-dir1.y, dir1.x);

     float dotDirs = dot(dir0, dir1);
     if (dotDirs < -0.999) { // Sharp turn (close to 180 degrees), use bevel-like normal
         offsetNormalDir = n1; // Or average: normalize(n0+n1) might be okay too
     } else {
         // Miter calculation
         vec2 miterVec = normalize(n0 + n1);
         // Clamp miter length to avoid excessive spikes
         float miterScaleFactor = 1.0 / max(dot(miterVec, n1), 0.1); // Avoid division by zero/tiny numbers
         float maxMiterScale = 5.0; // Limit miter length

         if (miterScaleFactor > maxMiterScale) {
            // Convert to bevel: use the normal of the incoming segment
            // offsetNormalDir = n0; // Bevel approach 1
            // Or keep miter direction but clamp length
            offsetNormalDir = miterVec;
            offsetScale *= maxMiterScale; // Clamp the scaling factor
         } else {
            offsetNormalDir = miterVec;
            offsetScale *= miterScaleFactor;
         }
     }
  }

  // Calculate final vertex position
  vec2 pos = p + offsetNormalDir * offsetScale * aSide;
  gl_Position = vec4(pos, 0.0, 1.0);
  // vColor already assigned
}
`;

    // --- Fragment Shader Source ---
    const fsSource = `#version 300 es
precision mediump float;
flat in vec4 vColor;
out vec4 fragColor;
void main() {
  // Discard fully transparent fragments (e.g., from disabled lines)
  // Optional optimization, but good practice
  if (vColor.a == 0.0) {
    discard;
  }
  fragColor = vColor;
}
`;

    // --- Shader Compilation and Linking Helper Functions ---
    /**
     * Creates and compiles a shader.
     */
    function createShader(
      gl: WebGL2RenderingContext,
      type: number,
      source: string
    ): WebGLShader {
      const shader = gl.createShader(type);
      if (!shader) {
        throw new Error("Could not create shader object.");
      }
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compile error: ${info}\nSource:\n${source}`); // Include source for easier debugging
      }
      return shader;
    }

    /**
     * Creates and links a WebGL program from vertex and fragment shaders.
     */
    function createProgram(
      gl: WebGL2RenderingContext,
      vsSource: string,
      fsSource: string
    ): WebGLProgram {
      const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
      const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
      const program = gl.createProgram();
      if (!program) {
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        throw new Error("Could not create program object.");
      }
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.detachShader(program, vertexShader);
      gl.detachShader(program, fragmentShader);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Program link error: ${info}`);
      }
      return program;
    }

    // --- Create and Configure WebGL Resources ---

    try {
      this.prog = createProgram(gl, vsSource, fsSource);
    } catch (error) {
      console.error("Error creating GL program:", error);
      this.prog = null;
      throw error; // Re-throw after logging
    }
    gl.useProgram(this.prog);

    // --- UBO Setup ---
    const blockName = "LineDataBlock";
    const blockIndex = gl.getUniformBlockIndex(this.prog, blockName);
    if (blockIndex === gl.INVALID_INDEX) {
      console.warn(`Uniform block '${blockName}' not found or not active.`);
    } else {
      gl.uniformBlockBinding(
        this.prog,
        blockIndex,
        this.lineDataUBObindingPoint
      );
    }
    const ubo = gl.createBuffer();
    if (!ubo) throw new Error("Failed to create UBO buffer.");
    this.lineDataUBO = ubo;
    // --- End UBO Setup ---

    // --- Points Texture Setup ---
    const pointsTex = gl.createTexture();
    if (!pointsTex) throw new Error("Failed to create points texture.");
    this.pointsTexture = pointsTex;
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
    // --- End Points Texture Setup ---

    // --- Vertex Buffer Object (VBO) Setup ---
    const vbo = gl.createBuffer();
    if (!vbo) throw new Error("Failed to create vertex buffer.");
    this.vertexBuffer = vbo;
    // --- End VBO Setup ---

    // --- Vertex Array Object (VAO) Setup ---
    const vao = gl.createVertexArray();
    if (!vao) throw new Error("Failed to create vertex array object.");
    this.vao = vao;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    const stride = 3 * BYTES_PER_FLOAT; // aLineId, aIndex, aSide
    const aLineIdLoc = gl.getAttribLocation(this.prog, "aLineId");
    const aIndexLoc = gl.getAttribLocation(this.prog, "aIndex");
    const aSideLoc = gl.getAttribLocation(this.prog, "aSide");

    if (aLineIdLoc === -1 || aIndexLoc === -1 || aSideLoc === -1) {
      console.warn(
        "One or more vertex attributes (aLineId, aIndex, aSide) not found or not active."
      );
    }

    gl.enableVertexAttribArray(aLineIdLoc);
    gl.vertexAttribPointer(aLineIdLoc, 1, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(aIndexLoc);
    gl.vertexAttribPointer(
      aIndexLoc,
      1,
      gl.FLOAT,
      false,
      stride,
      1 * BYTES_PER_FLOAT
    );

    gl.enableVertexAttribArray(aSideLoc);
    gl.vertexAttribPointer(
      aSideLoc,
      1,
      gl.FLOAT,
      false,
      stride,
      2 * BYTES_PER_FLOAT
    );

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // --- End VAO Setup ---

    // --- Get Locations for Non-UBO Uniforms ---
    this.locations = {
      uPointsTex: gl.getUniformLocation(this.prog, "uPointsTex"),
      uTexWidth: gl.getUniformLocation(this.prog, "uTexWidth"),
      uTexHeight: gl.getUniformLocation(this.prog, "uTexHeight"),
    };
    if (
      !this.locations.uPointsTex ||
      !this.locations.uTexWidth ||
      !this.locations.uTexHeight
    ) {
      console.warn(
        "One or more required uniform locations (uPointsTex, uTexWidth, uTexHeight) not found."
      );
    }

    // --- Set Constant Uniforms ---
    gl.useProgram(this.prog);
    gl.uniform1i(this.locations.uPointsTex, 0); // Texture unit 0
    gl.useProgram(null);

    // --- Initialize internal state arrays ---
    this.lineEnabledStatus = new Array(this.maxLines).fill(false); // Initially all disabled until initLines
    this.lineOriginalNumPointsCache = new Array(this.maxLines).fill(0);
    this.lineStartIndexCache = new Array(this.maxLines).fill(0);

    // --- Enable Blending ---
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * Initializes or updates the line data.
   * Uploads points to texture, builds VBO with degenerate triangles, and sets up UBO data.
   * All lines are initially enabled.
   * @param lines An array of line objects to draw. Points are in original data space.
   */
  public initLines(lines: LineInitData[]): void {
    const gl = this.gl;
    if (!this.prog) {
      console.error("Cannot initLines, program not initialized.");
      return;
    }

    // --- Input Validation and Filtering ---
    if (lines.length > this.maxLines) {
      console.warn(
        // Use warn instead of error, proceed with truncated data
        `Attempted to initialize with ${lines.length} lines, but maxLines is ${this.maxLines}. Truncating.`
      );
      lines = lines.slice(0, this.maxLines);
    }

    const validLinesData: {
      lineObj: LineInitData;
      startIndex: number;
      numPoints: number;
      originalIndex: number; // Keep track of the original index for sparse initialization
    }[] = [];
    let currentStartIndex = 0;
    let totalValidPoints = 0;

    // Reset caches for the potentially new set of lines
    this.lineOriginalNumPointsCache.fill(0);
    this.lineStartIndexCache.fill(0);
    this.lineEnabledStatus.fill(false); // Reset all to disabled before processing input

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const numPts = line.points.length / 2;
      if (numPts >= 2) {
        // Need at least two points for a line segment
        validLinesData.push({
          lineObj: line,
          startIndex: currentStartIndex,
          numPoints: numPts,
          originalIndex: i, // Store the index from the input array
        });
        // Store original info based on the line's position in the valid subset (which corresponds to its final lineId)
        const lineId = validLinesData.length - 1; // The ID this line will have
        this.lineOriginalNumPointsCache[lineId] = numPts;
        this.lineStartIndexCache[lineId] = currentStartIndex;
        this.lineEnabledStatus[lineId] = true; // Enable valid lines by default

        currentStartIndex += numPts;
        totalValidPoints += numPts;
      } else {
        console.warn(`Skipping line at index ${i} with fewer than 2 points.`);
        // Ensure caches remain consistent for skipped indices if needed, though using lineId is safer
      }
    }
    this.numLines = validLinesData.length; // Update the count of *active* lines

    // --- Handle Case: No Valid Lines ---
    if (this.numLines === 0) {
      this.totalVertexCount = 0;
      this.pointsData = new Float32Array(0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RG32F,
        1,
        1,
        0,
        gl.RG,
        gl.FLOAT,
        new Float32Array([0, 0])
      ); // Minimal texture
      this.texWidth = 1;
      this.texHeight = 1;

      // Still allocate the full UBO, but fill with default/zero data
      const uboTotalSize = this.maxLines * this.lineDataStride;
      this.lineDataArrayBuffer = new ArrayBuffer(uboTotalSize);
      this.lineDataView = new DataView(this.lineDataArrayBuffer); // Zero-initialized by default
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
      gl.bufferData(
        gl.UNIFORM_BUFFER,
        this.lineDataArrayBuffer,
        gl.DYNAMIC_DRAW
      ); // Upload zeroed buffer
      gl.bindBuffer(gl.UNIFORM_BUFFER, null);
      gl.bindBufferBase(
        gl.UNIFORM_BUFFER,
        this.lineDataUBObindingPoint,
        this.lineDataUBO
      );

      // Clear VBO
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, 0, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      // Update texture size uniforms
      gl.useProgram(this.prog);
      if (this.locations.uTexWidth)
        gl.uniform1i(this.locations.uTexWidth, this.texWidth);
      if (this.locations.uTexHeight)
        gl.uniform1i(this.locations.uTexHeight, this.texHeight);
      gl.useProgram(null);

      console.warn("initLines called with no valid lines. Renderer cleared.");
      return;
    }

    // --- Prepare and Upload Texture Data (Points) ---
    // Use original data space points directly
    const allPoints = new Float32Array(totalValidPoints * 2);
    let currentPointOffset = 0;
    for (const data of validLinesData) {
      allPoints.set(data.lineObj.points, currentPointOffset);
      currentPointOffset += data.lineObj.points.length;
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);

    // Determine optimal texture dimensions
    const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.texWidth = Math.min(Math.max(1, totalValidPoints), maxTexSize); // Ensure width is at least 1
    this.texHeight = Math.ceil(totalValidPoints / this.texWidth);
    if (this.texHeight > maxTexSize) {
      // This should ideally not happen if maxLines * maxPointsPerLine is reasonable
      console.error(
        "Required texture height exceeds MAX_TEXTURE_SIZE. Data may be truncated."
      );
      this.texHeight = maxTexSize;
    }
    const totalTexels = this.texWidth * this.texHeight;

    // Allocate texture potentially larger than needed and fill with data
    const textureData = new Float32Array(totalTexels * 2); // *2 for RG channels (x,y)
    textureData.set(allPoints);
    this.pointsData = textureData; // Keep CPU copy

    gl.texImage2D(
      gl.TEXTURE_2D,
      0, // level
      gl.RG32F, // internal format (2 floats per pixel)
      this.texWidth,
      this.texHeight,
      0, // border
      gl.RG, // format
      gl.FLOAT, // type
      this.pointsData
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    // --- End Texture Data ---

    // --- Prepare Vertex Buffer Data (VBO with Degenerate Triangles) ---
    // The VBO structure depends ONLY on the number of lines and points,
    // NOT on whether a line is enabled. It's built once for max potential geometry.
    const floatsPerVertex = 3; // aLineId, aIndex, aSide
    const verticesPerPoint = 2; // Two vertices (sides) per point
    const degenerateVerticesPerJoin = 4; // Vertices for degenerate triangle strip between lines

    let calculatedTotalVertices = 0;
    // Use the actual number of lines initialized for VBO calculation
    for (let lineId = 0; lineId < this.numLines; lineId++) {
      calculatedTotalVertices +=
        this.lineOriginalNumPointsCache[lineId] * verticesPerPoint;
    }
    // Add degenerate vertices *between* the lines that were actually added
    if (this.numLines > 1) {
      calculatedTotalVertices +=
        (this.numLines - 1) * degenerateVerticesPerJoin;
    }
    this.totalVertexCount = calculatedTotalVertices;

    const vertexData = new Float32Array(
      this.totalVertexCount * floatsPerVertex
    );
    let vOffset = 0;

    for (let lineId = 0; lineId < this.numLines; lineId++) {
      const numPts = this.lineOriginalNumPointsCache[lineId]; // Use original count

      // Add vertices for this line
      for (let pointIdx = 0; pointIdx < numPts; pointIdx++) {
        vertexData[vOffset++] = lineId; // Line ID
        vertexData[vOffset++] = pointIdx; // Point index within line
        vertexData[vOffset++] = 1.0; // Side +1

        vertexData[vOffset++] = lineId; // Line ID
        vertexData[vOffset++] = pointIdx; // Point index within line
        vertexData[vOffset++] = -1.0; // Side -1
      }

      // Add degenerate vertices to break the triangle strip between lines
      if (lineId < this.numLines - 1) {
        const lastPtIdx = numPts - 1;
        const nextLineId = lineId + 1;
        const firstPtIdxNext = 0; // Assuming next line starts at index 0

        // Repeat last vertex of current line (side -1)
        vertexData[vOffset++] = lineId;
        vertexData[vOffset++] = lastPtIdx;
        vertexData[vOffset++] = -1.0;
        vertexData[vOffset++] = lineId; // Duplicate for strip break
        vertexData[vOffset++] = lastPtIdx;
        vertexData[vOffset++] = -1.0;

        // Repeat first vertex of next line (side +1)
        vertexData[vOffset++] = nextLineId;
        vertexData[vOffset++] = firstPtIdxNext;
        vertexData[vOffset++] = 1.0;
        vertexData[vOffset++] = nextLineId; // Duplicate for strip break
        vertexData[vOffset++] = firstPtIdxNext;
        vertexData[vOffset++] = 1.0;
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW); // Static because VBO structure rarely changes
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // --- End Vertex Buffer Data ---

    // --- Prepare and Upload Uniform Buffer Object (UBO) Data ---
    const uboTotalSize = this.maxLines * this.lineDataStride;
    if (this.lineDataArrayBuffer.byteLength !== uboTotalSize) {
      this.lineDataArrayBuffer = new ArrayBuffer(uboTotalSize);
      this.lineDataView = new DataView(this.lineDataArrayBuffer);
    } else {
      // Clear existing data if reusing buffer
      new Float32Array(this.lineDataArrayBuffer).fill(0);
    }

    for (let lineId = 0; lineId < this.numLines; lineId++) {
      const data = validLinesData[lineId]; // Get the data corresponding to this lineId
      const lineObj = data.lineObj;
      const byteOffset = lineId * this.lineDataStride;

      // Transform (use initial values provided)
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 0 * BYTES_PER_FLOAT,
        lineObj.scale[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 1 * BYTES_PER_FLOAT,
        lineObj.scale[1],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 2 * BYTES_PER_FLOAT,
        lineObj.offset[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 3 * BYTES_PER_FLOAT,
        lineObj.offset[1],
        true
      );

      // Color
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 0 * BYTES_PER_FLOAT,
        lineObj.color[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 1 * BYTES_PER_FLOAT,
        lineObj.color[1],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 2 * BYTES_PER_FLOAT,
        lineObj.color[2],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 3 * BYTES_PER_FLOAT,
        lineObj.color[3],
        true
      );

      // Indices (startIndex and numPoints)
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 0 * BYTES_PER_INT,
        data.startIndex,
        true
      );
      // IMPORTANT: Use the *original* number of points here, as the line starts enabled.
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 1 * BYTES_PER_INT,
        data.numPoints,
        true
      );
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 2 * BYTES_PER_INT,
        0,
        true
      ); // Unused
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 3 * BYTES_PER_INT,
        0,
        true
      ); // Unused

      // Thickness
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_THICKNESS,
        lineObj.thickness,
        true
      );
    }

    // Upload the entire UBO data
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    gl.bufferData(gl.UNIFORM_BUFFER, this.lineDataArrayBuffer, gl.DYNAMIC_DRAW); // Dynamic because transform/color/thickness/enabled can change
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    gl.bindBufferBase(
      gl.UNIFORM_BUFFER,
      this.lineDataUBObindingPoint,
      this.lineDataUBO
    );
    // --- End UBO Data ---

    // --- Upload Remaining Uniforms ---
    gl.useProgram(this.prog);
    if (this.locations.uTexWidth)
      gl.uniform1i(this.locations.uTexWidth, this.texWidth);
    if (this.locations.uTexHeight)
      gl.uniform1i(this.locations.uTexHeight, this.texHeight);
    gl.useProgram(null);
  }

  /**
   * Enables or disables rendering of specific lines.
   * @param lineIds An array of line indices (0 to numLines - 1) to modify.
   * @param enabled True to enable the lines, false to disable them.
   */
  public setLinesEnabled(lineIds: number[], enabled: boolean): void {
    const gl = this.gl;
    if (!this.lineDataUBO || !this.prog) return; // Need UBO and program

    const updatedIndices: {
      lineId: number;
      byteOffset: number;
      numPoints: number;
    }[] = [];

    for (const lineId of lineIds) {
      if (lineId < 0 || lineId >= this.numLines) {
        console.warn(
          `Invalid lineId ${lineId} passed to setLinesEnabled. Skipping.`
        );
        continue;
      }

      // Check if status is actually changing to avoid unnecessary updates
      if (this.lineEnabledStatus[lineId] !== enabled) {
        this.lineEnabledStatus[lineId] = enabled;
        const numPointsToSet = enabled
          ? this.lineOriginalNumPointsCache[lineId]
          : 0;
        const byteOffset =
          lineId * this.lineDataStride + OFFSET_INDICES + 1 * BYTES_PER_INT; // Offset of indices.y

        // Update CPU-side buffer immediately
        this.lineDataView.setInt32(byteOffset, numPointsToSet, true);

        updatedIndices.push({ lineId, byteOffset, numPoints: numPointsToSet });
      }
    }

    // Perform GPU updates if any changes were made
    if (updatedIndices.length > 0) {
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
      // Update each changed numPoints field individually using bufferSubData
      // This is generally efficient for sparse updates.
      for (const update of updatedIndices) {
        // Create a temporary Int32Array view for the single integer
        const int32View = new Int32Array([update.numPoints]);
        gl.bufferSubData(gl.UNIFORM_BUFFER, update.byteOffset, int32View);
      }
      gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }
  }

  /**
   * Enables or disables rendering of a single line.
   * @param lineId The index of the line (0 to numLines - 1) to modify.
   * @param enabled True to enable the line, false to disable it.
   */
  public setLineEnabled(lineId: number, enabled: boolean): void {
    this.setLinesEnabled([lineId], enabled); // Reuse the batch function
  }

  /**
   * Calculates the min/max bounds of the *original data* for all *enabled* lines
   * and updates the transform (scale and offset) of all *enabled* lines
   * to fit this combined bounding box into the NDC [-1, 1] range.
   *
   * Note: This performs calculations on the CPU and may be slow for
   * extremely large datasets. A GPU-based reduction could be faster but more complex.
   * This will overwrite any manual transforms set via updateLineTransform for the enabled lines.
   */
  public autoScaleEnabledLines(): void {
    if (this.numLines === 0) return; // No lines to scale

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let foundEnabledData = false;

    // Iterate through all potential lines
    for (let lineId = 0; lineId < this.numLines; lineId++) {
      // Only consider lines that are currently enabled
      if (this.lineEnabledStatus[lineId]) {
        const startIndex = this.lineStartIndexCache[lineId];
        const numPoints = this.lineOriginalNumPointsCache[lineId];

        if (numPoints > 0) {
          foundEnabledData = true;
          const endPointIndex = startIndex + numPoints;
          // Iterate through the points of this enabled line in the CPU buffer
          for (let ptIdx = startIndex; ptIdx < endPointIndex; ptIdx++) {
            const dataIdx = ptIdx * 2; // Index in the flat pointsData array
            const x = this.pointsData[dataIdx];
            const y = this.pointsData[dataIdx + 1];

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
    }

    let scaleX = 1.0;
    let scaleY = 1.0;
    let offsetX = 0.0;
    let offsetY = 0.0;

    if (foundEnabledData) {
      // Calculate range, handle zero range cases
      const rangeX = maxX - minX;
      const rangeY = maxY - minY;

      const ndcWidth = 2.0; // Target NDC width (-1 to 1)
      const ndcHeight = 2.0; // Target NDC height (-1 to 1)

      // Use a small epsilon to avoid division by zero if range is extremely small
      const epsilon = 1e-6;

      if (rangeX > epsilon) {
        scaleX = ndcWidth / rangeX;
      } else {
        scaleX = 1.0; // Avoid infinite scale, keep data centered
      }

      if (rangeY > epsilon) {
        scaleY = ndcHeight / rangeY;
      } else {
        scaleY = 1.0; // Avoid infinite scale, keep data centered
      }

      // Calculate offset to center the data in NDC space
      const centerX = minX + rangeX / 2.0;
      const centerY = minY + rangeY / 2.0;
      const ndcCenterX = 0.0;
      const ndcCenterY = 0.0;

      // Formula: ndc = data * scale + offset => offset = ndcCenter - dataCenter * scale
      offsetX = ndcCenterX - centerX * scaleX;
      offsetY = ndcCenterY - centerY * scaleY;
    } else {
      // No enabled data found, reset to default transform
      console.warn(
        "autoScaleEnabledLines called, but no enabled lines with data were found. Resetting transform to default."
      );
      scaleX = 1.0;
      scaleY = 1.0;
      offsetX = 0.0;
      offsetY = 0.0;
    }

    // Apply the calculated uniform scale and offset to all enabled lines
    const enabledLineIds = [];
    for (let lineId = 0; lineId < this.numLines; lineId++) {
      if (this.lineEnabledStatus[lineId]) {
        enabledLineIds.push(lineId);
      }
    }

    if (enabledLineIds.length > 0) {
      this.updateLinesTransform(
        enabledLineIds,
        [scaleX, scaleY],
        [offsetX, offsetY]
      );
    }
  }

  /**
   * Updates the transform (scale and offset) for multiple lines using UBO updates.
   * More efficient than calling updateLineTransform individually in a loop.
   * @param lineIds The indices of the lines to update (0 to numLines - 1).
   * @param scale The new [x, y] scale factors in NDC.
   * @param offset The new [x, y] offset in NDC.
   */
  public updateLinesTransform(
    lineIds: number[],
    scale: [number, number],
    offset: [number, number]
  ): void {
    const gl = this.gl;
    if (!this.lineDataUBO || !this.prog) return;

    const updatedTransforms: { byteOffset: number }[] = [];

    for (const lineId of lineIds) {
      if (lineId < 0 || lineId >= this.numLines) {
        console.warn(
          `Invalid lineId ${lineId} for transform update. Skipping.`
        );
        continue;
      }

      const byteOffset = lineId * this.lineDataStride + OFFSET_TRANSFORM;

      // Update CPU-side buffer first
      this.lineDataView.setFloat32(
        byteOffset + 0 * BYTES_PER_FLOAT,
        scale[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + 1 * BYTES_PER_FLOAT,
        scale[1],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + 2 * BYTES_PER_FLOAT,
        offset[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + 3 * BYTES_PER_FLOAT,
        offset[1],
        true
      );

      updatedTransforms.push({ byteOffset });
    }

    if (updatedTransforms.length > 0) {
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
      // Update each transform block
      for (const update of updatedTransforms) {
        // Create a view for the vec4 transform data (4 floats)
        const transformView = new Float32Array(
          this.lineDataArrayBuffer,
          update.byteOffset,
          4
        );
        gl.bufferSubData(gl.UNIFORM_BUFFER, update.byteOffset, transformView);
      }
      gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }
  }

  /**
   * Updates the transform (scale and offset) for a specific line using a UBO update.
   * @param lineId The index of the line to update (0 to numLines - 1).
   * @param scale The new [x, y] scale factors in NDC.
   * @param offset The new [x, y] offset in NDC.
   */
  public updateLineTransform(
    lineId: number,
    scale: [number, number],
    offset: [number, number]
  ): void {
    this.updateLinesTransform([lineId], scale, offset); // Reuse batch update
  }

  /**
   * Updates the color (and opacity) for a specific line using a UBO update.
   * @param lineId The index of the line to update (0 to numLines - 1).
   * @param color The new [r, g, b, a] color (0-1 range).
   */
  public updateLineColor(
    lineId: number,
    color: [number, number, number, number]
  ): void {
    if (lineId < 0 || lineId >= this.numLines) {
      console.warn(
        // Use warn
        `Invalid lineId for color update: ${lineId}. Range is [0, ${
          this.numLines - 1
        }].`
      );
      return;
    }
    const gl = this.gl;
    if (!this.lineDataUBO || !this.prog) return;

    const byteOffset = lineId * this.lineDataStride + OFFSET_COLOR;

    // Update CPU buffer
    this.lineDataView.setFloat32(
      byteOffset + 0 * BYTES_PER_FLOAT,
      color[0],
      true
    );
    this.lineDataView.setFloat32(
      byteOffset + 1 * BYTES_PER_FLOAT,
      color[1],
      true
    );
    this.lineDataView.setFloat32(
      byteOffset + 2 * BYTES_PER_FLOAT,
      color[2],
      true
    );
    this.lineDataView.setFloat32(
      byteOffset + 3 * BYTES_PER_FLOAT,
      color[3],
      true
    );

    // Update GPU buffer
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    // Create a view for the vec4 color data (4 floats)
    const colorView = new Float32Array(this.lineDataArrayBuffer, byteOffset, 4);
    gl.bufferSubData(gl.UNIFORM_BUFFER, byteOffset, colorView);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  /**
   * Updates the thickness for a specific line using a UBO update.
   * @param lineId The index of the line to update (0 to numLines - 1).
   * @param newThickness The new thickness value in NDC.
   */
  public updateLineThickness(lineId: number, newThickness: number): void {
    if (lineId < 0 || lineId >= this.numLines) {
      console.warn(
        // Use warn
        `Invalid lineId for thickness update: ${lineId}. Range is [0, ${
          this.numLines - 1
        }].`
      );
      return;
    }
    const gl = this.gl;
    if (!this.lineDataUBO || !this.prog) return;

    const byteOffset = lineId * this.lineDataStride + OFFSET_THICKNESS;

    // Update CPU buffer
    this.lineDataView.setFloat32(byteOffset, newThickness, true);

    // Update GPU buffer
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    // Create a view for the single float thickness data
    const thicknessView = new Float32Array(
      this.lineDataArrayBuffer,
      byteOffset,
      1
    );
    gl.bufferSubData(gl.UNIFORM_BUFFER, byteOffset, thicknessView);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  /**
   * Updates only the Y coordinates of the points for a given line in the points texture.
   * The line must have been previously initialized.
   * @param lineId The index of the line to update (0 to numLines - 1).
   * @param newY A Float32Array containing the new Y coordinates for the line's points.
   *             These coordinates should be in the *original* data space (consistent with initLines).
   */
  public updateLineY(lineId: number, newY: Float32Array): void {
    if (lineId < 0 || lineId >= this.numLines) {
      console.warn(
        // Use warn
        `Invalid lineId for updateLineY: ${lineId}. Range is [0, ${
          this.numLines - 1
        }].`
      );
      return;
    }
    if (!this.pointsTexture || !this.prog) return; // Need texture and program

    const numPts = this.lineOriginalNumPointsCache[lineId];
    if (newY.length !== numPts) {
      // Use Error for critical mismatches like this
      throw new Error(
        `Line ${lineId}: Length mismatch for updateLineY. Expected ${numPts} Y values but got ${newY.length}.`
      );
    }
    if (numPts <= 0) return; // Nothing to update

    const gl = this.gl;
    const startIdx = this.lineStartIndexCache[lineId]; // Global start index in the flat pointsData array

    // --- Update CPU-side copy ---
    // This is crucial for subsequent auto-scaling calls to use the latest data
    for (let i = 0; i < numPts; i++) {
      const pointGlobalIndex = startIdx + i;
      const yDataIndex = pointGlobalIndex * 2 + 1; // Index for the Y component
      if (yDataIndex < this.pointsData.length) {
        this.pointsData[yDataIndex] = newY[i];
      } else {
        console.error(
          `Index ${yDataIndex} out of bounds for pointsData (length ${this.pointsData.length}) in updateLineY for line ${lineId}. Aborting update for this line.`
        );
        return; // Stop if out of bounds
      }
    }

    // --- Update GPU texture ---
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);

    // Update the texture row by row, or in blocks within rows
    let currentGlobalIndex = startIdx;
    const endGlobalIndex = startIdx + numPts;

    while (currentGlobalIndex < endGlobalIndex) {
      const row = Math.floor(currentGlobalIndex / this.texWidth);
      const col = currentGlobalIndex % this.texWidth;
      const remainingInRow = this.texWidth - col;
      const remainingInLineSegment = endGlobalIndex - currentGlobalIndex;
      const numPointsInBlock = Math.min(remainingInRow, remainingInLineSegment);

      if (numPointsInBlock <= 0) break; // Should not happen if loop condition is correct

      // Calculate the offset and length IN FLOATS for the sub-array view
      const offsetFloats = currentGlobalIndex * 2; // *2 because each point is (x, y)
      const lengthFloats = numPointsInBlock * 2;

      // Create a Float32Array view into the relevant part of the pointsData buffer
      // Ensure byte offsets are handled correctly if pointsData itself is a view
      const subDataView = new Float32Array(
        this.pointsData.buffer,
        this.pointsData.byteOffset + offsetFloats * BYTES_PER_FLOAT,
        lengthFloats
      );

      // Update the rectangular region in the texture
      // Note: We upload both X and Y, even though only Y changed in pointsData.
      //       texSubImage2D requires rectangular data. Optimizing this further
      //       would require more complex texture formats or shaders.
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0, // level
        col, // xoffset
        row, // yoffset
        numPointsInBlock, // width (number of points/pixels)
        1, // height (always 1 row segment at a time)
        gl.RG, // format (matches texture format)
        gl.FLOAT, // type (matches texture type)
        subDataView // data source view
      );

      currentGlobalIndex += numPointsInBlock; // Move to the next block/row
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /**
   * Draws the lines. Only enabled lines will be visible.
   */
  public draw(): void {
    const gl = this.gl;
    // Only draw if there are vertices to process and program is ready
    if (
      this.totalVertexCount === 0 ||
      !this.prog ||
      !this.vao ||
      !this.pointsTexture ||
      !this.lineDataUBO
    )
      return;

    gl.useProgram(this.prog);

    // Bind necessary resources
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    gl.bindBufferBase(
      gl.UNIFORM_BUFFER,
      this.lineDataUBObindingPoint,
      this.lineDataUBO
    );
    gl.bindVertexArray(this.vao);

    // Draw all vertices defined in the VBO. The vertex shader handles
    // skipping/degenerating vertices corresponding to disabled lines.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.totalVertexCount);

    // Unbind resources (good practice)
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    // Unbind UBO from the indexed binding point AND the generic target
    gl.bindBufferBase(gl.UNIFORM_BUFFER, this.lineDataUBObindingPoint, null);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    gl.useProgram(null);
  }

  /**
   * Releases WebGL resources allocated by this instance.
   */
  public cleanup(): void {
    const gl = this.gl;
    if (this.prog) {
      gl.deleteProgram(this.prog);
      this.prog = null;
    }
    if (this.pointsTexture) {
      gl.deleteTexture(this.pointsTexture);
      this.pointsTexture = null;
    }
    if (this.vertexBuffer) {
      gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }
    if (this.lineDataUBO) {
      gl.deleteBuffer(this.lineDataUBO);
      this.lineDataUBO = null;
    }
    if (this.vao) {
      gl.deleteVertexArray(this.vao);
      this.vao = null;
    }

    // Clear CPU-side data and state
    this.pointsData = new Float32Array(0);
    this.lineDataArrayBuffer = new ArrayBuffer(0);
    this.lineDataView = new DataView(this.lineDataArrayBuffer);
    this.numLines = 0;
    this.totalVertexCount = 0;
    this.lineOriginalNumPointsCache = [];
    this.lineStartIndexCache = [];
    this.lineEnabledStatus = [];
    this.locations = { uPointsTex: null, uTexWidth: null, uTexHeight: null };

    console.log("WebglLineThick resources cleaned up.");
  }
}
