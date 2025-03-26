// --- Constants ---
// Offsets within the LineData struct in the UBO (std140 layout)
// struct LineData {
//   vec4 transform; // offset 0, size 16 bytes
//   vec4 color;     // offset 16, size 16 bytes
//   ivec4 indices;  // offset 32, size 16 bytes
// }; // Total size (stride) = 48 bytes
const OFFSET_TRANSFORM = 0;
const OFFSET_COLOR = 16;
const OFFSET_INDICES = 32;
const BYTES_PER_FLOAT = 4;
const BYTES_PER_INT = 4;

// Simpler uniform location structure now
type UniformLocationsMulti = {
  uPointsTex: WebGLUniformLocation | null;
  uThickness: WebGLUniformLocation | null;
  uTexWidth: WebGLUniformLocation | null;
  uTexHeight: WebGLUniformLocation | null;
  uNumLines: WebGLUniformLocation | null;
};

// --- Main Class ---
export class WebglLineThick {
  private gl: WebGL2RenderingContext;
  public prog: WebGLProgram;
  private maxLines: number;
  private thickness: number;
  private pointsTexture: WebGLTexture;
  private vao: WebGLVertexArrayObject;
  private vertexBuffer: WebGLBuffer;
  private locations: UniformLocationsMulti;

  // UBO related members
  private lineDataUBO: WebGLBuffer;
  private lineDataUBObindingPoint: number = 0; // UBO binding point 0
  private lineDataStride: number; // Bytes per line in UBO (calculated later)
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

