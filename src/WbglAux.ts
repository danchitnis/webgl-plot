import type { ColorRGBA } from "./ColorRGBA";
import type { WebglPlot } from "./webglplot";
import type { WebglLine } from "./WbglLine";

/*type Line = {
  xy: number[];
  color: ColorRGBA;
};*/

/**
 * The standard Line class
 */
export class WebglAux {
  private wglp: WebglPlot;
  private lines: WebglLine[];
  private color: ColorRGBA;
  private gl: WebGL2RenderingContext;
  private coord: number;
  private vbuffer: WebGLBuffer;
  public prog: WebGLProgram;

  constructor(wglp: WebglPlot) {
    //super();
    this.wglp = wglp;
    this.gl = wglp.gl;
    const gl = this.gl;
    this.lines = [];

    const vertCode = `#version 300 es

    layout(location = 0) in vec2 coord;
    uniform mat2 uscale;
    uniform vec2 uoffset;

    void main(void) {
      vec2 line = vec2(coord.x, coord.y);
      gl_Position = vec4(uscale*line + uoffset, 0.0, 1.0);
    }`;

    const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vertShader, vertCode);
    this.gl.compileShader(vertShader);

    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      // there was an error
      console.error(gl.getShaderInfoLog(vertShader));
    }

    // Fragment shader source code
    const fragCode = `#version 300 es

         precision mediump float;
         uniform highp vec4 uColor;
         out vec4 outColor;
         
         void main(void) {
            outColor=  uColor;
         }`;

    const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(fragShader, fragCode);
    this.gl.compileShader(fragShader);

    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      // there was an error
      console.error(gl.getShaderInfoLog(fragShader));
    }

    this.prog = this.gl.createProgram() as WebGLProgram;
    this.gl.attachShader(this.prog, vertShader);
    this.gl.attachShader(this.prog, fragShader);
    this.gl.linkProgram(this.prog);
    this.gl.useProgram(this.prog);

    this.vbuffer = this.gl.createBuffer() as WebGLBuffer;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuffer);

    this.coord = this.gl.getAttribLocation(this.prog, "coord");
    this.gl.vertexAttribPointer(this.coord, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.coord);

    gl.useProgram(this.prog);

    const uscale = gl.getUniformLocation(this.prog, "uscale");
    gl.uniformMatrix2fv(
      uscale,
      false,
      new Float32Array([this.wglp.gScaleX, 0, 0, this.wglp.gScaleY])
    );

    const uoffset = gl.getUniformLocation(this.prog, "uoffset");
    gl.uniform2fv(uoffset, new Float32Array([this.wglp.gOffsetX, this.wglp.gOffsetY]));

    const uColor = gl.getUniformLocation(this.prog, "uColor");
    gl.uniform4fv(uColor, [1, 1, 0, 1]);
  }

  addLine(line: WebglLine) {
    this.lines.push(line);
  }

  draw() {
    this.gl.useProgram(this.prog);
    this.lines.forEach((line) => {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(line.xy), this.gl.STREAM_DRAW);
      const uColor = this.gl.getUniformLocation(this.prog, "uColor");
      this.gl.uniform4f(uColor, line.color.r, line.color.g, line.color.b, line.color.a);
      this.gl.drawArrays(this.gl.LINE_STRIP, 0, line.xy.length / 2);
    });
  }
}
