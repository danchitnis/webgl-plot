// --- Constants ---
// Offsets within the LineData struct in the UBO (std140 layout)
// struct LineData {
//   vec4 transform;  // offset 0, size 16 bytes
//   vec4 color;      // offset 16, size 16 bytes
//   ivec4 indices;   // offset 32, size 16 bytes
//   float thickness; // offset 48, size 4 bytes
//   // vec3 _padding;   // offset 52, size 12 bytes (implicit padding for std140)
// }; // Total size (stride) = 64 bytes (must be multiple of 16 due to vec4)
const OFFSET_TRANSFORM = 0;
const OFFSET_COLOR = 16;
const OFFSET_INDICES = 32;
const OFFSET_THICKNESS = 48; // New offset for thickness
const BYTES_PER_FLOAT = 4;
const BYTES_PER_INT = 4;
// Stride must be a multiple of the largest member's base alignment (vec4 = 16 bytes)
// 48 (offset of thickness) + 4 (size of thickness) = 52. Next multiple of 16 is 64.
const LINE_DATA_STRIDE = 64;

// Uniform locations (Thickness is now per-line in UBO, uNumLines removed)
type UniformLocationsMulti = {
  uPointsTex: WebGLUniformLocation | null;
  uTexWidth: WebGLUniformLocation | null;
  uTexHeight: WebGLUniformLocation | null;
  // uNumLines removed
};

// Input structure for initializing lines
export type LineInitData = {
  points: Float32Array; // Should contain [x1, y1, x2, y2, ...] in NDC [-1, 1]
  scale: [number, number]; // Per-line scale [scaleX, scaleY] in NDC
  offset: [number, number]; // Per-line offset [offsetX, offsetY] in NDC
  color: [number, number, number, number]; // Per-line color [r, g, b, a] (0-1)
  thickness: number; // Per-line thickness in Normalized Device Coordinates (NDC)
};

// --- Main Class ---
export class WebglLineThick {
  private gl: WebGL2RenderingContext;
  public prog: WebGLProgram | null;
  private maxLines: number;
  // private thickness: number; // Removed global thickness
  private pointsTexture: WebGLTexture | null;
  private vao: WebGLVertexArrayObject | null;
  private vertexBuffer: WebGLBuffer | null;
  private locations: UniformLocationsMulti;

  // UBO related members
  private lineDataUBO: WebGLBuffer | null;
  private lineDataUBObindingPoint: number = 0; // UBO binding point 0
  private lineDataStride: number = LINE_DATA_STRIDE; // Use calculated stride
  private lineDataArrayBuffer: ArrayBuffer = new ArrayBuffer(0); // CPU-side copy
  private lineDataView: DataView = new DataView(this.lineDataArrayBuffer);

  // Total vertex count for single draw call (includes degenerates)
  private totalVertexCount: number = 0;

  // The number of lines currently represented in the buffers/texture.
  private numLines: number = 0;

  // Points data texture related members
  private pointsData: Float32Array = new Float32Array(0); // CPU-side copy for updates
  private texWidth: number = 0;
  private texHeight: number = 0;
  // Store numPoints per line for validation in updateLineY
  private lineNumPointsCache: number[] = [];
  // Store start index per line for quick access in updates
  private lineStartIndexCache: number[] = [];