  /**
   * Creates an instance of WebglLineThick.
   * @param wglp Context wrapper object.
   * @param maxLines Maximum number of lines this instance can handle. Affects UBO size.
   * @param thickness Default thickness for lines in Normalized Device Coordinates (NDC).
   */
  constructor(
    wglp: { gl: WebGL2RenderingContext },
    maxLines: number,
    thickness: number
  ) {
    this.gl = wglp.gl;
    // Ensure maxLines is positive
    this.maxLines = Math.max(1, maxLines);
    this.thickness = thickness;
    const gl = this.gl;

    // --- Vertex Shader Source ---
    const vsSource = `#version 300 es
precision highp float; // Use highp for positions if possible
precision highp int;
#define MAX_LINES ${this.maxLines}

// --- Uniforms ---
uniform sampler2D uPointsTex; // Texture containing all line points (x,y)
uniform float uThickness;     // Line thickness in NDC
uniform int uTexWidth;        // Width of the points texture
uniform int uTexHeight;       // Height of the points texture

// --- UBO Definition (std140 layout) ---
// Holds per-line data: transform, color, indices
struct LineData {
  vec4 transform; // scale.x, scale.y, offset.x, offset.y (all in NDC)
  vec4 color;     // r, g, b, a (0.0 to 1.0)
  ivec4 indices;  // start index in texture, number of points, unused, unused
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

  int globalIndex = globalStartIndex + localIndex;

  // Retrieve the current point and its neighbors from the texture
  vec2 p = getPoint(globalIndex);
  // Handle boundary conditions for neighbors carefully
  // Use max/min to clamp indices within the valid range for the line [0, numPoints-1]
  vec2 pPrev = (localIndex == 0) ? p : getPoint(globalStartIndex + max(0, localIndex - 1));
  vec2 pNext = (localIndex == numPoints - 1) ? p : getPoint(globalStartIndex + min(numPoints - 1, localIndex + 1));

  // Apply per-line transformation (scale and offset are in NDC)
  // These operate on the raw points fetched from the texture
  p = p * lineScale + lineOffset;
  pPrev = pPrev * lineScale + lineOffset;
  pNext = pNext * lineScale + lineOffset;

  // --- Calculate Miter/Bevel Normal ---
  vec2 offsetNormal; // This will be the direction to offset the vertex
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
     // Create an arbitrary perpendicular (e.g., up) for thickness
     offsetNormal = vec2(0.0, 1.0) * uThickness * 0.5;
  } else if (isStart || prevCoincident) {
     // Start of line, or previous point was coincident: Use only next direction
     vec2 dir = normalize(dirToNext);
     offsetNormal = vec2(-dir.y, dir.x) * uThickness * 0.5; // Perpendicular
  } else if (isEnd || nextCoincident) {
     // End of line, or next point is coincident: Use only previous direction
     vec2 dir = normalize(dirFromPrev);
     offsetNormal = vec2(-dir.y, dir.x) * uThickness * 0.5; // Perpendicular
  } else {
     // Regular interior point: Calculate miter join
     vec2 dir0 = normalize(dirFromPrev);
     vec2 dir1 = normalize(dirToNext);

     // Normals for the segments before and after the current point
     vec2 n0 = vec2(-dir0.y, dir0.x);
     vec2 n1 = vec2(-dir1.y, dir1.x);

     // Miter direction is the average of the two normals
     vec2 miterVec = normalize(n0 + n1);

     // Calculate miter length scale factor to maintain thickness
     // This depends on the angle between the segments (related to dot(n0, n1))
     // Using dot(miterVec, n1) is numerically stable: it's cos(angle / 2)
     float miterDot = dot(miterVec, n1);
     float miterScale = 1.0 / max(miterDot, 0.01); // Avoid division by zero/small numbers

     // Apply Miter Limit to prevent excessively long spikes on sharp corners
     float maxMiterScale = 4.0; // Example limit: Miter length <= 4 * half-thickness
     if (miterScale > maxMiterScale) {
        // Miter limit exceeded: Use a bevel join instead (or simply clamp miter)
        // Clamping the miter is simpler:
        offsetNormal = miterVec * maxMiterScale * uThickness * 0.5;
        // A true bevel would require different logic or geometry generation
     } else {
        // Miter join is within limits
        offsetNormal = miterVec * miterScale * uThickness * 0.5;
     }
  }

  // Calculate final vertex position by offsetting along the calculated normal
  vec2 pos = p + offsetNormal * aSide;

  // Output position and color
  gl_Position = vec4(pos, 0.0, 1.0); // z=0, w=1 for 2D rendering
  vColor = uLines[lineId].color;     // Pass the line's color to fragment shader
}
`;

    // --- Fragment Shader Source ---
    const fsSource = `#version 300 es
precision mediump float; // Medium precision is usually fine for color

// Input from Vertex Shader (flat means no interpolation)
flat in vec4 vColor;

// Output color for the fragment
out vec4 fragColor;

void main() {
  // Simply output the color received from the vertex shader
  fragColor = vColor;
}
`;

    // --- Shader Compilation and Linking Helper Functions ---
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

    // Compile and link the program
    this.prog = createProgram(gl, vsSource, fsSource);
    gl.useProgram(this.prog); // Use program briefly for setup

    // --- UBO Setup ---
    const blockName = "LineDataBlock";
    const blockIndex = gl.getUniformBlockIndex(this.prog, blockName);
    if (blockIndex === gl.INVALID_INDEX) {
      // This should not happen if the shader compiled and the block is used
      console.warn(`Uniform block '${blockName}' not found or not active.`);
      // Consider throwing an error here as it's a critical part
    } else {
      // Assign the binding point (e.g., 0) to the uniform block
      gl.uniformBlockBinding(
        this.prog,
        blockIndex,
        this.lineDataUBObindingPoint
      );
    }
    // Calculate UBO stride based on std140 layout rules for the LineData struct
    // vec4 + vec4 + ivec4 = 16 + 16 + 16 = 48 bytes
    this.lineDataStride = (4 + 4 + 4) * BYTES_PER_FLOAT;
    // Create the buffer object for the UBO
    const ubo = gl.createBuffer();
    if (!ubo) throw new Error("Failed to create UBO buffer.");
    this.lineDataUBO = ubo;
    // Initial allocation will happen in initLines
    // --- End UBO Setup ---

    // --- Points Texture Setup ---
    const pointsTex = gl.createTexture();
    if (!pointsTex) throw new Error("Failed to create points texture.");
    this.pointsTexture = pointsTex;
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    // Clamp coordinates to edge, preventing sampling outside the texture
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // Use nearest neighbor filtering as points are discrete, no interpolation needed
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // Unbind texture for now
    gl.bindTexture(gl.TEXTURE_2D, null);
    // --- End Points Texture Setup ---

    // --- Vertex Buffer Object (VBO) Setup ---
    const vbo = gl.createBuffer();
    if (!vbo) throw new Error("Failed to create vertex buffer.");
    this.vertexBuffer = vbo;
    // VBO data will be uploaded in initLines
    // --- End VBO Setup ---

    // --- Vertex Array Object (VAO) Setup ---
    const vao = gl.createVertexArray();
    if (!vao) throw new Error("Failed to create vertex array object.");
    this.vao = vao;
    gl.bindVertexArray(this.vao); // Start defining VAO state

    // Bind the VBO to configure attribute pointers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    const stride = 3 * BYTES_PER_FLOAT; // Stride for aLineId, aIndex, aSide
    const aLineIdLoc = 0; // Explicit location if layout(location=...) is not used
    const aIndexLoc = 1;
    const aSideLoc = 2;

    // Configure attribute pointer for aLineId (float, 1 component)
    gl.enableVertexAttribArray(aLineIdLoc);
    gl.vertexAttribPointer(
      aLineIdLoc,
      1,
      gl.FLOAT,
      false,
      stride,
      0 * BYTES_PER_FLOAT
    );

    // Configure attribute pointer for aIndex (float, 1 component)
    gl.enableVertexAttribArray(aIndexLoc);
    gl.vertexAttribPointer(
      aIndexLoc,
      1,
      gl.FLOAT,
      false,
      stride,
      1 * BYTES_PER_FLOAT
    );

    // Configure attribute pointer for aSide (float, 1 component)
    gl.enableVertexAttribArray(aSideLoc);
    gl.vertexAttribPointer(
      aSideLoc,
      1,
      gl.FLOAT,
      false,
      stride,
      2 * BYTES_PER_FLOAT
    );

    // Unbind VAO and VBO to prevent accidental modification
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // --- End VAO Setup ---

    // --- Get Locations for Non-UBO Uniforms ---
    this.locations = {
      uPointsTex: gl.getUniformLocation(this.prog, "uPointsTex"),
      uThickness: gl.getUniformLocation(this.prog, "uThickness"),
      uTexWidth: gl.getUniformLocation(this.prog, "uTexWidth"),
      uTexHeight: gl.getUniformLocation(this.prog, "uTexHeight"),
      uNumLines: gl.getUniformLocation(this.prog, "uNumLines"),
    };
    // Basic check if locations were found
    if (
      !this.locations.uPointsTex ||
      !this.locations.uThickness ||
      !this.locations.uTexWidth ||
      !this.locations.uTexHeight ||
      !this.locations.uNumLines
    ) {
      console.warn("One or more standard uniform locations not found.");
    }

    // --- Set Constant Uniforms ---
    gl.useProgram(this.prog); // Ensure program is active
    // Tell the sampler uniform to use texture unit 0
    gl.uniform1i(this.locations.uPointsTex, 0);
    // Set the initial thickness
    gl.uniform1f(this.locations.uThickness, this.thickness);
    gl.useProgram(null); // Deactivate program for now

    // --- Enable Blending for Transparency ---
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * Initializes or updates the line data.
   * Uploads points to texture, builds VBO with degenerate triangles, and sets up UBO data.
   * @param lines An array of line objects to draw.
   */
  public initLines(
    lines: {
      points: Float32Array; // Should contain [x1, y1, x2, y2, ...] in NDC [-1, 1]
      scale: [number, number]; // Per-line scale [scaleX, scaleY] in NDC
      offset: [number, number]; // Per-line offset [offsetX, offsetY] in NDC
      color: [number, number, number, number]; // Per-line color [r, g, b, a] (0-1)
    }[]
  ): void {
    const gl = this.gl;

    // --- Input Validation and Filtering ---
    if (lines.length > this.maxLines) {
      // Too many lines requested, throw an error or log a warning and truncate
      console.error(
        `Attempted to initialize with ${lines.length} lines, but maxLines is ${this.maxLines}. Truncating.`
      );
      lines = lines.slice(0, this.maxLines);
      // OR: throw new Error(`This instance supports up to ${this.maxLines} lines. Requested: ${lines.length}`);
    }

    // Filter out lines with fewer than 2 points, as they cannot form a valid triangle strip segment
    // Store necessary info for valid lines only
    const validLinesData: {
      lineObj: (typeof lines)[0];
      startIndex: number;
      numPoints: number;
    }[] = [];
    let currentStartIndex = 0;
    let totalValidPoints = 0;
    this.lineNumPointsCache = []; // Reset cache for point counts

    for (const line of lines) {
      const numPts = line.points.length / 2;
      if (numPts >= 2) {
        validLinesData.push({
          lineObj: line,
          startIndex: currentStartIndex,
          numPoints: numPts,
        });
        this.lineNumPointsCache.push(numPts); // Store numPoints for this valid line
        currentStartIndex += numPts;
        totalValidPoints += numPts;
      } else {
        console.warn("Skipping line with fewer than 2 points.");
        // Push 0 to keep cache aligned if needed, or adjust indexing logic later
        // For simplicity, we only cache valid line point counts.
      }
    }
    this.numLines = validLinesData.length; // Update the count of active lines

    // --- Handle Case: No Valid Lines ---
    if (this.numLines === 0) {
      this.totalVertexCount = 0;

      // Clear or set minimal data for WebGL resources to avoid errors on draw
      this.pointsData = new Float32Array(0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
      // Upload a 1x1 transparent black texture
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

      // Allocate or clear UBO buffer
      this.lineDataArrayBuffer = new ArrayBuffer(
        this.maxLines * this.lineDataStride
      );
      this.lineDataView = new DataView(this.lineDataArrayBuffer); // Reset view
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
      // Allocate buffer size on GPU, content doesn't matter initially
      gl.bufferData(
        gl.UNIFORM_BUFFER,
        this.lineDataArrayBuffer.byteLength,
        gl.DYNAMIC_DRAW
      );
      gl.bindBuffer(gl.UNIFORM_BUFFER, null);
      gl.bindBufferBase(
        gl.UNIFORM_BUFFER,
        this.lineDataUBObindingPoint,
        this.lineDataUBO
      ); // Ensure binding

      // Clear VBO
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, 0, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      // Update uniforms
      gl.useProgram(this.prog);
      gl.uniform1i(this.locations.uTexWidth, this.texWidth);
      gl.uniform1i(this.locations.uTexHeight, this.texHeight);
      gl.uniform1i(this.locations.uNumLines, 0);
      gl.useProgram(null);

      console.warn(
        "initLines called with no valid lines (>= 2 points each). Renderer cleared."
      );
      return; // Exit early
    }

    // --- Prepare and Upload Texture Data (Points) ---
    const allPoints = new Float32Array(totalValidPoints * 2);
    let currentPointOffset = 0;
    for (const data of validLinesData) {
      allPoints.set(data.lineObj.points, currentPointOffset);
      currentPointOffset += data.lineObj.points.length;
    }

    gl.activeTexture(gl.TEXTURE0); // Work with texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);

    // Calculate texture dimensions needed to store all points
    const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.texWidth = Math.min(totalValidPoints, maxTexSize);
    this.texHeight = Math.ceil(totalValidPoints / this.texWidth);
    const totalTexels = this.texWidth * this.texHeight;

    // Create texture data array, potentially larger than allPoints if padding is needed
    const textureData = new Float32Array(totalTexels * 2); // RG32F -> 2 floats per texel
    textureData.set(allPoints);
    this.pointsData = textureData; // Store CPU copy (potentially padded)

    // Upload data to GPU texture
    gl.texImage2D(
      gl.TEXTURE_2D, // target
      0, // level
      gl.RG32F, // internal format (2x 32-bit floats per texel)
      this.texWidth, // width
      this.texHeight, // height
      0, // border (must be 0)
      gl.RG, // format (matches internal format)
      gl.FLOAT, // type (matches internal format)
      this.pointsData // data source
    );
    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind texture
    // --- End Texture Data ---

    // --- Prepare Vertex Buffer Data (VBO with Degenerate Triangles) ---
    const floatsPerVertex = 3; // aLineId, aIndex, aSide
    const verticesPerPoint = 2; // One vertex for each side (+1, -1)
    const degenerateVerticesPerJoin = 4; // Vertices needed to link two strips

    // Calculate total vertices needed: Sum of (points * 2) for all lines + (joins * 4)
    let calculatedTotalVertices = 0;
    for (const data of validLinesData) {
      calculatedTotalVertices += data.numPoints * verticesPerPoint;
    }
    if (this.numLines > 1) {
      calculatedTotalVertices +=
        (this.numLines - 1) * degenerateVerticesPerJoin;
    }
    this.totalVertexCount = calculatedTotalVertices; // Store final count

    const vertexData = new Float32Array(
      this.totalVertexCount * floatsPerVertex
    );
    let vOffset = 0; // Tracks current position (in floats) in vertexData

    for (let lineIdx = 0; lineIdx < this.numLines; lineIdx++) {
      const data = validLinesData[lineIdx];
      const numPts = data.numPoints;

      // Add vertices for the current line's triangle strip
      for (let pointIdx = 0; pointIdx < numPts; pointIdx++) {
        // Vertex for side +1.0
        vertexData[vOffset++] = lineIdx; // aLineId (use the index in the validLinesData array)
        vertexData[vOffset++] = pointIdx; // aIndex (local index within the line)
        vertexData[vOffset++] = 1.0; // aSide
        // Vertex for side -1.0
        vertexData[vOffset++] = lineIdx;
        vertexData[vOffset++] = pointIdx;
        vertexData[vOffset++] = -1.0;
      }

      // Add degenerate vertices to link to the *next* line strip, if this isn't the last line
      if (lineIdx < this.numLines - 1) {
        const lastPointIndexCurrentLine = numPts - 1;
        const nextLineIdx = lineIdx + 1;
        const firstPointIndexNextLine = 0; // Always starts at 0 for the next strip

        // 1. Duplicate the last vertex of the current line (using side -1.0)
        vertexData[vOffset++] = lineIdx;
        vertexData[vOffset++] = lastPointIndexCurrentLine;
        vertexData[vOffset++] = -1.0;

        // 2. Duplicate it again (creates degenerate triangle with previous vertex)
        vertexData[vOffset++] = lineIdx;
        vertexData[vOffset++] = lastPointIndexCurrentLine;
        vertexData[vOffset++] = -1.0;

        // 3. Duplicate the first vertex of the *next* line (using side +1.0)
        vertexData[vOffset++] = nextLineIdx;
        vertexData[vOffset++] = firstPointIndexNextLine;
        vertexData[vOffset++] = 1.0;

        // 4. Duplicate it again (creates degenerate triangle, links strips)
        vertexData[vOffset++] = nextLineIdx;
        vertexData[vOffset++] = firstPointIndexNextLine;
        vertexData[vOffset++] = 1.0;
      }
    }

    // Upload the combined vertex data to the GPU VBO
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW); // Static as topology is fixed
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // Unbind VBO
    // --- End Vertex Buffer Data ---

    // --- Prepare and Upload Uniform Buffer Object (UBO) Data ---
    const uboTotalSize = this.maxLines * this.lineDataStride; // Allocate for max potential lines
    this.lineDataArrayBuffer = new ArrayBuffer(uboTotalSize);
    this.lineDataView = new DataView(this.lineDataArrayBuffer);

    for (let lineIdx = 0; lineIdx < this.numLines; lineIdx++) {
      // Loop through valid lines only
      const data = validLinesData[lineIdx];
      const lineObj = data.lineObj;
      const byteOffset = lineIdx * this.lineDataStride; // Calculate offset based on valid line index

      // Pack transform (scale.x, scale.y, offset.x, offset.y) into vec4 slot
      // Using littleEndian = true (standard for most systems)
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

      // Pack color (r, g, b, a) into vec4 slot
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

      // Pack indices (start index in texture, num points, 0, 0) into ivec4 slot
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
      ); // Padding
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 3 * BYTES_PER_INT,
        0,
        true
      ); // Padding
    }

