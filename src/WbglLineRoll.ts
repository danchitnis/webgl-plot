import type { ColorRGBA } from "./ColorRGBA";
import type { WebglPlot } from "./webglplot";

export class WebglLineRoll {
  private gl: WebGL2RenderingContext;
  private aPositionLocation: number;
  private vertexBuffer: WebGLBuffer;
  public program: WebGLProgram;
  public rollBufferSize: number;
  private shift: number;
  private dataIndex: number;
  private dataX: number;
  private lastDataX: number[];
  private lastDataY: number[];
  public numLines: number;
  private ext: WEBGL_multi_draw;
  private colorBuffer: WebGLBuffer;
  private aColorLocation: number;
  private uShiftLocation: WebGLUniformLocation;

  constructor(wglp: WebglPlot, rollBufferSize: number, numLines: number) {
    this.gl = wglp.gl;
    this.rollBufferSize = rollBufferSize;
    this.shift = 0;
    this.dataIndex = 0;
    this.dataX = 1;
    this.lastDataX = Array(numLines).fill(0);
    this.lastDataY = Array(numLines).fill(0);
    this.numLines = numLines;

    const gl = this.gl;

    this.ext = gl.getExtension("WEBGL_multi_draw");

    const vertCode = `#version 300 es
        layout(location = 1) in vec2 a_position;
        layout(location = 2) in vec3 a_color;

        uniform float uShift;
        uniform vec4 uColor;

        out vec3 vColor;
    
        void main(void) {
            vec2 shiftedPosition = a_position - vec2(uShift, 0);
            gl_Position = vec4(shiftedPosition, 0, 1);

            vColor = a_color/ vec3(255.0, 255.0, 255.0);
        }`;

    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertCode);
    gl.compileShader(vertShader);

    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      // there was an error
      console.error(gl.getShaderInfoLog(vertShader));
    }

    // Fragment shader source code
    const fragCode = `#version 300 es
        precision mediump float;    
        in vec3 vColor;
        out vec4 outColor;
    
        void main(void) {
            outColor = vec4(vColor, 0.7);
        }`;

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragCode);
    gl.compileShader(fragShader);

    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      // there was an error
      console.error(gl.getShaderInfoLog(fragShader));
    }

    // Create the shader program
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertShader);
    gl.attachShader(this.program, fragShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      // there was an error
      console.error(gl.getProgramInfoLog(this.program));
    }

    // Create a buffer for the vertex coordinates
    this.vertexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array((this.rollBufferSize + 2) * 2 * numLines),
      gl.DYNAMIC_DRAW
    );

    this.aPositionLocation = gl.getAttribLocation(this.program, "a_position");
    gl.vertexAttribPointer(this.aPositionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.aPositionLocation);

    // Create a buffer for the colors
    this.colorBuffer = gl.createBuffer();

    const colors = Array((this.rollBufferSize + 2) * 3 * numLines).fill(128);

    gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Uint8Array(colors), gl.STATIC_DRAW);

    this.aColorLocation = gl.getAttribLocation(this.program, "a_color");
    gl.vertexAttribPointer(this.aColorLocation, 3, gl.UNSIGNED_BYTE, false, 0, 0);
    gl.enableVertexAttribArray(this.aColorLocation);

    this.uShiftLocation = gl.getUniformLocation(this.program, "uShift");

    //this.uColorLocation = gl.getUniformLocation(this.program, "uColor");
  }

  addPoint(ys: number[]) {
    const gl = this.gl;
    const bfsize = this.rollBufferSize + 2;
    this.shift += 2 / this.rollBufferSize;
    this.dataX += 2 / this.rollBufferSize;
    gl.useProgram(this.program);
    gl.uniform1f(this.uShiftLocation, this.shift);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    for (let i = 0; i < this.numLines; i++) {
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        (this.dataIndex + bfsize * i) * 2 * 4,
        new Float32Array([this.dataX, ys[i]])
      );
    }

    gl.enableVertexAttribArray(this.aPositionLocation);

    if (this.dataIndex === this.rollBufferSize - 1) {
      for (let i = 0; i < this.numLines; i++) {
        this.lastDataX[i] = this.dataX;
        this.lastDataY[i] = ys[i];
      }
    }

    if (this.dataIndex === 0 && this.lastDataX[0] !== 0) {
      for (let i = 0; i < this.numLines; i++) {
        gl.bufferSubData(
          gl.ARRAY_BUFFER,
          (this.rollBufferSize + bfsize * i) * 2 * 4,
          new Float32Array([this.lastDataX[i], this.lastDataY[i], this.dataX, ys[i]])
        );
      }
    }

    this.dataIndex = (this.dataIndex + 1) % this.rollBufferSize;
  }

  addPoints(ys: number[][]) {
    const gl = this.gl;
    const bfsize = this.rollBufferSize + 2;

    gl.useProgram(this.program);
    gl.uniform1f(this.uShiftLocation, this.shift);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    let index = this.dataIndex;
    let lastX = 0;

    for (let line = 0; line < ys.length; line++) {
      index = this.dataIndex;
      lastX = 0;

      for (let i = 0; i < ys[line].length; i++) {
        const x = this.dataX + (i * 2) / this.rollBufferSize;

        if (index < this.rollBufferSize) {
          gl.bufferSubData(
            gl.ARRAY_BUFFER,
            (index + line * bfsize) * 2 * 4,
            new Float32Array([x, ys[line][i]])
          );
        }

        if (index === this.rollBufferSize - 1) {
          this.lastDataX[line] = x;
          this.lastDataY[line] = ys[line][i];
        }

        if (index % this.rollBufferSize === 0 && this.lastDataX[line] !== 0) {
          gl.bufferSubData(
            gl.ARRAY_BUFFER,
            (this.rollBufferSize + line * bfsize) * 2 * 4,
            new Float32Array([this.lastDataX[line], this.lastDataY[line], x, ys[line][i]])
          );
        }

        if (index >= this.rollBufferSize) {
          const index2 = index % this.rollBufferSize;
          gl.bufferSubData(
            gl.ARRAY_BUFFER,
            (index2 + line * bfsize) * 2 * 4,
            new Float32Array([x, ys[line][i]])
          );
        }

        index++;
        lastX = x;
      }
    }

    this.shift += (ys[0].length * 2) / this.rollBufferSize;
    this.dataX = lastX + 2 / this.rollBufferSize;
    this.dataIndex = index % this.rollBufferSize;

    gl.enableVertexAttribArray(this.aPositionLocation);
  }

  private drawOld() {
    const bfsize = this.rollBufferSize + 2;
    const gl = this.gl;
    this.gl.useProgram(this.program);

    for (let i = 0; i < this.numLines; i++) {
      gl.drawArrays(gl.LINE_STRIP, i * bfsize, this.dataIndex);
      gl.drawArrays(
        gl.LINE_STRIP,
        i * bfsize + this.dataIndex,
        this.rollBufferSize - this.dataIndex
      );
      gl.drawArrays(gl.LINE_STRIP, i * bfsize + this.rollBufferSize, 2);
    }
  }

  private drawExt() {
    const bfsize = this.rollBufferSize + 2;
    const gl = this.gl;
    this.gl.useProgram(this.program);

    const firsts = [];
    const counts = [];

    for (let i = 0; i < this.numLines; i++) {
      firsts.push(i * bfsize);
      counts.push(this.dataIndex);
      firsts.push(i * bfsize + this.dataIndex);
      counts.push(this.rollBufferSize - this.dataIndex);
      firsts.push(i * bfsize + this.rollBufferSize);
      counts.push(2);
    }
    this.ext.multiDrawArraysWEBGL(gl.LINE_STRIP, firsts, 0, counts, 0, counts.length);
  }

  draw() {
    if (this.ext) {
      this.drawExt();
    } else {
      this.drawOld();
    }
  }

  setLineColor(colors: ColorRGBA, lineIndex: number) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);

    const colorsArray = [];
    for (let i = 0; i < this.rollBufferSize + 2; i++) {
      colorsArray.push(colors.r);
      colorsArray.push(colors.g);
      colorsArray.push(colors.b);
    }

    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      (this.rollBufferSize + 2) * 3 * lineIndex * 1,
      new Uint8Array(colorsArray)
    );

    gl.enableVertexAttribArray(this.aColorLocation);
  }
}
