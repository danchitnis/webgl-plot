import type { ColorRGBA } from "./ColorRGBA";
import { DebugLogger } from "./DebugLogger";

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
  private ext: WEBGL_multi_draw | null;
  private colorBuffer: WebGLBuffer;
  private aColorLocation: number;
  private uShiftLocation: WebGLUniformLocation;

  constructor(gl: WebGL2RenderingContext, rollBufferSize: number, numLines: number) {
    this.gl = gl;
    this.rollBufferSize = rollBufferSize;
    this.shift = 0;
    this.dataIndex = 0;
    this.dataX = 1;
    this.lastDataX = Array(numLines).fill(0);
    this.lastDataY = Array(numLines).fill(0);
    this.numLines = numLines;

    this.ext = this.gl.getExtension("WEBGL_multi_draw");

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

    const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (!vertShader) {
      throw new Error("Failed to create vertex shader");
    }
    this.gl.shaderSource(vertShader, vertCode);
    this.gl.compileShader(vertShader);

    if (!this.gl.getShaderParameter(vertShader, this.gl.COMPILE_STATUS)) {
      // there was an error
      DebugLogger.error(this.gl.getShaderInfoLog(vertShader) || "Vertex shader compilation failed");
    }

    // Fragment shader source code
    const fragCode = `#version 300 es
        precision mediump float;    
        in vec3 vColor;
        out vec4 outColor;
    
        void main(void) {
            outColor = vec4(vColor, 0.7);
        }`;

    const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    if (!fragShader) {
      throw new Error("Failed to create fragment shader");
    }
    this.gl.shaderSource(fragShader, fragCode);
    this.gl.compileShader(fragShader);

    if (!this.gl.getShaderParameter(fragShader, this.gl.COMPILE_STATUS)) {
      // there was an error
      DebugLogger.error(this.gl.getShaderInfoLog(fragShader) || "Fragment shader compilation failed");
    }

    // Create the shader program
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertShader);
    this.gl.attachShader(this.program, fragShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      // there was an error
      DebugLogger.error(this.gl.getProgramInfoLog(this.program) || "Program linking failed");
    }

    // Create a buffer for the vertex coordinates
    this.vertexBuffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array((this.rollBufferSize + 2) * 2 * numLines),
      this.gl.DYNAMIC_DRAW
    );

    this.aPositionLocation = this.gl.getAttribLocation(this.program, "a_position");
    this.gl.vertexAttribPointer(this.aPositionLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.aPositionLocation);

    // Create a buffer for the colors
    this.colorBuffer = this.gl.createBuffer();

    const colors = Array((this.rollBufferSize + 2) * 3 * numLines).fill(128);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Uint8Array(colors),
      this.gl.STATIC_DRAW
    );

    this.aColorLocation = this.gl.getAttribLocation(this.program, "a_color");
    this.gl.vertexAttribPointer(
      this.aColorLocation,
      3,
      this.gl.UNSIGNED_BYTE,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(this.aColorLocation);

    this.uShiftLocation = this.gl.getUniformLocation(this.program, "uShift")!;

    //this.uColorLocation = this.gl.getUniformLocation(this.program, "uColor");
  }

  addPoint(ys: number[]) {
    const bfsize = this.rollBufferSize + 2;
    this.shift += 2 / this.rollBufferSize;
    this.dataX += 2 / this.rollBufferSize;
    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.uShiftLocation, this.shift);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

    for (let i = 0; i < this.numLines; i++) {
      this.gl.bufferSubData(
        this.gl.ARRAY_BUFFER,
        (this.dataIndex + bfsize * i) * 2 * 4,
        new Float32Array([this.dataX, ys[i]])
      );
    }

    this.gl.enableVertexAttribArray(this.aPositionLocation);

    if (this.dataIndex === this.rollBufferSize - 1) {
      for (let i = 0; i < this.numLines; i++) {
        //????????????????
        this.lastDataX[i] = this.dataX;
        this.lastDataY[i] = ys[i];
      }
    }

    if (this.dataIndex === 0 && this.lastDataX[0] !== 0) {
      for (let i = 0; i < this.numLines; i++) {
        this.gl.bufferSubData(
          this.gl.ARRAY_BUFFER,
          (this.rollBufferSize + bfsize * i) * 2 * 4,
          new Float32Array([
            this.lastDataX[i],
            this.lastDataY[i],
            this.dataX,
            ys[i],
          ])
        );
      }
    }

    this.dataIndex = (this.dataIndex + 1) % this.rollBufferSize;
  }

  addPoints(ys: number[][]) {
    const bfsize = this.rollBufferSize + 2;

    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.uShiftLocation, this.shift);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

    let index = this.dataIndex;
    let lastX = 0;

    for (let line = 0; line < ys.length; line++) {
      index = this.dataIndex;
      lastX = 0;

      for (let i = 0; i < ys[line].length; i++) {
        const x = this.dataX + (i * 2) / this.rollBufferSize;

        if (index < this.rollBufferSize) {
          this.gl.bufferSubData(
            this.gl.ARRAY_BUFFER,
            (index + line * bfsize) * 2 * 4,
            new Float32Array([x, ys[line][i]])
          );
        }

        if (index === this.rollBufferSize - 1) {
          this.lastDataX[line] = x;
          this.lastDataY[line] = ys[line][i];
        }

        if (index % this.rollBufferSize === 0 && this.lastDataX[line] !== 0) {
          this.gl.bufferSubData(
            this.gl.ARRAY_BUFFER,
            (this.rollBufferSize + line * bfsize) * 2 * 4,
            new Float32Array([
              this.lastDataX[line],
              this.lastDataY[line],
              x,
              ys[line][i],
            ])
          );
        }

        if (index >= this.rollBufferSize) {
          const index2 = index % this.rollBufferSize;
          this.gl.bufferSubData(
            this.gl.ARRAY_BUFFER,
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

    this.gl.enableVertexAttribArray(this.aPositionLocation);
  }

  private drawOld() {
    const bfsize = this.rollBufferSize + 2;
    this.gl.useProgram(this.program);

    for (let i = 0; i < this.numLines; i++) {
      this.gl.drawArrays(this.gl.LINE_STRIP, i * bfsize, this.dataIndex);
      this.gl.drawArrays(
        this.gl.LINE_STRIP,
        i * bfsize + this.dataIndex,
        this.rollBufferSize - this.dataIndex
      );
      this.gl.drawArrays(this.gl.LINE_STRIP, i * bfsize + this.rollBufferSize, 2);
    }
  }

  private drawExt() {
    const bfsize = this.rollBufferSize + 2;
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
    if (!this.ext) {
      throw new Error("Multi draw extension not available");
    }
    this.ext.multiDrawArraysWEBGL(
      this.gl.LINE_STRIP,
      firsts,
      0,
      counts,
      0,
      counts.length
    );
  }

  draw() {
    if (this.ext) {
      this.drawExt();
    } else {
      this.drawOld();
    }
  }

  setLineColor(colors: ColorRGBA, lineIndex: number) {
    this.gl.useProgram(this.program);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);

    const colorsArray = [];
    for (let i = 0; i < this.rollBufferSize + 2; i++) {
      colorsArray.push(colors.r);
      colorsArray.push(colors.g);
      colorsArray.push(colors.b);
    }

    this.gl.bufferSubData(
      this.gl.ARRAY_BUFFER,
      (this.rollBufferSize + 2) * 3 * lineIndex * 1,
      new Uint8Array(colorsArray)
    );

    this.gl.enableVertexAttribArray(this.aColorLocation);
  }
}