    // Upload the entire UBO data (or just the used part if preferred)
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    // Uploads the CPU buffer to the GPU buffer, replacing previous content
    gl.bufferData(gl.UNIFORM_BUFFER, this.lineDataArrayBuffer, gl.DYNAMIC_DRAW); // DYNAMIC for updates
    gl.bindBuffer(gl.UNIFORM_BUFFER, null); // Unbind

    // Ensure the UBO is bound to its designated binding point for the shader
    gl.bindBufferBase(
      gl.UNIFORM_BUFFER,
      this.lineDataUBObindingPoint,
      this.lineDataUBO
    );
    // --- End UBO Data ---

    // --- Upload Remaining Uniforms ---
    gl.useProgram(this.prog); // Activate program
    gl.uniform1i(this.locations.uTexWidth, this.texWidth);
    gl.uniform1i(this.locations.uTexHeight, this.texHeight);
    // Update the number of *active* lines being rendered
    gl.uniform1i(this.locations.uNumLines, this.numLines);
    gl.useProgram(null); // Deactivate program
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
    // Validate lineId against the number of currently active lines
    if (lineId < 0 || lineId >= this.numLines) {
      console.error(
        `Invalid lineId: ${lineId}. Must be between 0 and ${this.numLines - 1}.`
      );
      return;
    }
    const gl = this.gl;

