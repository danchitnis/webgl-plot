// Offsets within the LineData struct in the UBO (std140 layout)
// struct LineData {
//   vec4 transform; // offset 0, size 16
//   vec4 color;     // offset 16, size 16
//   ivec4 indices;  // offset 32, size 16
// }; // Total size (stride) = 48 bytes
const OFFSET_TRANSFORM = 0;
const OFFSET_COLOR = 16;
const OFFSET_INDICES = 32;
const BYTES_PER_FLOAT = 4;
const BYTES_PER_INT = 4;

// Simpler uniform location structure now
type UniformLocationsMulti = {
  uPointsTex: WebGLUniformLocation;
  uThickness: WebGLUniformLocation;
  uTexWidth: WebGLUniformLocation;
  uTexHeight: WebGLUniformLocation;
  uNumLines: WebGLUniformLocation; // Still useful for loops or checks if needed, though not directly by shader for per-line data
};

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
  private lineDataUBObindingPoint: number = 0; // Choose a binding point
  private lineDataStride: number; // Bytes per line in UBO (calculated based on std140)
  private lineDataArrayBuffer: ArrayBuffer = new ArrayBuffer(0); // CPU-side copy of UBO data
  private lineDataView: DataView = new DataView(this.lineDataArrayBuffer);

  // Draw-call info per line.
  private lineDrawCalls: { offset: number; count: number }[] = [];

  // The number of lines currently uploaded.
  private numLines: number = 0;

  // Points data (texture)
  private pointsData: Float32Array = new Float32Array(0); // CPU-side copy for updates
  private texWidth: number = 0;
  private texHeight: number = 0;
  // Store numPoints per line for validation in updateLineY
  private lineNumPointsCache: number[] = [];

  constructor(
    wglp: { gl: WebGL2RenderingContext },
    maxLines: number,
    thickness: number
  ) {
    this.gl = wglp.gl;
    this.maxLines = maxLines;
    this.thickness = thickness;
    const gl = this.gl;

    // --- Vertex Shader with UBO ---
    const vsSource = `#version 300 es
precision mediump float;
#define MAX_LINES ${this.maxLines}

// Uniforms no longer passed individually per-line
uniform sampler2D uPointsTex;
uniform float uThickness;
uniform int uTexWidth;
uniform int uTexHeight;
// uniform int uNumLines; // Potentially useful if needed, but not for per-line data access

// --- UBO Definition (std140 layout is implicit for UBOs) ---
struct LineData {
  vec4 transform; // scale.x, scale.y, offset.x, offset.y
  vec4 color;     // r, g, b, a
  ivec4 indices;  // start, numPoints, unused, unused
};

layout(std140) uniform LineDataBlock {
  LineData uLines[MAX_LINES];
};
// --- End UBO Definition ---

in float aLineId;  // which line (index)
in float aIndex;   // index within that line
in float aSide;    // +1.0 or -1.0

flat out vec4 vColor;

vec2 getPoint(int idx) {
  int texX = idx % uTexWidth;
  int texY = idx / uTexWidth;
  float u = (float(texX) + 0.5) / float(uTexWidth);
  float v = (float(texY) + 0.5) / float(uTexHeight);
  return texture(uPointsTex, vec2(u, v)).xy;
}

void main() {
  int lineId = int(aLineId);
  int localIndex = int(aIndex);

  // Access UBO data
  int globalIndex = uLines[lineId].indices.x + localIndex;
  int numPoints = uLines[lineId].indices.y;
  vec2 lineScale = uLines[lineId].transform.xy;
  vec2 lineOffset = uLines[lineId].transform.zw;

  // Retrieve the current point and its neighbors.
  vec2 p = getPoint(globalIndex);
  // Use max/min to prevent reading out of bounds due to potential floating point inaccuracies in aIndex
  vec2 pPrev = (localIndex == 0) ? p : getPoint(uLines[lineId].indices.x + max(0, localIndex - 1));
  vec2 pNext = (localIndex == numPoints - 1) ? p : getPoint(uLines[lineId].indices.x + min(numPoints - 1, localIndex + 1));

  // Apply per-line transformation (scale and offset are in ND).
  p = p * lineScale + lineOffset;
  pPrev = pPrev * lineScale + lineOffset;
  pNext = pNext * lineScale + lineOffset;

  vec2 offsetNormal;
  vec2 dirToNext = pNext - p;
  vec2 dirFromPrev = p - pPrev;

  // Handle degenerate cases (coincident points)
  if (localIndex == 0 || length(dirFromPrev) < 0.0001) {
      if (length(dirToNext) < 0.0001) {
           // Single point or all points coincident - use arbitrary perpendicular
           offsetNormal = vec2(0.0, 1.0) * uThickness * 0.5;
       } else {
          // Start of line or previous point was coincident
          vec2 dir = normalize(dirToNext);
          offsetNormal = vec2(-dir.y, dir.x) * uThickness * 0.5;
       }
  } else if (localIndex == numPoints - 1 || length(dirToNext) < 0.0001) {
      // End of line or next point is coincident
      vec2 dir = normalize(dirFromPrev);
      offsetNormal = vec2(-dir.y, dir.x) * uThickness * 0.5;
  } else {
      // Regular miter join
      vec2 dir0 = normalize(dirFromPrev);
      vec2 dir1 = normalize(dirToNext);
      vec2 n0 = vec2(-dir0.y, dir0.x);
      vec2 n1 = vec2(-dir1.y, dir1.x);
      vec2 miterVec = normalize(n0 + n1);

      // Miter limit calculation (prevent excessively long spikes)
      // Angle between vectors: dot(dir0, dir1) = cos(theta)
      // Angle between normals: dot(n0, n1) = cos(phi) = cos(PI - theta) = -cos(theta)
      // Miter length / thickness = 1 / cos(half_angle)
      // Using dot(miterVec, n1) which is related to cos(half_angle)
      float miterDot = dot(miterVec, n1); // Should be positive
      float miterScale = 1.0 / max(miterDot, 0.01); // Prevent division by zero or near-zero
      float maxMiterScale = 4.0; // Limit miter length (e.g., 4x thickness)

      if (miterScale > maxMiterScale) {
          // Bevel join: Use the two normals scaled appropriately
          // Find intersection point if needed, or just use simple bevel calculation
          // For simplicity, just clip the miter
           offsetNormal = miterVec * maxMiterScale * uThickness * 0.5;
           // A true bevel would require different geometry/shader logic
      } else {
          offsetNormal = miterVec * miterScale * uThickness * 0.5;
      }
  }

  vec2 pos = p + offsetNormal * aSide;
  gl_Position = vec4(pos, 0.0, 1.0);

  // Fetch the color for this line from the UBO.
  vColor = uLines[lineId].color;
}
`;

    // Fragment shader (unchanged)
    const fsSource = `#version 300 es
precision mediump float;
flat in vec4 vColor;
out vec4 fragColor;
void main() {
  fragColor = vColor;
}
`;

    // Assume createShader and createProgram are defined as before...
    function createShader(
      gl: WebGL2RenderingContext,
      type: number,
      source: string
    ): WebGLShader {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Could not create shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error("Shader compile error: " + gl.getShaderInfoLog(shader));
      }
      return shader;
    }
    function createProgram(
      gl: WebGL2RenderingContext,
      vsSource: string,
      fsSource: string
    ): WebGLProgram {
      const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
      const program = gl.createProgram();
      if (!program) throw new Error("Could not create program");
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("Program link error: " + gl.getProgramInfoLog(program));
      }
      // It's good practice to delete shaders after linking
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return program;
    }

    this.prog = createProgram(gl, vsSource, fsSource);
    gl.useProgram(this.prog);

    // --- UBO Setup ---
    const blockName = "LineDataBlock";
    const blockIndex = gl.getUniformBlockIndex(this.prog, blockName);
    if (blockIndex === gl.INVALID_INDEX) {
      console.warn(`Uniform block '${blockName}' not found or not active.`);
      // Handle error appropriately - maybe throw
    } else {
      // Assign the binding point to the uniform block
      gl.uniformBlockBinding(
        this.prog,
        blockIndex,
        this.lineDataUBObindingPoint
      );
    }

    // Calculate UBO stride (should be 48 bytes: vec4 + vec4 + ivec4 in std140)
    // We hardcode based on std140 rules, but checking active uniform block size could verify.
    this.lineDataStride = 3 * 4 * BYTES_PER_FLOAT; // 3 vec4-equivalent fields (transform, color, indices)

    this.lineDataUBO = gl.createBuffer()!;
    // --- End UBO Setup ---

    // Create the texture that will hold all the line points (unchanged)
    this.pointsTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // Create the vertex buffer (unchanged)
    this.vertexBuffer = gl.createBuffer()!;

    // Set up the VAO (unchanged)
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    // aLineId (location 0)
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 3 * BYTES_PER_FLOAT, 0);
    // aIndex (location 1)
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(
      1,
      1,
      gl.FLOAT,
      false,
      3 * BYTES_PER_FLOAT,
      1 * BYTES_PER_FLOAT
    );
    // aSide (location 2)
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(
      2,
      1,
      gl.FLOAT,
      false,
      3 * BYTES_PER_FLOAT,
      2 * BYTES_PER_FLOAT
    );
    gl.bindVertexArray(null); // Unbind VAO
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // Unbind VBO

    // Look up remaining uniform locations.
    this.locations = {
      uPointsTex: gl.getUniformLocation(this.prog, "uPointsTex")!,
      uThickness: gl.getUniformLocation(this.prog, "uThickness")!,
      uTexWidth: gl.getUniformLocation(this.prog, "uTexWidth")!,
      uTexHeight: gl.getUniformLocation(this.prog, "uTexHeight")!,
      uNumLines: gl.getUniformLocation(this.prog, "uNumLines")!,
      // Locations for array uniforms removed
    };

    // Set up constant uniforms.
    gl.useProgram(this.prog);
    gl.uniform1i(this.locations.uPointsTex, 0); // Texture unit 0
    gl.uniform1f(this.locations.uThickness, this.thickness);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * Update the lines.
   */
  public initLines(
    lines: {
      points: Float32Array;
      scale: [number, number];
      offset: [number, number];
      color: [number, number, number, number];
    }[]
  ) {
    const gl = this.gl;
    if (lines.length > this.maxLines) {
      throw new Error(
        `This shader supports up to ${this.maxLines} lines. Requested: ${lines.length}`
      );
    }
    this.numLines = lines.length;
    this.lineNumPointsCache = []; // Reset cache

    // --- Prepare Texture Data (largely unchanged) ---
    let totalPoints = 0;
    const tempLineStart: number[] = []; // Temporary needed for UBO indices
    const tempLineNumPoints: number[] = []; // Temporary needed for UBO indices

    for (let i = 0; i < lines.length; i++) {
      tempLineStart[i] = totalPoints;
      const numPts = lines[i].points.length / 2;
      tempLineNumPoints[i] = numPts;
      this.lineNumPointsCache.push(numPts); // Store for later validation
      totalPoints += numPts;
    }

    const allPoints = new Float32Array(totalPoints * 2);
    let offsetPts = 0;
    for (let i = 0; i < lines.length; i++) {
      allPoints.set(lines[i].points, offsetPts);
      offsetPts += lines[i].points.length;
    }

    gl.activeTexture(gl.TEXTURE0 + 0); // Use texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    // Ensure texWidth isn't zero if totalPoints is zero
    const texWidth = totalPoints > 0 ? Math.min(totalPoints, maxTexSize) : 1;
    const texHeight = totalPoints > 0 ? Math.ceil(totalPoints / texWidth) : 1;
    this.texWidth = texWidth;
    this.texHeight = texHeight;
    const totalTexels = texWidth * texHeight;
    const data2D = new Float32Array(totalTexels * 2); // RG32F means 2 floats per texel
    data2D.set(allPoints);
    this.pointsData = data2D; // Save CPU copy

    // Check if TEXTURE_IMMUTABLE_FORMAT is set, use texStorage2D if so, otherwise texImage2D
    // For simplicity, using texImage2D which allows respecification
    gl.texImage2D(
      gl.TEXTURE_2D,
      0, // level
      gl.RG32F, // internal format
      texWidth,
      texHeight,
      0, // border
      gl.RG, // format
      gl.FLOAT, // type
      this.pointsData // data
    );
    // --- End Texture Data ---

    // --- Prepare Vertex Buffer Data (unchanged structure) ---
    const vertexData = new Float32Array(totalPoints * 2 * 3); // 2 vertices per point, 3 floats per vertex
    let vOffset = 0;
    this.lineDrawCalls = [];
    let vertexCountSoFar = 0;
    for (let lineId = 0; lineId < lines.length; lineId++) {
      const numPts = tempLineNumPoints[lineId];
      if (numPts <= 0) continue; // Skip lines with no points

      const drawCount = numPts * 2; // 2 vertices per point for the strip
      this.lineDrawCalls.push({ offset: vertexCountSoFar, count: drawCount });

      for (let i = 0; i < numPts; i++) {
        // Vertex for side +1.0
        vertexData[vOffset++] = lineId; // aLineId
        vertexData[vOffset++] = i; // aIndex
        vertexData[vOffset++] = 1.0; // aSide
        // Vertex for side -1.0
        vertexData[vOffset++] = lineId; // aLineId
        vertexData[vOffset++] = i; // aIndex
        vertexData[vOffset++] = -1.0; // aSide
      }
      vertexCountSoFar += drawCount;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // Unbind VBO
    // --- End Vertex Buffer Data ---

    // --- Prepare and Upload UBO Data ---
    const uboTotalSize = this.maxLines * this.lineDataStride;
    this.lineDataArrayBuffer = new ArrayBuffer(uboTotalSize);
    this.lineDataView = new DataView(this.lineDataArrayBuffer);

    for (let lineId = 0; lineId < lines.length; lineId++) {
      const line = lines[lineId];
      const byteOffset = lineId * this.lineDataStride;

      // Pack transform (scale.x, scale.y, offset.x, offset.y) -> vec4
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 0 * BYTES_PER_FLOAT,
        line.scale[0],
        true
      ); // true for littleEndian
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 1 * BYTES_PER_FLOAT,
        line.scale[1],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 2 * BYTES_PER_FLOAT,
        line.offset[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 3 * BYTES_PER_FLOAT,
        line.offset[1],
        true
      );

      // Pack color (r, g, b, a) -> vec4
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 0 * BYTES_PER_FLOAT,
        line.color[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 1 * BYTES_PER_FLOAT,
        line.color[1],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 2 * BYTES_PER_FLOAT,
        line.color[2],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 3 * BYTES_PER_FLOAT,
        line.color[3],
        true
      );

      // Pack indices (start, numPoints, 0, 0) -> ivec4
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 0 * BYTES_PER_INT,
        tempLineStart[lineId],
        true
      );
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 1 * BYTES_PER_INT,
        tempLineNumPoints[lineId],
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

    // Upload the entire UBO data
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    gl.bufferData(gl.UNIFORM_BUFFER, this.lineDataArrayBuffer, gl.DYNAMIC_DRAW); // Use DYNAMIC_DRAW for updates
    gl.bindBuffer(gl.UNIFORM_BUFFER, null); // Unbind

    // Bind the UBO to the reserved binding point
    // This needs to be done at least once after bufferData/bufferSubData if the binding wasn't active.
    // Binding it here ensures it's ready for the first draw.
    gl.bindBufferBase(
      gl.UNIFORM_BUFFER,
      this.lineDataUBObindingPoint,
      this.lineDataUBO
    );
    // --- End UBO Data ---

    // --- Upload remaining uniforms ---
    gl.useProgram(this.prog);
    gl.uniform1i(this.locations.uTexWidth, this.texWidth);
    gl.uniform1i(this.locations.uTexHeight, this.texHeight);
    gl.uniform1i(this.locations.uNumLines, this.numLines);
    // No more array uniform uploads here
    // --- End remaining uniforms ---
  }

  /**
   * Update the transform (scale and offset) of an already-uploaded line using UBO update.
   */
  public updateLineTransform(
    lineId: number,
    scale: [number, number],
    offset: [number, number]
  ) {
    if (lineId < 0 || lineId >= this.numLines) {
      console.error(
        `Invalid lineId: ${lineId}. Must be between 0 and ${this.numLines - 1}.`
      );
      return;
      // Or throw new Error(...)
    }
    const gl = this.gl;

    // Calculate byte offset for this line's transform data
    const byteOffset = lineId * this.lineDataStride + OFFSET_TRANSFORM;
    const transformDataSize = 4 * BYTES_PER_FLOAT; // vec4 size

    // Update the CPU-side buffer first
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

    // Create a temporary typed array view *only* for the part we want to upload
    const uploadData = new Float32Array(
      this.lineDataArrayBuffer,
      byteOffset,
      4
    ); // 4 floats for vec4

    // Bind the UBO and update the specific sub-region
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    gl.bufferSubData(gl.UNIFORM_BUFFER, byteOffset, uploadData);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null); // Unbind
  }

  /**
   * Update the color (and opacity) of an already-uploaded line using UBO update.
   */
  public updateLineColor(
    lineId: number,
    color: [number, number, number, number]
  ) {
    if (lineId < 0 || lineId >= this.numLines) {
      console.error(
        `Invalid lineId: ${lineId}. Must be between 0 and ${this.numLines - 1}.`
      );
      return;
    }
    const gl = this.gl;

    // Calculate byte offset for this line's color data
    const byteOffset = lineId * this.lineDataStride + OFFSET_COLOR;
    const colorDataSize = 4 * BYTES_PER_FLOAT; // vec4 size

    // Update the CPU-side buffer first
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

    // Create a temporary typed array view *only* for the part we want to upload
    const uploadData = new Float32Array(
      this.lineDataArrayBuffer,
      byteOffset,
      4
    ); // 4 floats for vec4

    // Bind the UBO and update the specific sub-region
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    gl.bufferSubData(gl.UNIFORM_BUFFER, byteOffset, uploadData);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null); // Unbind
  }

  /**
   * Update only the Y coordinates of the points for a given line in the texture.
   * (This function remains largely the same as it modifies texture, not UBO)
   */
  public updateLineY(lineId: number, newY: Float32Array) {
    if (lineId < 0 || lineId >= this.numLines) {
      console.error(
        `Invalid lineId: ${lineId}. Must be between 0 and ${this.numLines - 1}.`
      );
      return;
    }
    // Retrieve numPoints for the line using the CPU-side UBO data view
    const indicesByteOffset = lineId * this.lineDataStride + OFFSET_INDICES;
    const numPts = this.lineNumPointsCache[lineId]; // Use cached value
    // const numPts = this.lineDataView.getInt32(indicesByteOffset + 1 * BYTES_PER_INT, true); // Or read directly

    if (newY.length !== numPts) {
      throw new Error(
        `Line ${lineId}: Length mismatch for updateLineY. Expected ${numPts} Y values but got ${newY.length}.`
      );
    }
    if (numPts <= 0) {
      return; // Nothing to update
    }

    const gl = this.gl;
    // Get the starting point index for this line from UBO data view
    const startIdx = this.lineDataView.getInt32(
      indicesByteOffset + 0 * BYTES_PER_INT,
      true
    );

    // --- Update the CPU-side pointsData array ---
    // This loop can be potentially optimized if performance critical
    // by directly calculating target indices within pointsData
    for (let i = 0; i < numPts; i++) {
      const pointGlobalIndex = startIdx + i;
      // pointsData stores packed XYXY... so Y is at index * 2 + 1
      const yDataIndex = pointGlobalIndex * 2 + 1;
      if (yDataIndex < this.pointsData.length) {
        // Bounds check
        this.pointsData[yDataIndex] = newY[i];
      } else {
        console.error(
          `Calculated index ${yDataIndex} out of bounds for pointsData (length ${this.pointsData.length})`
        );
        // This might indicate an issue with startIdx or numPts calculation
        break; // Stop updating if out of bounds
      }
    }
    // --- End CPU-side update ---

    // --- Update the texture using texSubImage2D ---
    gl.activeTexture(gl.TEXTURE0 + 0); // Ensure correct texture unit
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);

    let currentGlobalIndex = startIdx;
    const endGlobalIndex = startIdx + numPts;

    while (currentGlobalIndex < endGlobalIndex) {
      const row = Math.floor(currentGlobalIndex / this.texWidth);
      const col = currentGlobalIndex % this.texWidth;

      // How many points from 'currentGlobalIndex' are contiguous in this row?
      const remainingInRow = this.texWidth - col;
      const remainingPtsInLine = endGlobalIndex - currentGlobalIndex;
      const numPointsInBlock = Math.min(remainingInRow, remainingPtsInLine);

      if (numPointsInBlock <= 0) break; // Should not happen, but safety break

      // Calculate the slice of pointsData to upload
      // Offset in pointsData (float array) = start index * 2 floats/point
      const offsetInPointsData = currentGlobalIndex * 2;
      // Length of sub-array (floats) = num points * 2 floats/point
      const blockLengthFloats = numPointsInBlock * 2;

      // Check bounds before creating subarray view
      if (offsetInPointsData + blockLengthFloats > this.pointsData.length) {
        console.error(
          `Texture update range [${offsetInPointsData}, ${
            offsetInPointsData + blockLengthFloats
          }) exceeds pointsData length (${this.pointsData.length})`
        );
        break;
      }

      // Get a view of the data to upload for this block
      const subData = this.pointsData.subarray(
        offsetInPointsData,
        offsetInPointsData + blockLengthFloats
      );

      // Update the sub-region of the texture
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0, // level
        col, // xoffset (in texels)
        row, // yoffset (in texels)
        numPointsInBlock, // width (in texels)
        1, // height (in texels)
        gl.RG, // format (matches internal format)
        gl.FLOAT, // type (matches internal format)
        subData // data view
      );

      // Move to the next block
      currentGlobalIndex += numPointsInBlock;
    }
    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind texture
    // --- End Texture Update ---
  }

  /**
   * Draw the lines.
   */
  public draw() {
    const gl = this.gl;
    // gl.clear(gl.COLOR_BUFFER_BIT); // Clearing might be done elsewhere

    gl.useProgram(this.prog);

    // Ensure Texture is bound to the correct unit
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);

    // Ensure UBO is bound to the correct binding point
    // While bindBufferBase should persist, rebinding is safe if context state changes are possible.
    gl.bindBufferBase(
      gl.UNIFORM_BUFFER,
      this.lineDataUBObindingPoint,
      this.lineDataUBO
    );

    // Bind the VAO containing vertex attributes and VBO bindings
    gl.bindVertexArray(this.vao);

    // Issue one draw call per line strip
    for (let i = 0; i < this.lineDrawCalls.length; i++) {
      const { offset, count } = this.lineDrawCalls[i];
      if (count > 0) {
        // Only draw if there are vertices
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, count);
      }
    }

    // Unbind resources (good practice)
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    // UBO doesn't strictly need unbinding from the *binding point*,
    // but unbinding from the target can prevent accidental modification
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  // Optional: Add a cleanup method
  public cleanup() {
    const gl = this.gl;
    gl.deleteProgram(this.prog);
    gl.deleteTexture(this.pointsTexture);
    gl.deleteBuffer(this.vertexBuffer);
    gl.deleteBuffer(this.lineDataUBO);
    gl.deleteVertexArray(this.vao);
    // Reset members
    this.lineDrawCalls = [];
    this.pointsData = new Float32Array(0);
    this.lineDataArrayBuffer = new ArrayBuffer(0);
    this.lineDataView = new DataView(this.lineDataArrayBuffer);
    this.numLines = 0;
  }
}
