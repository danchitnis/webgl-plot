// Maximum number of lines supported.
const MAX_LINES = 100;

type UniformLocationsMulti = {
  uPointsTex: WebGLUniformLocation;
  uThickness: WebGLUniformLocation;
  uCanvasWidth: WebGLUniformLocation;
  uCanvasHeight: WebGLUniformLocation;
  uTexWidth: WebGLUniformLocation;
  uTexHeight: WebGLUniformLocation;
  uNumLines: WebGLUniformLocation;
  uLineStart: WebGLUniformLocation; // base location for int array
  uLineNumPoints: WebGLUniformLocation; // base location for int array
  uLineScale: WebGLUniformLocation; // base location for float array
  uLineOffset: WebGLUniformLocation; // base location for vec2 array
};

export class WebglLineThick {
  private gl: WebGL2RenderingContext;
  public prog: WebGLProgram;
  private width: number;
  private height: number;
  private thickness: number;
  private pointsTexture: WebGLTexture;
  private vao: WebGLVertexArrayObject;
  private vertexBuffer: WebGLBuffer;
  private locations: UniformLocationsMulti;

  // To know where each line’s vertices are in the vertex buffer.
  private lineDrawCalls: { offset: number; count: number }[] = [];

  // Total number of vertices in the buffer.
  private totalVertexCount: number = 0;

  // Store the number of lines currently uploaded.
  private numLines: number = 0;
  // Current per-line scale and offset arrays, so they can be updated later.
  private currentLineScale: Float32Array = new Float32Array(0);
  private currentLineOffset: Float32Array = new Float32Array(0);