    // Calculate byte offset for this line's transform data within the UBO
    const byteOffset = lineId * this.lineDataStride + OFFSET_TRANSFORM;
    const transformDataSize = 4 * BYTES_PER_FLOAT; // Size of vec4

    // Update the CPU-side copy first (this.lineDataView)
    this.lineDataView.setFloat32(
      byteOffset + 0 * BYTES_PER_FLOAT,
      scale[0],
      true
    ); // scale.x
    this.lineDataView.setFloat32(
      byteOffset + 1 * BYTES_PER_FLOAT,
      scale[1],
      true
    ); // scale.y
    this.lineDataView.setFloat32(
      byteOffset + 2 * BYTES_PER_FLOAT,
      offset[0],
      true
    ); // offset.x
    this.lineDataView.setFloat32(
      byteOffset + 3 * BYTES_PER_FLOAT,
      offset[1],
      true
    ); // offset.y

    // Upload *only* the updated transform data (16 bytes) to the GPU UBO
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    // Use bufferSubData to update a part of the existing buffer
    // Provide ArrayBufferView starting at the correct offset
    gl.bufferSubData(
      gl.UNIFORM_BUFFER,
      byteOffset, // Offset in GPU buffer to start writing
      new Uint8Array(this.lineDataArrayBuffer, byteOffset, transformDataSize),
      0, // Start at beginning of the view since offset is already applied in the view
      transformDataSize // Number of bytes to copy
    );
    gl.bindBuffer(gl.UNIFORM_BUFFER, null); // Unbind
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
    // Validate lineId
    if (lineId < 0 || lineId >= this.numLines) {
      console.error(
        `Invalid lineId: ${lineId}. Must be between 0 and ${this.numLines - 1}.`
      );
      return;
    }
    const gl = this.gl;

