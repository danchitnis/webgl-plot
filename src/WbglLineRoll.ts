import type { ColorRGBA } from "./ColorRGBA";
import type { WebglPlot } from "./webglplot";

export class WebglLineRoll {
  private wglp: WebglPlot;
  private color: ColorRGBA;
  private gl: WebGL2RenderingContext;
  private aPosition: number;
  private vertexBuffer: WebGLBuffer;
  public program: WebGLProgram;
  public rollBufferSize: number;
  private shift: number;
  private dataIndex: number;
  private dataX: number;
  private lastDataX: number[];
  private lastDataY: number[];
  private colorLocation: WebGLUniformLocation;

  constructor(wglp: WebglPlot, rollBufferSize: number) {
    //super();
    this.wglp = wglp;
    this.gl = wglp.gl;
    const gl = this.gl;
    this.rollBufferSize = rollBufferSize;
    this.shift = 0;
    this.dataIndex = 0;
    this.dataX = 1;
    this.lastDataX = Array(rollBufferSize).fill(0);
    this.lastDataY = Array(rollBufferSize).fill(0);
    this.colorLocation = null;

    const vertCode = `#version 300 es
    
        layout(location = 1) in vec2 a_position;
        uniform float u_shift;
    
        void main(void) {
            vec2 shiftedPosition = a_position - vec2(u_shift, 0);
            gl_Position = vec4(shiftedPosition, 0, 1);
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
        uniform vec4 uColor;
        out vec4 outColor;
    
        void main(void) {
            outColor = uColor;
        }`;

    const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(fragShader, fragCode);
    this.gl.compileShader(fragShader);

    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      // there was an error
      console.error(gl.getShaderInfoLog(fragShader));
    }

    // Create the shader program
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertShader);
    this.gl.attachShader(this.program, fragShader);
    this.gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      // there was an error
      console.error(gl.getProgramInfoLog(this.program));
    }

    // Create a buffer for the vertex coordinates
    this.vertexBuffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array((this.rollBufferSize * 2 + 4) * 3),
      this.gl.DYNAMIC_DRAW
    );

    this.aPosition = gl.getAttribLocation(this.program, "a_position");
    gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.aPosition);

    this.colorLocation = gl.getUniformLocation(this.program, "uColor");
  }

  addPoint(y: number) {
    const gl = this.gl;
    const bfsize = this.rollBufferSize + 2;
    this.shift += 2 / this.rollBufferSize;
    this.dataX += 2 / this.rollBufferSize;
    gl.useProgram(this.program);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_shift"), this.shift);

    gl.bufferSubData(gl.ARRAY_BUFFER, this.dataIndex * 2 * 4, new Float32Array([this.dataX, y]));

    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      (this.dataIndex + bfsize) * 2 * 4,
      new Float32Array([this.dataX, y + 0.2])
    );

    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      (this.dataIndex + bfsize * 2) * 2 * 4,
      new Float32Array([this.dataX, y - 0.1])
    );

    gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(this.aPosition);

    if (this.dataIndex === this.rollBufferSize - 1) {
      this.lastDataX[0] = this.dataX;
      this.lastDataY[0] = y;

      this.lastDataX[1] = this.dataX;
      this.lastDataY[1] = y + 0.2;

      this.lastDataX[2] = this.dataX;
      this.lastDataY[2] = y - 0.1;
    }

    if (this.dataIndex === 0 && this.lastDataX[0] !== 0) {
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        this.rollBufferSize * 2 * 4,
        new Float32Array([this.lastDataX[0], this.lastDataY[0], this.dataX, y])
      );

      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        (this.rollBufferSize + bfsize) * 2 * 4,
        new Float32Array([this.lastDataX[1], this.lastDataY[1], this.dataX, y + 0.2])
      );

      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        (this.rollBufferSize + bfsize * 2) * 2 * 4,
        new Float32Array([this.lastDataX[2], this.lastDataY[2], this.dataX, y - 0.1])
      );
    }

    this.dataIndex = (this.dataIndex + 1) % this.rollBufferSize;
  }

  draw() {
    const bfsize = this.rollBufferSize + 2;
    const gl = this.gl;
    this.gl.useProgram(this.program);
    gl.uniform4fv(this.colorLocation, [1, 1, 0, 1]);
    gl.drawArrays(gl.LINE_STRIP, 0, this.dataIndex);
    gl.drawArrays(gl.LINE_STRIP, this.dataIndex, this.rollBufferSize - this.dataIndex);
    gl.drawArrays(gl.LINE_STRIP, this.rollBufferSize, 2);
    //
    gl.uniform4fv(this.colorLocation, [0, 1, 1, 1]);
    gl.drawArrays(gl.LINE_STRIP, bfsize, this.dataIndex);
    gl.drawArrays(gl.LINE_STRIP, bfsize + this.dataIndex, this.rollBufferSize - this.dataIndex);
    gl.drawArrays(gl.LINE_STRIP, bfsize + this.rollBufferSize, 2);
    //
    gl.uniform4fv(this.colorLocation, [1, 0, 1, 1]);
    gl.drawArrays(gl.LINE_STRIP, bfsize * 2, this.dataIndex);
    gl.drawArrays(gl.LINE_STRIP, bfsize * 2 + this.dataIndex, this.rollBufferSize - this.dataIndex);
    gl.drawArrays(gl.LINE_STRIP, bfsize * 2 + this.rollBufferSize, 2);
  }
}