  constructor(
    wglp: { gl: WebGL2RenderingContext; width: number; height: number },
    thickness: number
  ) {
    this.gl = wglp.gl;
    this.width = wglp.width;
    this.height = wglp.height;
    this.thickness = thickness;
    const gl = this.gl;

    // Vertex shader with support for multiple lines.
    const vsSource = `#version 300 es
precision mediump float;
#define MAX_LINES ${MAX_LINES}

uniform sampler2D uPointsTex;
uniform float uThickness;
uniform float uCanvasWidth;
uniform float uCanvasHeight;
uniform int uTexWidth;
uniform int uTexHeight;

// Per-line metadata arrays.
uniform int uNumLines;
uniform int uLineStart[MAX_LINES];
uniform int uLineNumPoints[MAX_LINES];
uniform float uLineScale[MAX_LINES];
uniform vec2 uLineOffset[MAX_LINES];

in float aLineId;  // which line (index)
in float aIndex;   // index within that line
in float aSide;    // +1.0 or -1.0

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

  // Fetch the current point and its neighbors.
  vec2 p = getPoint(globalIndex);
  vec2 pPrev = (localIndex == 0) ? p : getPoint(uLineStart[lineId] + localIndex - 1);
  vec2 pNext = (localIndex == numPoints - 1) ? p : getPoint(uLineStart[lineId] + localIndex + 1);
  
  // Apply per-line transformation.
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
  
  // Convert from pixel coordinates to clip space.
  float clipX = (pos.x / uCanvasWidth) * 2.0 - 1.0;
  float clipY = 1.0 - (pos.y / uCanvasHeight) * 2.0;
  gl_Position = vec4(clipX, clipY, 0.0, 1.0);
}
`;

    // Simple fragment shader (red color).
    const fsSource = `#version 300 es
precision mediump float;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;

    // Helper functions to compile shaders.
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

    // Create the texture that will hold all line points.
    this.pointsTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // Create the vertex buffer.
    this.vertexBuffer = gl.createBuffer()!;

    // Set up the VAO. Now each vertex consists of 3 floats (12 bytes per vertex):
    // aLineId (offset 0), aIndex (offset 4) and aSide (offset 8).
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    // Attribute 0: aLineId
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 12, 0);
    // Attribute 1: aIndex
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 12, 4);
    // Attribute 2: aSide
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 12, 8);
    gl.bindVertexArray(null);

    // Look up uniform locations.
    this.locations = {
      uPointsTex: gl.getUniformLocation(this.prog, "uPointsTex")!,
      uThickness: gl.getUniformLocation(this.prog, "uThickness")!,
      uCanvasWidth: gl.getUniformLocation(this.prog, "uCanvasWidth")!,
      uCanvasHeight: gl.getUniformLocation(this.prog, "uCanvasHeight")!,
      uTexWidth: gl.getUniformLocation(this.prog, "uTexWidth")!,
      uTexHeight: gl.getUniformLocation(this.prog, "uTexHeight")!,
      uNumLines: gl.getUniformLocation(this.prog, "uNumLines")!,
      uLineStart: gl.getUniformLocation(this.prog, "uLineStart[0]")!,
      uLineNumPoints: gl.getUniformLocation(this.prog, "uLineNumPoints[0]")!,
      uLineScale: gl.getUniformLocation(this.prog, "uLineScale[0]")!,
      uLineOffset: gl.getUniformLocation(this.prog, "uLineOffset[0]")!,
    };

    // Set up constant uniforms.
    gl.useProgram(this.prog);
    gl.uniform1i(this.locations.uPointsTex, 0);
    gl.uniform1f(this.locations.uCanvasWidth, this.width);
    gl.uniform1f(this.locations.uCanvasHeight, this.height);
    gl.uniform1f(this.locations.uThickness, this.thickness);
  }

  /**
   * Update the lines.
   *
   * Each line is an object with:
   *  - points: a Float32Array of (x,y) pixel positions.
   *  - scale: a float factor applied to the points.
   *  - offset: a [x,y] translation (in pixel space).
   */
  public updateLines(
    lines: { points: Float32Array; scale: number; offset: [number, number] }[]
  ) {
    const gl = this.gl;

    if (lines.length > MAX_LINES) {
      throw new Error(`This shader supports up to ${MAX_LINES} lines.`);
    }

    this.numLines = lines.length;

    // Calculate total number of points and build per-line metadata.
    let totalPoints = 0;
    const lineStart = new Int32Array(lines.length);
    const lineNumPoints = new Int32Array(lines.length);
    const lineScale = new Float32Array(lines.length);
    const lineOffset = new Float32Array(lines.length * 2);
    for (let i = 0; i < lines.length; i++) {
      lineStart[i] = totalPoints;
      const numPts = lines[i].points.length / 2;
      lineNumPoints[i] = numPts;
      totalPoints += numPts;
      lineScale[i] = lines[i].scale;
      lineOffset[i * 2 + 0] = lines[i].offset[0];
      lineOffset[i * 2 + 1] = lines[i].offset[1];
    }
    // Save these arrays so they can be updated later.
    this.currentLineScale = lineScale;
    this.currentLineOffset = lineOffset;

    // Pack all points from all lines into one Float32Array.
    const allPoints = new Float32Array(totalPoints * 2);
    let offsetPts = 0;
    for (let i = 0; i < lines.length; i++) {
      allPoints.set(lines[i].points, offsetPts);
      offsetPts += lines[i].points.length;
    }

    // Upload the points data to the texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const texWidth = Math.min(totalPoints, maxTexSize);
    const texHeight = Math.ceil(totalPoints / texWidth);
    const totalTexels = texWidth * texHeight;
    // Create a data array with room for all texels (each texel is 2 floats).
    const data2D = new Float32Array(totalTexels * 2);
    data2D.set(allPoints);
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

    // Now build the vertex buffer.
    // For each line, for each point, we create two vertices:
    //   Vertex: [ aLineId, aIndex, 1.0 ]
    //   Vertex: [ aLineId, aIndex, -1.0 ]
    // Total vertices = totalPoints * 2.
    const vertexData = new Float32Array(totalPoints * 2 * 3);
    let vOffset = 0;
    this.lineDrawCalls = []; // reset draw-call info
    let vertexCountSoFar = 0;
    for (let lineId = 0; lineId < lines.length; lineId++) {
      const numPts = lineNumPoints[lineId];
      // Record where this line’s vertices start and how many there are.
      this.lineDrawCalls.push({ offset: vertexCountSoFar, count: numPts * 2 });
      for (let i = 0; i < numPts; i++) {
        // First vertex for this point.
        vertexData[vOffset++] = lineId; // aLineId
        vertexData[vOffset++] = i; // aIndex
        vertexData[vOffset++] = 1.0; // aSide
        // Second vertex for this point.
        vertexData[vOffset++] = lineId; // aLineId
        vertexData[vOffset++] = i; // aIndex
        vertexData[vOffset++] = -1.0; // aSide
      }
      vertexCountSoFar += numPts * 2;
    }
    this.totalVertexCount = vertexCountSoFar;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

    // Upload uniform metadata.
    gl.useProgram(this.prog);
    gl.uniform1i(this.locations.uTexWidth, texWidth);
    gl.uniform1i(this.locations.uTexHeight, texHeight);
    gl.uniform1i(this.locations.uNumLines, lines.length);
    gl.uniform1iv(this.locations.uLineStart, lineStart);
    gl.uniform1iv(this.locations.uLineNumPoints, lineNumPoints);
    gl.uniform1fv(this.locations.uLineScale, lineScale);
    gl.uniform2fv(this.locations.uLineOffset, lineOffset);
  }

  /**
   * Update the transform (scale and offset) of an already-uploaded line.
   *
   * This method changes the per-line scale and offset uniforms for the specified line,
   * without re-uploading the points data.
   *
   * @param lineId - The index of the line to update.
   * @param scale - The new scale factor for the line.
   * @param offset - The new [x, y] offset (in pixel space) for the line.
   */
  public updateLineTransform(
    lineId: number,
    scale: number,
    offset: [number, number]
  ) {
    if (lineId < 0 || lineId >= this.numLines) {
      throw new Error(`Invalid lineId: ${lineId}`);
    }
    this.currentLineScale[lineId] = scale;
    this.currentLineOffset[lineId * 2] = offset[0];
    this.currentLineOffset[lineId * 2 + 1] = offset[1];

    const gl = this.gl;
    gl.useProgram(this.prog);
    // Update only the transform uniforms.
    gl.uniform1fv(this.locations.uLineScale, this.currentLineScale);
    gl.uniform2fv(this.locations.uLineOffset, this.currentLineOffset);
  }

  /**
   * Draw the lines.
   *
   * Because the vertex buffer holds concatenated triangle strips (one per line),
   * we loop over the lines and issue one draw call per line.
   */
  public draw() {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);

    // Draw each line’s triangle strip separately.
    for (let i = 0; i < this.lineDrawCalls.length; i++) {
      const { offset, count } = this.lineDrawCalls[i];
      gl.drawArrays(gl.TRIANGLE_STRIP, offset, count);
    }
  }
}
