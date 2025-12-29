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
  private filled: number;
  private ext: WEBGL_multi_draw | null;
  private colorBuffer: WebGLBuffer;
  private aColorLocation: number;
  private uShiftLocation: WebGLUniformLocation;
  private uploadScratch: Float32Array[];
  private bridgeScratch: Float32Array;
  private multiFirsts: Int32Array;
  private multiCounts: Int32Array;

  constructor(gl: WebGL2RenderingContext, rollBufferSize: number, numLines: number) {
    this.gl = gl;
    this.rollBufferSize = rollBufferSize;
    this.shift = 0;
    this.dataIndex = 0;
    this.dataX = 1;
    this.lastDataX = Array(numLines).fill(0);
    this.lastDataY = Array(numLines).fill(0);
    this.numLines = numLines;
    this.filled = 0;
    this.uploadScratch = Array.from({ length: numLines }, () => new Float32Array(0));
    this.bridgeScratch = new Float32Array(4);
    // Two segments per line (tail+bridge, head) for multi-draw.
    this.multiFirsts = new Int32Array(numLines * 2);
    this.multiCounts = new Int32Array(numLines * 2);

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

            vColor = a_color;
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
      true,
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
    if (this.filled < this.rollBufferSize) {
      this.filled++;
    }
  }

  addPoints(ys: ReadonlyArray<ArrayLike<number>>) {
    const bfsize = this.rollBufferSize + 2;

    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.uShiftLocation, this.shift);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

    let lastGlobalX = this.dataX;
    let nextDataIndex = this.dataIndex;

    for (let line = 0; line < ys.length; line++) {
      const samples = ys[line];
      const sampleCount = samples.length;
      if (sampleCount === 0) {
        continue;
      }

      // Ensure scratch buffer is large enough; reuse to avoid allocations per frame.
      if (this.uploadScratch[line].length < sampleCount * 2) {
        this.uploadScratch[line] = new Float32Array(sampleCount * 2);
      }

      const scratch = this.uploadScratch[line];
      const baseOffset = line * bfsize;
      const startIndex = this.dataIndex;

      // Populate scratch with interleaved [x,y] pairs for this line.
      for (let i = 0; i < sampleCount; i++) {
        const x = this.dataX + (i * 2) / this.rollBufferSize;
        const y = samples[i];
        scratch[i * 2] = x;
        scratch[i * 2 + 1] = y;
      }

      const endIndex = startIndex + sampleCount;
      const needsWrap = endIndex > this.rollBufferSize;

      if (!needsWrap) {
        // Single contiguous upload
        this.gl.bufferSubData(
          this.gl.ARRAY_BUFFER,
          (startIndex + baseOffset) * 2 * 4,
          scratch.subarray(0, sampleCount * 2)
        );

        // If we're writing at the start of the ring (i.e., after a wrap), refresh the bridge.
        // This avoids a long straight chord when drawing the wrapped strip.
        if (startIndex === 0 && (this.lastDataX[line] !== 0 || this.lastDataY[line] !== 0)) {
          this.bridgeScratch[0] = this.lastDataX[line];
          this.bridgeScratch[1] = this.lastDataY[line];
          this.bridgeScratch[2] = scratch[0];
          this.bridgeScratch[3] = scratch[1];
          this.gl.bufferSubData(
            this.gl.ARRAY_BUFFER,
            (this.rollBufferSize + baseOffset) * 2 * 4,
            this.bridgeScratch
          );
        }
      } else {
        const fit = this.rollBufferSize - startIndex;
        const remain = sampleCount - fit;
        // First segment to end of buffer
        this.gl.bufferSubData(
          this.gl.ARRAY_BUFFER,
          (startIndex + baseOffset) * 2 * 4,
          scratch.subarray(0, fit * 2)
        );
        // Wrap segment to start of buffer
        this.gl.bufferSubData(
          this.gl.ARRAY_BUFFER,
          baseOffset * 2 * 4,
          scratch.subarray(fit * 2, sampleCount * 2)
        );

        // Write the two bridging points into the extra slot to keep continuity across wrap.
        // Bridge must connect the last point of the tail segment to the first point of the wrapped segment.
        // Using previous-frame last/first-sample can create a long straight chord across the plot.
        if (fit > 0 && remain > 0) {
          const tailLast = (fit - 1) * 2;
          const headFirst = fit * 2;
          this.bridgeScratch[0] = scratch[tailLast];
          this.bridgeScratch[1] = scratch[tailLast + 1];
          this.bridgeScratch[2] = scratch[headFirst];
          this.bridgeScratch[3] = scratch[headFirst + 1];
          this.gl.bufferSubData(
            this.gl.ARRAY_BUFFER,
            (this.rollBufferSize + baseOffset) * 2 * 4,
            this.bridgeScratch
          );
        }
      }

      // Track last sample for continuity and next frame positioning
      const lastSampleX = this.dataX + ((sampleCount - 1) * 2) / this.rollBufferSize;
      const lastSampleY = samples[sampleCount - 1];
      this.lastDataX[line] = lastSampleX;
      this.lastDataY[line] = lastSampleY;

      nextDataIndex = endIndex % this.rollBufferSize;
      lastGlobalX = lastSampleX;
    }

    // Advance shift/dataX/index once per batch (all lines share the same progression)
    const advanceCount = ys[0]?.length ?? 0;
    this.shift += advanceCount * (2 / this.rollBufferSize);
    this.dataX = lastGlobalX + 2 / this.rollBufferSize;
    this.dataIndex = nextDataIndex;
    if (this.filled < this.rollBufferSize) {
      this.filled = Math.min(this.rollBufferSize, this.filled + advanceCount);
    }

    this.gl.enableVertexAttribArray(this.aPositionLocation);
  }

  private drawOld() {
    const bfsize = this.rollBufferSize + 2;
    this.gl.useProgram(this.program);

    for (let i = 0; i < this.numLines; i++) {
      const base = i * bfsize;
      // Until the ring is filled, only draw the initialized prefix.
      // This avoids long straight chords formed by uninitialized (0,0) vertices.
      if (this.filled < this.rollBufferSize) {
        if (this.filled > 1) {
          this.gl.drawArrays(this.gl.LINE_STRIP, base, this.filled);
        }
        continue;
      }

      // If dataIndex is 0, the ring hasn't wrapped for drawing purposes; don't include the bridge.
      if (this.dataIndex === 0) {
        this.gl.drawArrays(this.gl.LINE_STRIP, base, this.rollBufferSize);
        continue;
      }

      const tailCount = this.rollBufferSize - this.dataIndex + 2; // tail plus 2-point bridge
      const headCount = this.dataIndex; // head segment

      // Draw tail (from write head to end, plus bridge segment)
      this.gl.drawArrays(this.gl.LINE_STRIP, base + this.dataIndex, tailCount);

      // Draw head (start to head)
      if (headCount > 0) {
        this.gl.drawArrays(this.gl.LINE_STRIP, base, headCount);
      }
    }
  }

  private drawExt() {
    const bfsize = this.rollBufferSize + 2;
    this.gl.useProgram(this.program);

    // Until the ring is filled, drawing without wrap/bridge is both correct and faster.
    if (this.filled < this.rollBufferSize) {
      for (let i = 0; i < this.numLines; i++) {
        const base = i * bfsize;
        if (this.filled > 1) {
          this.gl.drawArrays(this.gl.LINE_STRIP, base, this.filled);
        }
      }
      return;
    }

    // Two segments per line: tail(+bridge), head
    const headCount = this.dataIndex;
    const tailCount = this.dataIndex === 0 ? this.rollBufferSize : (this.rollBufferSize - this.dataIndex + 2);
    for (let i = 0; i < this.numLines; i++) {
      const base = i * bfsize;
      const o = i * 2;
      this.multiFirsts[o] = base + this.dataIndex;
      this.multiCounts[o] = tailCount;
      this.multiFirsts[o + 1] = base;
      this.multiCounts[o + 1] = headCount;
    }
    if (!this.ext) {
      throw new Error("Multi draw extension not available");
    }
    this.ext.multiDrawArraysWEBGL(
      this.gl.LINE_STRIP,
      this.multiFirsts,
      0,
      this.multiCounts,
      0,
      this.numLines * 2
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
