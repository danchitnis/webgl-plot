//import { ColorRGBA } from "./ColorRGBA";
import type { WebglLine, WebglPlot } from "./webglplot";

export class WebglLineThick {
  private line: WebglLine;
  private gl: WebGL2RenderingContext;
  public prog: WebGLProgram;
  private width: number;
  private height: number;
  private vao: WebGLVertexArrayObject;

  constructor(wglp: WebglPlot, line: WebglLine) {
    //super();
    this.gl = wglp.gl;
    const gl = this.gl;
    this.line = line;
    this.width = wglp.width;
    this.height = wglp.height;

    // Helper: Compile a shader.
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

    // Helper: Link a program.
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

    // Vertex shader: renders a full-screen quad.
    // aPosition is in normalized device coordinates (NDC) ranging from -1 to 1.
    const vsSource = `#version 300 es
precision mediump float;
layout(location=0) in vec2 aPosition;
out vec2 vUV;
void main() {
  // Convert NDC to [0,1] UV (optional, not strictly used in our distance calc).
  vUV = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

    // Fragment shader: for each fragment, compute the distance from the pixel
    // (after flipping the y axis) to every segment in the polyline. If the minimum
    // distance is less than half the thickness, the pixel is inside the line.
    const fsSource = `#version 300 es
precision mediump float;
in vec2 vUV;
out vec4 fragColor;
  
// Maximum of 100 points in the polyline.
uniform vec2 uPoints[100];
uniform int uNumPoints;
uniform float uThickness;    // Desired constant line thickness (in pixels).
uniform float uCanvasHeight; // Needed to flip gl_FragCoord's y coordinate.

// Compute the distance from point p to segment ab.
float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  // gl_FragCoord has its origin at the bottom-left.
  // Flip y to convert it to canvas space with (0,0) at the top-left.
  vec2 pos = vec2(gl_FragCoord.x, uCanvasHeight - gl_FragCoord.y);
  
  // Find the minimal distance from the current pixel to any segment.
  float d = 1e10;
  for (int i = 0; i < 100; i++) {
    if (i >= uNumPoints - 1) break;
    float dist = segmentDistance(pos, uPoints[i], uPoints[i+1]);
    d = min(d, dist);
  }
  
  float halfThickness = uThickness * 0.5;
  // Use smoothstep for an anti-aliased edge.
  float alpha = smoothstep(halfThickness, halfThickness - 1.0, d);
  fragColor = vec4(1.0, 0.0, 0.0, alpha);
}
`;

    // Create the shader program.
    const program = createProgram(gl, vsSource, fsSource);
    this.prog = program;
    gl.useProgram(program);

    // Setup full-screen quad geometry.
    const quadVertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vao = gl.createVertexArray();
    this.vao = vao;
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // Look up uniform locations.
    const uPointsLoc = gl.getUniformLocation(program, "uPoints");
    const uNumPointsLoc = gl.getUniformLocation(program, "uNumPoints");
    const uThicknessLoc = gl.getUniformLocation(program, "uThickness");
    const uCanvasHeightLoc = gl.getUniformLocation(program, "uCanvasHeight");

    // Define your polyline points (in screen coordinates, e.g. top-left origin).
    const points = new Float32Array([100, 100, 200, 150, 300, 100, 200, 200]);
    const numPoints = points.length / 2;

    // Pass polyline data and other uniforms to the shader.
    gl.uniform2fv(uPointsLoc, points);
    gl.uniform1i(uNumPointsLoc, numPoints);
    gl.uniform1f(uThicknessLoc, 10.0); // Constant line thickness of 10 pixels.
    gl.uniform1f(uCanvasHeightLoc, this.height);

    // Render loop.
  }
  public draw() {
    const gl = this.gl;
    const program = this.prog;
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindVertexArray(this.vao);

    // Draw the full-screen quad.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
