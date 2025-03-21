type UniformLocationsMulti = {
  uPointsTex: WebGLUniformLocation;
  uThickness: WebGLUniformLocation;
  uTexWidth: WebGLUniformLocation;
  uTexHeight: WebGLUniformLocation;
  uNumLines: WebGLUniformLocation;
  uLineStart: WebGLUniformLocation; // base location for int array
  uLineNumPoints: WebGLUniformLocation; // base location for int array
  uLineScale: WebGLUniformLocation; // base location for vec2 array
  uLineOffset: WebGLUniformLocation; // base location for vec2 array
  uLineColor: WebGLUniformLocation; // base location for vec4 array
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

  // Draw-call info per line.
  private lineDrawCalls: { offset: number; count: number }[] = [];
  private totalVertexCount: number = 0;

  // The number of lines currently uploaded.
  private numLines: number = 0;
  // Per-line transform arrays.
  private currentLineScale: Float32Array = new Float32Array(0); // length = numLines * 2
  private currentLineOffset: Float32Array = new Float32Array(0); // length = numLines * 2
  // Per-line color array: each line has a vec4 (RGBA) in ND.
  private currentLineColor: Float32Array = new Float32Array(0); // length = numLines * 4

  // New members to store per-line point info and the texture data.
  private lineStartArray: Int32Array = new Int32Array(0);
  private lineNumPointsArray: Int32Array = new Int32Array(0);
  private pointsData: Float32Array = new Float32Array(0);
  private texWidth: number = 0;
  private texHeight: number = 0;

  constructor(
    wglp: { gl: WebGL2RenderingContext },
    maxLines: number,
    thickness: number
  ) {
    this.gl = wglp.gl;
    this.maxLines = maxLines;
    this.thickness = thickness;
    const gl = this.gl;

    // Vertex shader: all coordinates (points, offset, scale) are in ND space.
    // Added a uniform uLineColor and flat output vColor.
    const vsSource = `#version 300 es
precision mediump float;
#define MAX_LINES ${this.maxLines}

uniform sampler2D uPointsTex;
uniform float uThickness;
uniform int uTexWidth;
uniform int uTexHeight;

// Per-line metadata arrays.
uniform int uNumLines;
uniform int uLineStart[MAX_LINES];
uniform int uLineNumPoints[MAX_LINES];
uniform vec2 uLineScale[MAX_LINES];
uniform vec2 uLineOffset[MAX_LINES];
uniform vec4 uLineColor[MAX_LINES];

in float aLineId;  // which line (index)
in float aIndex;   // index within that line
in float aSide;    // +1.0 or -1.0

// Use flat interpolation for the line color.
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
  int globalIndex = uLineStart[lineId] + localIndex;
  int numPoints = uLineNumPoints[lineId];

  // Retrieve the current point and its neighbors.
  vec2 p = getPoint(globalIndex);
  vec2 pPrev = (localIndex == 0) ? p : getPoint(uLineStart[lineId] + localIndex - 1);
  vec2 pNext = (localIndex == numPoints - 1) ? p : getPoint(uLineStart[lineId] + localIndex + 1);
  
  // Apply per-line transformation (scale and offset are in ND).
  p = p * uLineScale[lineId] + uLineOffset[lineId];
  pPrev = pPrev * uLineScale[lineId] + uLineOffset[lineId];
  pNext = pNext * uLineScale[lineId] + uLineOffset[lineId];

  vec2 offsetNormal;
  if(localIndex == 0) {
    vec2 dir = normalize(pNext - p);
    offsetNormal = vec2(-dir.y, dir.x);
    offsetNormal *= uThickness * 0.5;
  } else if(localIndex == numPoints - 1) {
    vec2 dir = normalize(p - pPrev);
    offsetNormal = vec2(-dir.y, dir.x);
    offsetNormal *= uThickness * 0.5;
  } else {
    vec2 dir0 = normalize(p - pPrev);
    vec2 dir1 = normalize(pNext - p);
    vec2 n0 = vec2(-dir0.y, dir0.x);
    vec2 n1 = vec2(-dir1.y, dir1.x);
    vec2 miter = normalize(n0 + n1);
    float rawMiterScale = uThickness * 0.5 / max(dot(miter, n1), 0.001);
    float miterLimit = 4.0;
    float miterScale = min(rawMiterScale, miterLimit);
    offsetNormal = miter * miterScale;
  }
  
  vec2 pos = p + offsetNormal * aSide;
  gl_Position = vec4(pos, 0.0, 1.0);

  // Fetch the color for this line.
  vColor = uLineColor[lineId];
}
`;

    // Fragment shader: uses the flat interpolated color.
    const fsSource = `#version 300 es
precision mediump float;
flat in vec4 vColor;
out vec4 fragColor;
void main() {
  fragColor = vColor;
}
`;

    // Shader helper functions.
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
      return program;
    }

    this.prog = createProgram(gl, vsSource, fsSource);
    gl.useProgram(this.prog);

    // Create the texture that will hold all the line points.
    this.pointsTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // Create the vertex buffer.
    this.vertexBuffer = gl.createBuffer()!;

    // Set up the VAO. Each vertex has 3 floats (aLineId, aIndex, aSide).
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(0); // aLineId
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(1); // aIndex
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 12, 4);
    gl.enableVertexAttribArray(2); // aSide
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 12, 8);
    gl.bindVertexArray(null);

    // Look up uniform locations.
    this.locations = {
      uPointsTex: gl.getUniformLocation(this.prog, "uPointsTex")!,
      uThickness: gl.getUniformLocation(this.prog, "uThickness")!,
      uTexWidth: gl.getUniformLocation(this.prog, "uTexWidth")!,
      uTexHeight: gl.getUniformLocation(this.prog, "uTexHeight")!,
      uNumLines: gl.getUniformLocation(this.prog, "uNumLines")!,
      uLineStart: gl.getUniformLocation(this.prog, "uLineStart[0]")!,
      uLineNumPoints: gl.getUniformLocation(this.prog, "uLineNumPoints[0]")!,
      uLineScale: gl.getUniformLocation(this.prog, "uLineScale[0]")!,
      uLineOffset: gl.getUniformLocation(this.prog, "uLineOffset[0]")!,
      uLineColor: gl.getUniformLocation(this.prog, "uLineColor[0]")!,
    };

    // Set up constant uniforms.
    gl.useProgram(this.prog);
    gl.uniform1i(this.locations.uPointsTex, 0);
    gl.uniform1f(this.locations.uThickness, this.thickness);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * Update the lines.
   *
   * Each line is an object with:
   *  - points: a Float32Array of (x, y) positions in ND ([-1, 1] range).
   *  - scale: a [number, number] factor (for x and y) in ND.
   *  - offset: a [x, y] translation in ND.
   *  - color: a [r, g, b, a] color in ND (with a for opacity).
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
      throw new Error(`This shader supports up to ${this.maxLines} lines.`);
    }
    this.numLines = lines.length;

    // Build per-line metadata.
    let totalPoints = 0;
    const lineStart = new Int32Array(lines.length);
    const lineNumPoints = new Int32Array(lines.length);
    const lineScale = new Float32Array(lines.length * 2);
    const lineOffset = new Float32Array(lines.length * 2);
    const lineColor = new Float32Array(lines.length * 4);
    for (let i = 0; i < lines.length; i++) {
      lineStart[i] = totalPoints;
      const numPts = lines[i].points.length / 2;
      lineNumPoints[i] = numPts;
      totalPoints += numPts;
      lineScale[i * 2 + 0] = lines[i].scale[0];
      lineScale[i * 2 + 1] = lines[i].scale[1];
      lineOffset[i * 2 + 0] = lines[i].offset[0];
      lineOffset[i * 2 + 1] = lines[i].offset[1];
      lineColor[i * 4 + 0] = lines[i].color[0];
      lineColor[i * 4 + 1] = lines[i].color[1];
      lineColor[i * 4 + 2] = lines[i].color[2];
      lineColor[i * 4 + 3] = lines[i].color[3];
    }
    // Save these arrays for later updates.
    this.currentLineScale = lineScale;
    this.currentLineOffset = lineOffset;
    this.currentLineColor = lineColor;
    this.lineStartArray = lineStart;
    this.lineNumPointsArray = lineNumPoints;

    // Pack all points from all lines into one Float32Array.
    const allPoints = new Float32Array(totalPoints * 2);
    let offsetPts = 0;
    for (let i = 0; i < lines.length; i++) {
      allPoints.set(lines[i].points, offsetPts);
      offsetPts += lines[i].points.length;
    }

    // Upload points data to the texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const texWidth = Math.min(totalPoints, maxTexSize);
    const texHeight = Math.ceil(totalPoints / texWidth);
    this.texWidth = texWidth;
    this.texHeight = texHeight;
    const totalTexels = texWidth * texHeight;
    // Create a full texture array (size: totalTexels * 2 floats per texel)
    const data2D = new Float32Array(totalTexels * 2);
    data2D.set(allPoints);
    this.pointsData = data2D; // save for later updates
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RG32F,
      texWidth,
      texHeight,
      0,
      gl.RG,
      gl.FLOAT,
      data2D
    );

    // Build the vertex buffer.
    const vertexData = new Float32Array(totalPoints * 2 * 3);
    let vOffset = 0;
    this.lineDrawCalls = [];
    let vertexCountSoFar = 0;
    for (let lineId = 0; lineId < lines.length; lineId++) {
      const numPts = lineNumPoints[lineId];
      this.lineDrawCalls.push({ offset: vertexCountSoFar, count: numPts * 2 });
      for (let i = 0; i < numPts; i++) {
        // Vertex for side +1.
        vertexData[vOffset++] = lineId;
        vertexData[vOffset++] = i;
        vertexData[vOffset++] = 1.0;
        // Vertex for side -1.
        vertexData[vOffset++] = lineId;
        vertexData[vOffset++] = i;
        vertexData[vOffset++] = -1.0;
      }
      vertexCountSoFar += numPts * 2;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

    // Upload uniform metadata.
    gl.useProgram(this.prog);
    gl.uniform1i(this.locations.uTexWidth, texWidth);
    gl.uniform1i(this.locations.uTexHeight, texHeight);
    gl.uniform1i(this.locations.uNumLines, lines.length);
    gl.uniform1iv(this.locations.uLineStart, lineStart);
    gl.uniform1iv(this.locations.uLineNumPoints, lineNumPoints);
    gl.uniform2fv(this.locations.uLineScale, lineScale);
    gl.uniform2fv(this.locations.uLineOffset, lineOffset);
    gl.uniform4fv(this.locations.uLineColor, lineColor);
  }

  /**
   * Update the transform (scale and offset) of an already-uploaded line.
   *
   * @param lineId - The index of the line to update.
   * @param scale - The new [x, y] scale factors in ND.
   * @param offset - The new [x, y] offset in ND.
   */
  public updateLineTransform(
    lineId: number,
    scale: [number, number],
    offset: [number, number]
  ) {
    if (lineId < 0 || lineId >= this.numLines) {
      throw new Error(`Invalid lineId: ${lineId}`);
    }
    this.currentLineScale[lineId * 2 + 0] = scale[0];
    this.currentLineScale[lineId * 2 + 1] = scale[1];
    this.currentLineOffset[lineId * 2 + 0] = offset[0];
    this.currentLineOffset[lineId * 2 + 1] = offset[1];

    const gl = this.gl;
    gl.useProgram(this.prog);
    gl.uniform2fv(this.locations.uLineScale, this.currentLineScale);
    gl.uniform2fv(this.locations.uLineOffset, this.currentLineOffset);
  }

  /**
   * Update the color (and opacity) of an already-uploaded line.
   *
   * @param lineId - The index of the line to update.
   * @param color - The new [r, g, b, a] color (in ND) for the line.
   */
  public updateLineColor(
    lineId: number,
    color: [number, number, number, number]
  ) {
    if (lineId < 0 || lineId >= this.numLines) {
      throw new Error(`Invalid lineId: ${lineId}`);
    }
    this.currentLineColor[lineId * 4 + 0] = color[0];
    this.currentLineColor[lineId * 4 + 1] = color[1];
    this.currentLineColor[lineId * 4 + 2] = color[2];
    this.currentLineColor[lineId * 4 + 3] = color[3];

    const gl = this.gl;
    gl.useProgram(this.prog);
    gl.uniform4fv(this.locations.uLineColor, this.currentLineColor);
  }

  /**
   * Update only the Y coordinates of the points for a given line.
   *
   * This function accepts a new Y array and will:
   *   - Verify that its length matches the number of points for the line.
   *   - Update the internal points data.
   *   - Use gl.texSubImage2D to update only the affected texels.
   *
   * @param lineId - The index of the line to update.
   * @param newY - A Float32Array of new Y coordinates.
   */
  public updateLineY(lineId: number, newY: Float32Array) {
    if (lineId < 0 || lineId >= this.numLines) {
      throw new Error(`Invalid lineId: ${lineId}`);
    }
    const numPts = this.lineNumPointsArray[lineId];
    if (newY.length !== numPts) {
      throw new Error(
        `Length mismatch: expected ${numPts} Y values but got ${newY.length}.`
      );
    }
    const gl = this.gl;
    // Get the starting point index for this line.
    const startIdx = this.lineStartArray[lineId];

    // Update the pointsData array with the new Y values.
    for (let i = 0; i < numPts; i++) {
      // Each point is 2 floats: X is at index*2, Y is at index*2+1.
      const pointIndex = startIdx + i;
      this.pointsData[pointIndex * 2 + 1] = newY[i];
    }

    // Update the texture only for the modified region.
    // Since the points are stored in a 2D texture, the updated points may span one or more rows.
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    // Loop over the points of the line and update each contiguous block within a row.
    let current = startIdx;
    const end = startIdx + numPts;
    while (current < end) {
      const row = Math.floor(current / this.texWidth);
      const col = current % this.texWidth;
      // Determine how many points in this row (until the end of the row or end of the line).
      const remainingInRow = this.texWidth - col;
      const remainingPts = end - current;
      const blockCount = Math.min(remainingInRow, remainingPts);

      // Create a subarray for the contiguous block.
      // Each texel has 2 floats.
      const offsetInArray = current * 2;
      const blockLength = blockCount * 2;
      const subData = this.pointsData.subarray(
        offsetInArray,
        offsetInArray + blockLength
      );

      // Update the sub-region of the texture.
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        col, // x offset in texels
        row, // y offset in texels
        blockCount, // width (number of texels)
        1, // height (one row)
        gl.RG,
        gl.FLOAT,
        subData
      );
      current += blockCount;
    }
  }

  /**
   * Draw the lines.
   *
   * The vertex buffer contains concatenated triangle strips (one per line).
   * We loop over the strips and issue one draw call per line.
   */
  public draw() {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    for (let i = 0; i < this.lineDrawCalls.length; i++) {
      const { offset, count } = this.lineDrawCalls[i];
      gl.drawArrays(gl.TRIANGLE_STRIP, offset, count);
    }
  }
}
