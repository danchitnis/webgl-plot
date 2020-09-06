/**
 * Author Danial Chitnis 2019-20
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */

import { ColorRGBA } from "./ColorRGBA";
import { WebglLine } from "./WbglLine";
import { WebglStep } from "./WbglStep";
import { WebglPolar } from "./WbglPolar";
import { WebglBaseLine } from "./WebglBaseLine";

export { WebglLine, ColorRGBA, WebglStep, WebglPolar };

type WebGLPlotConfig = {
  antialias?: boolean;
  transparent?: boolean;
  powerPerformance?: "default" | "high-performance" | "low-power";
  deSync?: boolean;
  preserveDrawing?: boolean;
  debug?: boolean;
};

/**
 * The main class for the webgl-plot library
 */
export default class WebGLPlot {
  /**
   * @private
   */
  private readonly webgl: WebGLRenderingContext;

  /**
   * Global horizontal scale factor
   * @default = 1.0
   */
  public gScaleX: number;

  /**
   * Global vertical scale factor
   * @default = 1.0
   */
  public gScaleY: number;

  /**
   * Global X/Y scale ratio
   * @default = 1
   */
  public gXYratio: number;

  /**
   * Global horizontal offset
   * @default = 0
   */
  public gOffsetX: number;

  /**
   * Global vertical offset
   * @default = 0
   */
  public gOffsetY: number;

  /**
   * collection of lines in the plot
   */
  private _lines: WebglBaseLine[];

  private progThinLine: WebGLProgram;

  /**
   * log debug output
   */
  public debug = false;

  /**
   * Create a webgl-plot instance
   * @param canvas - the canvas in which the plot appears
   * @param debug - (Optional) log debug messages to console
   *
   * @example
   *
   * For HTMLCanvas
   * ```typescript
   * const canvas = dcoument.getEelementbyId("canvas");
   *
   * const devicePixelRatio = window.devicePixelRatio || 1;
   * canvas.width = canvas.clientWidth * devicePixelRatio;
   * canvas.height = canvas.clientHeight * devicePixelRatio;
   *
   * const webglp = new WebGLplot(canvas);
   * ...
   * ```
   * @example
   *
   * For OffScreenCanvas
   * ```typescript
   * const offscreen = htmlCanvas.transferControlToOffscreen();
   *
   * offscreen.width = htmlCanvas.clientWidth * window.devicePixelRatio;
   * offscreen.height = htmlCanvas.clientHeight * window.devicePixelRatio;
   *
   * const worker = new Worker("offScreenCanvas.js", { type: "module" });
   * worker.postMessage({ canvas: offscreen }, [offscreen]);
   * ```
   * Then in offScreenCanvas.js
   * ```typescript
   * onmessage = function (evt) {
   * const wglp = new WebGLplot(evt.data.canvas);
   * ...
   * }
   * ```
   */
  constructor(canvas: HTMLCanvasElement | OffscreenCanvas, options?: WebGLPlotConfig) {
    if (options == undefined) {
      this.webgl = canvas.getContext("webgl", {
        antialias: true,
        transparent: false,
      }) as WebGLRenderingContext;
    } else {
      this.webgl = canvas.getContext("webgl", {
        antialias: options.antialias,
        transparent: options.transparent,
        desynchronized: options.deSync,
        powerPerformance: options.powerPerformance,
        preserveDrawing: options.preserveDrawing,
      }) as WebGLRenderingContext;
      this.debug = options.debug == undefined ? false : options.debug;
    }

    this.log("canvas type is: " + canvas.constructor.name);
    this.log(`[webgl-plot]:width=${canvas.width}, height=${canvas.height}`);

    this._lines = [];

    //this.webgl = webgl;

    this.gScaleX = 1;
    this.gScaleY = 1;
    this.gXYratio = 1;
    this.gOffsetX = 0;
    this.gOffsetY = 0;

    // Enable the depth test
    this.webgl.enable(this.webgl.DEPTH_TEST);

    // Clear the color and depth buffer
    this.webgl.clear(this.webgl.COLOR_BUFFER_BIT || this.webgl.DEPTH_BUFFER_BIT);

    // Set the view port
    this.webgl.viewport(0, 0, canvas.width, canvas.height);

    this.progThinLine = this.webgl.createProgram() as WebGLProgram;

    this.initThinLineProgram();
  }

