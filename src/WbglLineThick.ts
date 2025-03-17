type UniformLocations = {
  uPointsTex: WebGLUniformLocation;
  uNumPoints: WebGLUniformLocation;
  uThickness: WebGLUniformLocation;
  uCanvasWidth: WebGLUniformLocation;
  uCanvasHeight: WebGLUniformLocation;
  uOffset: WebGLUniformLocation;
  uTexWidth: WebGLUniformLocation;
  uTexHeight: WebGLUniformLocation;
};

export class WebglLineThick {
  private gl: WebGL2RenderingContext;
  public prog: WebGLProgram;
  private width: number;
  private height: number;
  private thickness: number;
  private offset: number[];
  private pointsTexture: WebGLTexture;
  private vao: WebGLVertexArrayObject;
  private vertexBuffer: WebGLBuffer;
  private numPoints: number = 0;
  private locations: UniformLocations;

  constructor(
    wglp: { gl: WebGL2RenderingContext; width: number; height: number },
    thickness: number
  ) {
    this.gl = wglp.gl;
    this.width = wglp.width;
    this.height = wglp.height;
    this.thickness = thickness;
    // Global offset in NDC ([0,0] means no offset).
    this.offset = [0, 0];
    const gl = this.gl;

    // Vertex shader: Now computes texture coordinates from a 2D texture.
    const vsSource = `#version 300 es
precision mediump float;
uniform sampler2D uPointsTex;
uniform int uNumPoints;
uniform float uThickness;
uniform float uCanvasWidth;
uniform float uCanvasHeight;
uniform int uTexWidth;
uniform int uTexHeight;
uniform vec2 uOffset;

in float aIndex;
in float aSide;

// Fetch a polyline point from the 2D texture.
vec2 getPoint(int idx) {
  int texX = idx % uTexWidth;
  int texY = idx / uTexWidth;
  float u = (float(texX) + 0.5) / float(uTexWidth);
  float v = (float(texY) + 0.5) / float(uTexHeight);
  return texture(uPointsTex, vec2(u, v)).xy;
}

void main() {
  int index = int(aIndex);
  // Current point.
  vec2 p = getPoint(index);
  // For endpoints, replicate the current point.
  vec2 pPrev = (index == 0) ? p : getPoint(index - 1);
  vec2 pNext = (index == uNumPoints - 1) ? p : getPoint(index + 1);
  
  vec2 offsetNormal;
  if(index == 0) {
    // For the start point, use the normal of the segment (p -> pNext).
    vec2 dir = normalize(pNext - p);
    offsetNormal = vec2(-dir.y, dir.x);
    offsetNormal *= uThickness * 0.5;
  } else if(index == uNumPoints - 1) {
    // For the end point, use the normal of the segment (pPrev -> p).
    vec2 dir = normalize(p - pPrev);
    offsetNormal = vec2(-dir.y, dir.x);
    offsetNormal *= uThickness * 0.5;
  } else {
    // For interior points, compute miter join.
    vec2 dir0 = normalize(p - pPrev);
    vec2 dir1 = normalize(pNext - p);
    vec2 n0 = vec2(-dir0.y, dir0.x);
    vec2 n1 = vec2(-dir1.y, dir1.x);
    vec2 miter = normalize(n0 + n1);
    // Compute raw miter scale.
    float rawMiterScale = uThickness * 0.5 / max(dot(miter, n1), 0.001);
    // Clamp the miter scale to avoid excessively long miters.
    float miterLimit = 4.0; // adjust this value as needed
    float miterScale = min(rawMiterScale, miterLimit);
    offsetNormal = miter * miterScale;
  }
  
  // Compute the offset position for this vertex.
  vec2 pos = p + offsetNormal * aSide;
  
  // Apply a global offset (uOffset is in NDC, so convert to pixel offset).
  vec2 pixelOffset = uOffset * vec2(uCanvasWidth, uCanvasHeight) * 0.5;
  pos += pixelOffset;
  
  // Convert from pixel coordinates to clip space.
  float clipX = (pos.x / uCanvasWidth) * 2.0 - 1.0;
  float clipY = 1.0 - (pos.y / uCanvasHeight) * 2.0;
  gl_Position = vec4(clipX, clipY, 0.0, 1.0);
}`;
    // Simple fragment shader: outputs a constant red color.
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

    // Create a texture to store the polyline points.
    this.pointsTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // Create a vertex buffer that will store two attributes per vertex:
    // aIndex (float) and aSide (float). We'll have 2 vertices per polyline point.
    this.vertexBuffer = gl.createBuffer()!;

    // Set up a vertex array object (VAO) for these attributes.
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    // Each vertex is 2 floats (8 bytes): offset 0 for aIndex and offset 4 for aSide.
    gl.enableVertexAttribArray(0); // aIndex
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 8, 0);
    gl.enableVertexAttribArray(1); // aSide
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 8, 4);
    gl.bindVertexArray(null);

    // Look up uniform locations.
    this.locations = {
      uPointsTex: gl.getUniformLocation(this.prog, "uPointsTex")!,
      uNumPoints: gl.getUniformLocation(this.prog, "uNumPoints")!,
      uThickness: gl.getUniformLocation(this.prog, "uThickness")!,
      uCanvasWidth: gl.getUniformLocation(this.prog, "uCanvasWidth")!,
      uCanvasHeight: gl.getUniformLocation(this.prog, "uCanvasHeight")!,
      uOffset: gl.getUniformLocation(this.prog, "uOffset")!,
      uTexWidth: gl.getUniformLocation(this.prog, "uTexWidth")!,
      uTexHeight: gl.getUniformLocation(this.prog, "uTexHeight")!,
    };

    // Bind the points texture to texture unit 0 and set canvas size uniforms.
    gl.uniform1i(this.locations.uPointsTex, 0);
    gl.uniform1f(this.locations.uCanvasWidth, this.width);
    gl.uniform1f(this.locations.uCanvasHeight, this.height);
  }

  // Update the polyline. 'points' is a Float32Array of (x,y) in canvas (pixel) coordinates.
  // Also, rebuild the vertex buffer: two vertices per polyline point.
  public updateLine(points: Float32Array) {
    const gl = this.gl;
    this.numPoints = points.length / 2;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);

    // Determine a safe texture size.
    const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    // Choose texture width as the minimum of numPoints and maxTexSize.
    const texWidth = Math.min(this.numPoints, maxTexSize);
    const texHeight = Math.ceil(this.numPoints / texWidth);
    const totalTexels = texWidth * texHeight;

    // Create a new data array sized to hold all texels (each with 2 floats).
    const data2D = new Float32Array(totalTexels * 2);
    // Copy the points data into the new array.
    data2D.set(points);

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

    gl.useProgram(this.prog);
    gl.uniform1i(this.locations.uNumPoints, this.numPoints);
    gl.uniform1f(this.locations.uThickness, this.thickness);
    // Pass the texture dimensions to the shader.
    gl.uniform1i(this.locations.uTexWidth, texWidth);
    gl.uniform1i(this.locations.uTexHeight, texHeight);

    // Create vertex attribute data:
    // For each point, create two vertices:
    //   Vertex 1: aIndex = i, aSide = 1.0
    //   Vertex 2: aIndex = i, aSide = -1.0
    const vertexData = new Float32Array(this.numPoints * 2 * 2); // 2 vertices per point, 2 floats per vertex.
    for (let i = 0; i < this.numPoints; i++) {
      vertexData[i * 4 + 0] = i; // aIndex for first vertex.
      vertexData[i * 4 + 1] = 1.0; // aSide for first vertex.
      vertexData[i * 4 + 2] = i; // aIndex for second vertex.
      vertexData[i * 4 + 3] = -1.0; // aSide for second vertex.
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
  }

  // Draw the polyline as a triangle strip.
  public draw() {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    // There are 2 * numPoints vertices in the triangle strip.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numPoints * 2);
  }

  // Set a global offset (in NDC) for the polyline.
  public setOffset(x: number, y: number) {
    this.offset = [x, y];
    const gl = this.gl;
    gl.useProgram(this.prog);
    gl.uniform2fv(this.locations.uOffset, new Float32Array(this.offset));
  }
}