    // Calculate byte offset for this line's color data
    const byteOffset = lineId * this.lineDataStride + OFFSET_COLOR;
    const colorDataSize = 4 * BYTES_PER_FLOAT; // Size of vec4

    // Update the CPU-side copy first
    this.lineDataView.setFloat32(
      byteOffset + 0 * BYTES_PER_FLOAT,
      color[0],
      true
    ); // r
    this.lineDataView.setFloat32(
      byteOffset + 1 * BYTES_PER_FLOAT,
      color[1],
      true
    ); // g
    this.lineDataView.setFloat32(
      byteOffset + 2 * BYTES_PER_FLOAT,
      color[2],
      true
    ); // b
    this.lineDataView.setFloat32(
      byteOffset + 3 * BYTES_PER_FLOAT,
      color[3],
      true
    ); // a

    // Upload *only* the updated color data (16 bytes) to the GPU UBO
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    gl.bufferSubData(
      gl.UNIFORM_BUFFER,
      byteOffset,
      new Uint8Array(this.lineDataArrayBuffer, byteOffset, colorDataSize),
      0, // Start at beginning of the view since offset is already applied in the view
      colorDataSize
    );
    gl.bindBuffer(gl.UNIFORM_BUFFER, null); // Unbind
  }

  /**
   * Updates only the Y coordinates of the points for a given line in the points texture.
   * Uses texSubImage2D for efficient partial texture updates.
   * @param lineId The index of the line to update (0 to numLines - 1).
   * @param newY A Float32Array containing the new Y coordinates for the line's points.
   */
  public updateLineY(lineId: number, newY: Float32Array): void {
    // Validate lineId
    if (lineId < 0 || lineId >= this.numLines) {
      console.error(
        `Invalid lineId for updateLineY: ${lineId}. Must be between 0 and ${
          this.numLines - 1
        }.`
      );
      return;
    }

    // Retrieve expected number of points for this line from cache
    const numPts = this.lineNumPointsCache[lineId];

    // Validate length of new Y data
    if (newY.length !== numPts) {
      throw new Error(
        `Line ${lineId}: Length mismatch for updateLineY. Expected ${numPts} Y values but got ${newY.length}.`
      );
    }
    // If line has no points (shouldn't happen if filtered in initLines), nothing to do
    if (numPts <= 0) {
      return;
    }

    const gl = this.gl;
    // Get the starting global point index for this line from the UBO data view
    const indicesByteOffset = lineId * this.lineDataStride + OFFSET_INDICES;
    const startIdx = this.lineDataView.getInt32(
      indicesByteOffset + 0 * BYTES_PER_INT,
      true
    );

    // --- Update the CPU-side copy (this.pointsData) ---
    // Iterate through the points of the specified line
    for (let i = 0; i < numPts; i++) {
      const pointGlobalIndex = startIdx + i;
      // Calculate the index in pointsData: Each point is (X, Y), so Y is at index * 2 + 1
      const yDataIndex = pointGlobalIndex * 2 + 1;

      // Safety check: Ensure index is within bounds of the CPU array
      if (yDataIndex < this.pointsData.length) {
        this.pointsData[yDataIndex] = newY[i];
      } else {
        // This indicates a serious issue, likely with startIdx or numPts calculation
        console.error(
          `Calculated index ${yDataIndex} out of bounds for pointsData (length ${this.pointsData.length}) during updateLineY.`
        );
        break; // Stop updating if out of bounds
      }
    }
    // --- End CPU-side update ---

    // --- Update the GPU texture using texSubImage2D ---
    gl.activeTexture(gl.TEXTURE0); // Ensure correct texture unit
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);

    // Update potentially multiple rows in the texture if the line's points wrap
    let currentGlobalIndex = startIdx;
    const endGlobalIndex = startIdx + numPts;

    while (currentGlobalIndex < endGlobalIndex) {
      // Calculate row and column in the texture for the current point
      const row = Math.floor(currentGlobalIndex / this.texWidth);
      const col = currentGlobalIndex % this.texWidth;

      // Determine how many points starting from 'currentGlobalIndex' are contiguous in this row
      const remainingTexelsInRow = this.texWidth - col;
      const remainingPointsInLine = endGlobalIndex - currentGlobalIndex;
      const numPointsInBlock = Math.min(
        remainingTexelsInRow,
        remainingPointsInLine
      );

      if (numPointsInBlock <= 0) break; // Should not happen, but safety check

      // Calculate the slice of the CPU pointsData array to upload
      // Offset in pointsData (float array): start index * 2 floats/point
      const offsetInPointsData = currentGlobalIndex * 2;
      // Length of the slice (in floats): num points * 2 floats/point (RG)
      const blockLengthFloats = numPointsInBlock * 2;

      // Safety check: Ensure the slice is within the bounds of pointsData
      if (offsetInPointsData + blockLengthFloats > this.pointsData.length) {
        console.error(
          `Texture update range [${offsetInPointsData}, ${
            offsetInPointsData + blockLengthFloats
          }) exceeds pointsData length (${this.pointsData.length}).`
        );
        break; // Stop update process
      }

      // Create an ArrayBufferView (Float32Array) pointing to the relevant part of pointsData
      // This view doesn't copy the data, it just references it.
      const subDataView = new Float32Array(
        this.pointsData.buffer,
        this.pointsData.byteOffset + offsetInPointsData * BYTES_PER_FLOAT,
        blockLengthFloats
      );

      // Update the sub-region of the GPU texture
      gl.texSubImage2D(
        gl.TEXTURE_2D, // target
        0, // level (mipmap level)
        col, // xoffset (in texels)
        row, // yoffset (in texels)
        numPointsInBlock, // width (number of texels to update)
        1, // height (always 1 row at a time)
        gl.RG, // format (must match original texImage2D format)
        gl.FLOAT, // type (must match original texImage2D type)
        subDataView // data source (the view we created)
      );

      // Move to the starting index of the next block
      currentGlobalIndex += numPointsInBlock;
    }
    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind texture
    // --- End Texture Update ---
  }

  /**
   * Draws all the lines managed by this instance using a single draw call.
   */
  public draw(): void {
    const gl = this.gl;

    // If no vertices were generated (e.g., no valid lines), do nothing
    if (this.totalVertexCount === 0) {
      return;
    }

    gl.useProgram(this.prog); // Activate the shader program

    // --- Bind Resources ---
    // 1. Bind the points texture to texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    // (The uPointsTex uniform is already set to 0 in the constructor)

    // 2. Bind the UBO containing line data to its binding point
    // Although bindBufferBase should persist, rebinding can be safer depending on context management.
    gl.bindBufferBase(
      gl.UNIFORM_BUFFER,
      this.lineDataUBObindingPoint,
      this.lineDataUBO
    );

    // 3. Bind the Vertex Array Object (VAO)
    // This automatically binds the associated VBO (vertexBuffer) and configures attribute pointers.
    gl.bindVertexArray(this.vao);
    // --- End Resource Binding ---

    // --- Execute Single Draw Call ---
    // Draw using TRIANGLE_STRIP topology.
    // Starts from the first vertex (offset 0).
    // Draws 'totalVertexCount' vertices, which includes the degenerate vertices.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.totalVertexCount);
    // --- End Draw Call ---

    // --- Unbind Resources (Good Practice) ---
    gl.bindVertexArray(null); // Unbind VAO
    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind texture from TEXTURE_2D target
    // Unbind UBO from the generic UNIFORM_BUFFER target (optional but clean)
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    // Note: UBO remains bound to the binding point via bindBufferBase, which is intended.
    gl.useProgram(null); // Deactivate program
  }

  /**
   * Releases WebGL resources allocated by this instance.
   * Call this when the line renderer is no longer needed to prevent memory leaks.
   */
  public cleanup(): void {
    const gl = this.gl;
    if (this.prog) gl.deleteProgram(this.prog);
    if (this.pointsTexture) gl.deleteTexture(this.pointsTexture);
    if (this.vertexBuffer) gl.deleteBuffer(this.vertexBuffer);
    if (this.lineDataUBO) gl.deleteBuffer(this.lineDataUBO);
    if (this.vao) gl.deleteVertexArray(this.vao);

    // Reset internal state
    this.pointsData = new Float32Array(0);
    this.lineDataArrayBuffer = new ArrayBuffer(0);
    this.lineDataView = new DataView(this.lineDataArrayBuffer);
    this.numLines = 0;
    this.totalVertexCount = 0;
    this.lineNumPointsCache = [];
    // Nullify WebGL object references
    // @ts-expect-error Property 'prog' does not exist on type 'WebglLineThick'.
    this.prog = null;
    // @ts-expect-error Property 'pointsTexture' does not exist on type 'WebglLineThick'.
    this.pointsTexture = null;
    // @ts-expect-error Property 'vertexBuffer' does not exist on type 'WebglLineThick'.
    this.vertexBuffer = null;
    // @ts-expect-error Property 'lineDataUBO' does not exist on type 'WebglLineThick'.
    this.lineDataUBO = null;
    // @ts-expect-error Property 'vao' does not exist on type 'WebglLineThick
    this.vao = null;
    // @ts-expect-error Property 'locations' does not exist on type 'WebglLineThick'.
    this.locations = {};

    console.log("WebglLineThick resources cleaned up.");
  }
}