  get lines(): WebglBaseLine[] {
    return this._lines;
  }

  /**
   * updates and redraws the content of the plot
   */
  public update(): void {
    const webgl = this.webgl;

    this.lines.forEach((line) => {
      if (line.visible) {
        webgl.useProgram(this.progThinLine);

        const uscale = webgl.getUniformLocation(this.progThinLine, "uscale");
        webgl.uniformMatrix2fv(
          uscale,
          false,
          new Float32Array([
            line.scaleX * this.gScaleX,
            0,
            0,
            line.scaleY * this.gScaleY * this.gXYratio,
          ])
        );

        const uoffset = webgl.getUniformLocation(this.progThinLine, "uoffset");
        webgl.uniform2fv(
          uoffset,
          new Float32Array([line.offsetX + this.gOffsetX, line.offsetY + this.gOffsetY])
        );

        const uColor = webgl.getUniformLocation(this.progThinLine, "uColor");
        webgl.uniform4fv(uColor, [line.color.r, line.color.g, line.color.b, line.color.a]);

        webgl.bufferData(webgl.ARRAY_BUFFER, line.xy as ArrayBuffer, webgl.STREAM_DRAW);

        webgl.drawArrays(line.loop ? webgl.LINE_LOOP : webgl.LINE_STRIP, 0, line.webglNumPoints);
      }
    });
  }

  public clear(): void {
    // Clear the canvas  //??????????????????
    //this.webgl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.webgl.clear(this.webgl.COLOR_BUFFER_BIT || this.webgl.DEPTH_BUFFER_BIT);
  }

  /**
   * adds a line to the plot
   * @param line - this could be any of line, linestep, histogram, or polar
   *
   * @example
   * ```typescript
   * const line = new line(color, numPoints);
   * wglp.addLine(line);
   * ```
   */
  public addLine(line: WebglLine | WebglStep | WebglPolar): void {
    //line.initProgram(this.webgl);
    line._vbuffer = this.webgl.createBuffer() as WebGLBuffer;
    this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);
    this.webgl.bufferData(this.webgl.ARRAY_BUFFER, line.xy as ArrayBuffer, this.webgl.STREAM_DRAW);

    this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);

    line._coord = this.webgl.getAttribLocation(this.progThinLine, "coordinates");
    this.webgl.vertexAttribPointer(line._coord, 2, this.webgl.FLOAT, false, 0, 0);
    this.webgl.enableVertexAttribArray(line._coord);

    this.lines.push(line);
  }

  private initThinLineProgram() {
    const vertCode = `
      attribute vec2 coordinates;
      uniform mat2 uscale;
      uniform vec2 uoffset;
      void main(void) {
         gl_Position = vec4(uscale*coordinates + uoffset, 0.0, 1.0);
      }`;

    // Create a vertex shader object
    const vertShader = this.webgl.createShader(this.webgl.VERTEX_SHADER);

    // Attach vertex shader source code
    this.webgl.shaderSource(vertShader as WebGLShader, vertCode);

    // Compile the vertex shader
    this.webgl.compileShader(vertShader as WebGLShader);

    // Fragment shader source code
    const fragCode = `
         precision mediump float;
         uniform highp vec4 uColor;
         void main(void) {
            gl_FragColor =  uColor;
         }`;

    const fragShader = this.webgl.createShader(this.webgl.FRAGMENT_SHADER);
    this.webgl.shaderSource(fragShader as WebGLShader, fragCode);
    this.webgl.compileShader(fragShader as WebGLShader);
    this.progThinLine = this.webgl.createProgram() as WebGLProgram;
    this.webgl.attachShader(this.progThinLine, vertShader as WebGLShader);
    this.webgl.attachShader(this.progThinLine, fragShader as WebGLShader);
    this.webgl.linkProgram(this.progThinLine);
  }

  /**
   * remove the last line
   */
  public popLine(): void {
    this.lines.pop();
  }

  /**
   * remove all the lines
   */
  public removeAllLines(): void {
    this._lines = [];
  }

  /**
   * Change the WbGL viewport
   * @param a
   * @param b
   * @param c
   * @param d
   */
  public viewport(a: number, b: number, c: number, d: number): void {
    this.webgl.viewport(a, b, c, d);
  }

  private log(str: string): void {
    if (this.debug) {
      console.log("[webgl-plot]:" + str);
    }
  }
}