  /**
   * Creates an instance of WebglLineThick.
   * @param wglp Context wrapper object.
   * @param maxLines Maximum number of lines this instance can handle. Affects UBO size.
   */
  constructor(wglp: { gl: WebGL2RenderingContext }, maxLines: number) {
    this.gl = wglp.gl;
    // Ensure maxLines is positive
    this.maxLines = Math.max(1, maxLines);
    // Removed global thickness initialization
    const gl = this.gl;

    // --- Vertex Shader Source ---
    const vsSource = `#version 300 es
precision highp float; // Use highp for positions if possible
precision highp int;
#define MAX_LINES ${this.maxLines}

// --- Uniforms ---
uniform sampler2D uPointsTex; // Texture containing all line points (x,y)
uniform int uTexWidth;        // Width of the points texture
uniform int uTexHeight;       // Height of the points texture
// Removed: uniform int uNumLines;

// --- UBO Definition (std140 layout) ---
// Holds per-line data: transform, color, indices, thickness
struct LineData {
  vec4 transform; // scale.x, scale.y, offset.x, offset.y (all in NDC)
  vec4 color;     // r, g, b, a (0.0 to 1.0)
  ivec4 indices;  // start index in texture, number of points, unused, unused
  float thickness; // line thickness in NDC
  // Implicit padding to 64 bytes due to std140 rules
};

layout(std140) uniform LineDataBlock {
  LineData uLines[MAX_LINES];
};
// --- End UBO Definition ---

// --- Vertex Attributes ---
// These are read from the VBO for each vertex
in float aLineId;  // Index of the line this vertex belongs to (0 to numLines-1)
in float aIndex;   // Index of the point within the line (0 to numPoints-1)
in float aSide;    // Side offset direction (+1.0 or -1.0)

// --- Outputs to Fragment Shader ---
flat out vec4 vColor; // Pass color without interpolation

// --- Helper Function: Get Point from Texture ---
vec2 getPoint(int globalPointIndex) {
  // Calculate texture coordinates (u, v) for the given global point index
  int texX = globalPointIndex % uTexWidth;
  int texY = globalPointIndex / uTexWidth;
  // Add 0.5 to sample the center of the texel
  float u = (float(texX) + 0.5) / float(uTexWidth);
  float v = (float(texY) + 0.5) / float(uTexHeight);
  // Fetch the RG (xy) coordinates from the texture
  return texture(uPointsTex, vec2(u, v)).xy;
}

// --- Main Vertex Shader Logic ---
void main() {
  int lineId = int(aLineId);
  int localIndex = int(aIndex);

  // Access line data from UBO using the lineId
  int globalStartIndex = uLines[lineId].indices.x;
  int numPoints = uLines[lineId].indices.y;
  vec2 lineScale = uLines[lineId].transform.xy;
  vec2 lineOffset = uLines[lineId].transform.zw;
  float lineThickness = uLines[lineId].thickness; // Get thickness from UBO

  int globalIndex = globalStartIndex + localIndex;

  // Retrieve the current point and its neighbors from the texture
  vec2 p = getPoint(globalIndex);
  // Handle boundary conditions for neighbors carefully
  vec2 pPrev = (localIndex == 0) ? p : getPoint(globalStartIndex + max(0, localIndex - 1));
  vec2 pNext = (localIndex == numPoints - 1) ? p : getPoint(globalStartIndex + min(numPoints - 1, localIndex + 1));

  // Apply per-line transformation (scale and offset are in NDC)
  p = p * lineScale + lineOffset;
  pPrev = pPrev * lineScale + lineOffset;
  pNext = pNext * lineScale + lineOffset;

  // --- Calculate Miter/Bevel Normal ---
  vec2 offsetNormalDir; // Direction of the offset
  float offsetScale = 0.5 * lineThickness; // Half thickness magnitude

  vec2 dirToNext = pNext - p;
  vec2 dirFromPrev = p - pPrev;

  float lenToNext = length(dirToNext);
  float lenFromPrev = length(dirFromPrev);

  // Check for start/end points or coincident points (degenerate segments)
  bool isStart = (localIndex == 0);
  bool isEnd = (localIndex == numPoints - 1);
  bool prevCoincident = (lenFromPrev < 0.0001); // Use a small epsilon
  bool nextCoincident = (lenToNext < 0.0001);

  if ((isStart || prevCoincident) && (isEnd || nextCoincident)) {
     // Line has only one distinct point (or all points coincident)
     offsetNormalDir = vec2(0.0, 1.0);
  } else if (isStart || prevCoincident) {
     // Start of line, or previous point was coincident: Use only next direction
     vec2 dir = normalize(dirToNext);
     offsetNormalDir = vec2(-dir.y, dir.x); // Perpendicular
  } else if (isEnd || nextCoincident) {
     // End of line, or next point is coincident: Use only previous direction
     vec2 dir = normalize(dirFromPrev);
     offsetNormalDir = vec2(-dir.y, dir.x); // Perpendicular
  } else {
     // Regular interior point: Calculate miter join
     vec2 dir0 = normalize(dirFromPrev);
     vec2 dir1 = normalize(dirToNext);

     vec2 n0 = vec2(-dir0.y, dir0.x);
     vec2 n1 = vec2(-dir1.y, dir1.x);

     if (dot(dir0, dir1) < -0.999) { // Anti-parallel check
         offsetNormalDir = n1;
     } else {
         vec2 miterVec = normalize(n0 + n1);
         float miterDot = dot(miterVec, n1);
         float miterScale = 1.0 / max(miterDot, 0.01);

         float maxMiterScale = 5.0;
         if (miterScale > maxMiterScale) {
            offsetNormalDir = miterVec;
            offsetScale *= maxMiterScale;
         } else {
            offsetNormalDir = miterVec;
            offsetScale *= miterScale;
         }
     }
  }

  // Calculate final vertex position
  vec2 pos = p + offsetNormalDir * offsetScale * aSide;

  // Output position and color
  gl_Position = vec4(pos, 0.0, 1.0);
  vColor = uLines[lineId].color;
}
`;

    // --- Fragment Shader Source ---
    const fsSource = `#version 300 es
precision mediump float;
flat in vec4 vColor;
out vec4 fragColor;
void main() {
  fragColor = vColor;
}
`;

    // --- Shader Compilation and Linking Helper Functions ---
    // (createShader and createProgram functions remain the same)
    /**
     * Creates and compiles a shader.
     * @param gl The WebGL context.
     * @param type The shader type (VERTEX_SHADER or FRAGMENT_SHADER).
     * @param source The shader source code.
     * @returns The compiled shader.
     * @throws If shader creation or compilation fails.
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
        throw new Error(`Shader compile error: ${info}`);
      }
      return shader;
    }

    /**
     * Creates and links a WebGL program from vertex and fragment shaders.
     * @param gl The WebGL context.
     * @param vsSource Vertex shader source code.
     * @param fsSource Fragment shader source code.
     * @returns The linked WebGL program.
     * @throws If program creation or linking fails.
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
        // Clean up shaders if program creation failed
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        throw new Error("Could not create program object.");
      }

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      // Detach and delete shaders after linking (they are no longer needed)
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

    this.prog = createProgram(gl, vsSource, fsSource);
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

    const stride = 3 * BYTES_PER_FLOAT;
    const aLineIdLoc = 0;
    const aIndexLoc = 1;
    const aSideLoc = 2;

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
      // uNumLines location removed
    };
    // Basic check if locations were found (excluding uNumLines)
    if (
      !this.locations.uPointsTex ||
      !this.locations.uTexWidth ||
      !this.locations.uTexHeight
      // Removed check for uNumLines
    ) {
      // Adjust warning message
      console.warn(
        "One or more required uniform locations (uPointsTex, uTexWidth, uTexHeight) not found."
      );
      console.warn("Found Locations:", this.locations); // Log found locations for debugging
    }

    // --- Set Constant Uniforms ---
    gl.useProgram(this.prog);
    gl.uniform1i(this.locations.uPointsTex, 0); // Texture unit 0
    gl.useProgram(null);

    // --- Enable Blending ---
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * Initializes or updates the line data.
   * Uploads points to texture, builds VBO with degenerate triangles, and sets up UBO data.
   * @param lines An array of line objects to draw, including per-line thickness.
   */
  public initLines(lines: LineInitData[]): void {
    const gl = this.gl;

    // --- Input Validation and Filtering ---
    if (lines.length > this.maxLines) {
      console.error(
        `Attempted to initialize with ${lines.length} lines, but maxLines is ${this.maxLines}. Truncating.`
      );
      lines = lines.slice(0, this.maxLines);
    }

    const validLinesData: {
      lineObj: LineInitData;
      startIndex: number;
      numPoints: number;
    }[] = [];
    let currentStartIndex = 0;
    let totalValidPoints = 0;
    this.lineNumPointsCache = [];
    this.lineStartIndexCache = [];

    for (const line of lines) {
      const numPts = line.points.length / 2;
      if (numPts >= 2) {
        validLinesData.push({
          lineObj: line,
          startIndex: currentStartIndex,
          numPoints: numPts,
        });
        this.lineNumPointsCache.push(numPts);
        this.lineStartIndexCache.push(currentStartIndex);
        currentStartIndex += numPts;
        totalValidPoints += numPts;
      } else {
        console.warn("Skipping line with fewer than 2 points.");
      }
    }
    this.numLines = validLinesData.length;

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
      );
      this.texWidth = 1;
      this.texHeight = 1;

      const uboTotalSize = this.maxLines * this.lineDataStride;
      this.lineDataArrayBuffer = new ArrayBuffer(uboTotalSize);
      this.lineDataView = new DataView(this.lineDataArrayBuffer);
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
      gl.bufferData(gl.UNIFORM_BUFFER, uboTotalSize, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.UNIFORM_BUFFER, null);
      gl.bindBufferBase(
        gl.UNIFORM_BUFFER,
        this.lineDataUBObindingPoint,
        this.lineDataUBO
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, 0, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      // Update uniforms (excluding uNumLines)
      gl.useProgram(this.prog);
      if (this.locations.uTexWidth)
        gl.uniform1i(this.locations.uTexWidth, this.texWidth);
      if (this.locations.uTexHeight)
        gl.uniform1i(this.locations.uTexHeight, this.texHeight);
      // Removed: gl.uniform1i(this.locations.uNumLines, 0);
      gl.useProgram(null);

      console.warn("initLines called with no valid lines. Renderer cleared.");
      return;
    }

    // --- Prepare and Upload Texture Data (Points) ---
    const allPoints = new Float32Array(totalValidPoints * 2);
    let currentPointOffset = 0;
    for (const data of validLinesData) {
      allPoints.set(data.lineObj.points, currentPointOffset);
      currentPointOffset += data.lineObj.points.length;
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);

    const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.texWidth = Math.min(totalValidPoints, maxTexSize);
    this.texHeight = Math.ceil(totalValidPoints / this.texWidth);
    const totalTexels = this.texWidth * this.texHeight;

    const textureData = new Float32Array(totalTexels * 2);
    textureData.set(allPoints);
    this.pointsData = textureData;

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RG32F,
      this.texWidth,
      this.texHeight,
      0,
      gl.RG,
      gl.FLOAT,
      this.pointsData
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    // --- End Texture Data ---

    // --- Prepare Vertex Buffer Data (VBO with Degenerate Triangles) ---
    const floatsPerVertex = 3;
    const verticesPerPoint = 2;
    const degenerateVerticesPerJoin = 4;

    let calculatedTotalVertices = 0;
    validLinesData.forEach(
      (data) => (calculatedTotalVertices += data.numPoints * verticesPerPoint)
    );
    if (this.numLines > 1) {
      calculatedTotalVertices +=
        (this.numLines - 1) * degenerateVerticesPerJoin;
    }
    this.totalVertexCount = calculatedTotalVertices;

    const vertexData = new Float32Array(
      this.totalVertexCount * floatsPerVertex
    );
    let vOffset = 0;

    for (let lineIdx = 0; lineIdx < this.numLines; lineIdx++) {
      const data = validLinesData[lineIdx];
      const numPts = data.numPoints;

      for (let pointIdx = 0; pointIdx < numPts; pointIdx++) {
        vertexData[vOffset++] = lineIdx;
        vertexData[vOffset++] = pointIdx;
        vertexData[vOffset++] = 1.0; // Side +1
        vertexData[vOffset++] = lineIdx;
        vertexData[vOffset++] = pointIdx;
        vertexData[vOffset++] = -1.0; // Side -1
      }

      if (lineIdx < this.numLines - 1) {
        const lastPtIdx = numPts - 1;
        const nextLineIdx = lineIdx + 1;
        const firstPtIdxNext = 0;
        vertexData[vOffset++] = lineIdx;
        vertexData[vOffset++] = lastPtIdx;
        vertexData[vOffset++] = -1.0; // Degenerate 1
        vertexData[vOffset++] = lineIdx;
        vertexData[vOffset++] = lastPtIdx;
        vertexData[vOffset++] = -1.0; // Degenerate 2
        vertexData[vOffset++] = nextLineIdx;
        vertexData[vOffset++] = firstPtIdxNext;
        vertexData[vOffset++] = 1.0; // Degenerate 3
        vertexData[vOffset++] = nextLineIdx;
        vertexData[vOffset++] = firstPtIdxNext;
        vertexData[vOffset++] = 1.0; // Degenerate 4
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // --- End Vertex Buffer Data ---

    // --- Prepare and Upload Uniform Buffer Object (UBO) Data ---
    const uboTotalSize = this.maxLines * this.lineDataStride;
    if (this.lineDataArrayBuffer.byteLength !== uboTotalSize) {
      this.lineDataArrayBuffer = new ArrayBuffer(uboTotalSize);
      this.lineDataView = new DataView(this.lineDataArrayBuffer);
    }

    for (let lineIdx = 0; lineIdx < this.numLines; lineIdx++) {
      const data = validLinesData[lineIdx];
      const lineObj = data.lineObj;
      const byteOffset = lineIdx * this.lineDataStride;

      // Transform
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
      // Indices
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 0 * BYTES_PER_INT,
        data.startIndex,
        true
      );
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 1 * BYTES_PER_INT,
        data.numPoints,
        true
      );
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 2 * BYTES_PER_INT,
        0,
        true
      );
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 3 * BYTES_PER_INT,
        0,
        true
      );
      // Thickness
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_THICKNESS,
        lineObj.thickness,
        true
      );
    }

    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    gl.bufferData(gl.UNIFORM_BUFFER, this.lineDataArrayBuffer, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    gl.bindBufferBase(
      gl.UNIFORM_BUFFER,
      this.lineDataUBObindingPoint,
      this.lineDataUBO
    );
    // --- End UBO Data ---

    // --- Upload Remaining Uniforms ---
    gl.useProgram(this.prog);
    // Check if locations are valid before using them
    if (this.locations.uTexWidth)
      gl.uniform1i(this.locations.uTexWidth, this.texWidth);
    if (this.locations.uTexHeight)
      gl.uniform1i(this.locations.uTexHeight, this.texHeight);
    // Removed: gl.uniform1i(this.locations.uNumLines, this.numLines);
    gl.useProgram(null);
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
    if (lineId < 0 || lineId >= this.numLines) {
      console.error(
        `Invalid lineId for transform update: ${lineId}. Range is [0, ${
          this.numLines - 1
        }].`
      );
      return;
    }
    const gl = this.gl;
    const byteOffset = lineId * this.lineDataStride + OFFSET_TRANSFORM;

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

    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    // Use ArrayBufferView constructor that takes buffer, byteOffset, and length
    gl.bufferSubData(
      gl.UNIFORM_BUFFER,
      byteOffset,
      new Float32Array(this.lineDataArrayBuffer, byteOffset, 4)
    );
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
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
      console.error(
        `Invalid lineId for color update: ${lineId}. Range is [0, ${
          this.numLines - 1
        }].`
      );
      return;
    }
    const gl = this.gl;
    const byteOffset = lineId * this.lineDataStride + OFFSET_COLOR;

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

    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    gl.bufferSubData(
      gl.UNIFORM_BUFFER,
      byteOffset,
      new Float32Array(this.lineDataArrayBuffer, byteOffset, 4)
    );
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  /**
   * Updates the thickness for a specific line using a UBO update.
   * @param lineId The index of the line to update (0 to numLines - 1).
   * @param newThickness The new thickness value in NDC.
   */
  public updateLineThickness(lineId: number, newThickness: number): void {
    if (lineId < 0 || lineId >= this.numLines) {
      console.error(
        `Invalid lineId for thickness update: ${lineId}. Range is [0, ${
          this.numLines - 1
        }].`
      );
      return;
    }
    const gl = this.gl;
    const byteOffset = lineId * this.lineDataStride + OFFSET_THICKNESS;

    this.lineDataView.setFloat32(byteOffset, newThickness, true);

    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    // Update only the single float
    gl.bufferSubData(
      gl.UNIFORM_BUFFER,
      byteOffset,
      new Float32Array(this.lineDataArrayBuffer, byteOffset, 1)
    );
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  /**
   * Updates only the Y coordinates of the points for a given line in the points texture.
   * @param lineId The index of the line to update (0 to numLines - 1).
   * @param newY A Float32Array containing the new Y coordinates for the line's points.
   */
  public updateLineY(lineId: number, newY: Float32Array): void {
    if (lineId < 0 || lineId >= this.numLines) {
      console.error(
        `Invalid lineId for updateLineY: ${lineId}. Range is [0, ${
          this.numLines - 1
        }].`
      );
      return;
    }

    const numPts = this.lineNumPointsCache[lineId];
    if (newY.length !== numPts) {
      throw new Error(
        `Line ${lineId}: Length mismatch for updateLineY. Expected ${numPts} Y values but got ${newY.length}.`
      );
    }
    if (numPts <= 0) return;

    const gl = this.gl;
    const startIdx = this.lineStartIndexCache[lineId];

    // Update CPU-side copy
    for (let i = 0; i < numPts; i++) {
      const yDataIndex = (startIdx + i) * 2 + 1;
      if (yDataIndex < this.pointsData.length) {
        this.pointsData[yDataIndex] = newY[i];
      } else {
        console.error(
          `Index ${yDataIndex} out of bounds for pointsData (length ${this.pointsData.length}) in updateLineY.`
        );
        break;
      }
    }

    // Update GPU texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);

    let currentGlobalIndex = startIdx;
    const endGlobalIndex = startIdx + numPts;

    while (currentGlobalIndex < endGlobalIndex) {
      const row = Math.floor(currentGlobalIndex / this.texWidth);
      const col = currentGlobalIndex % this.texWidth;
      const remainingInRow = this.texWidth - col;
      const remainingInLine = endGlobalIndex - currentGlobalIndex;
      const numPointsInBlock = Math.min(remainingInRow, remainingInLine);

      if (numPointsInBlock <= 0) break;

      const offsetFloats = currentGlobalIndex * 2;
      const lengthFloats = numPointsInBlock * 2;

      if (offsetFloats + lengthFloats > this.pointsData.length) {
        console.error(`Texture update range exceeds pointsData length.`);
        break;
      }

      const subDataView = new Float32Array(
        this.pointsData.buffer,
        this.pointsData.byteOffset + offsetFloats * BYTES_PER_FLOAT,
        lengthFloats
      );

      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        col,
        row,
        numPointsInBlock,
        1,
        gl.RG,
        gl.FLOAT,
        subDataView
      );
      currentGlobalIndex += numPointsInBlock;
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /**
   * Draws all the lines managed by this instance using a single draw call.
   */
  public draw(): void {
    const gl = this.gl;
    if (this.totalVertexCount === 0) return;

    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    gl.bindBufferBase(
      gl.UNIFORM_BUFFER,
      this.lineDataUBObindingPoint,
      this.lineDataUBO
    );
    gl.bindVertexArray(this.vao);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.totalVertexCount);

    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null); // Unbind from generic target
    gl.useProgram(null);
  }

  /**
   * Releases WebGL resources allocated by this instance.
   */
  public cleanup(): void {
    const gl = this.gl;
    // Delete WebGL resources and set to null
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

    this.pointsData = new Float32Array(0);
    this.lineDataArrayBuffer = new ArrayBuffer(0);
    this.lineDataView = new DataView(this.lineDataArrayBuffer);
    this.numLines = 0;
    this.totalVertexCount = 0;
    this.lineNumPointsCache = [];
    this.lineStartIndexCache = [];
    this.locations = {
      uPointsTex: null,
      uTexWidth: null,
      uTexHeight: null,
    }; // Clear locations

    console.log("WebglLineThick resources cleaned up.");
  }
}
