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
import { WebglSquare } from "./WbglSquare";
import type { WebglBase } from "./WebglBase";
import { WebglThickLine } from "./WbglThickLine";

export { WebglLine, ColorRGBA, WebglStep, WebglPolar, WebglSquare, WebglThickLine };

type WebglPlotConfig = {
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
export class WebglPlot {
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
   * Global log10 of x-axis
   * @default = false
   */
  public gLog10X: boolean;

  /**
   * Global log10 of y-axis
   * @default = false
   */
  public gLog10Y: boolean;

  /**
   * collection of data lines in the plot
   */
  private _linesData: WebglBase[];

  /**
   * collection of auxiliary lines (grids, markers, etc) in the plot
   */
  private _linesAux: WebglBase[];

  private _thickLines: WebglThickLine[];

  private _surfaces: WebglSquare[];

  get linesData(): WebglBase[] {
    return this._linesData;
  }

  get linesAux(): WebglBase[] {
    return this._linesAux;
  }

  get thickLines(): WebglThickLine[] {
    return this._thickLines;
  }

  get surfaces(): WebglSquare[] {
    return this._surfaces;
  }

  private _progLine: WebGLProgram;

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
   * const canvas = document.getElementbyId("canvas");
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
  constructor(canvas: HTMLCanvasElement, options?: WebglPlotConfig) {
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

    this._linesData = [];
    this._linesAux = [];
    this._thickLines = [];
    this._surfaces = [];

    //this.webgl = webgl;

    this.gScaleX = 1;
    this.gScaleY = 1;
    this.gXYratio = 1;
    this.gOffsetX = 0;
    this.gOffsetY = 0;
    this.gLog10X = false;
    this.gLog10Y = false;

    // Clear the color
    this.webgl.clear(this.webgl.COLOR_BUFFER_BIT);

    // Set the view port
    this.webgl.viewport(0, 0, canvas.width, canvas.height);

    this._progLine = this.webgl.createProgram() as WebGLProgram;

    this.initThinLineProgram();

    //https://learnopengl.com/Advanced-OpenGL/Blending
    this.webgl.enable(this.webgl.BLEND);
    this.webgl.blendFunc(this.webgl.SRC_ALPHA, this.webgl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * updates and redraws the content of the plot
   */
  private _drawLines(lines: WebglBase[]): void {
    const webgl = this.webgl;

    lines.forEach((line) => {
      if (line.visible) {
        webgl.useProgram(this._progLine);

        const uscale = webgl.getUniformLocation(this._progLine, "uscale");
        webgl.uniformMatrix2fv(
          uscale,
          false,
          new Float32Array([
            line.scaleX * this.gScaleX * (this.gLog10X ? 1 / Math.log(10) : 1),
            0,
            0,
            line.scaleY * this.gScaleY * this.gXYratio * (this.gLog10Y ? 1 / Math.log(10) : 1),
          ])
        );

        const uoffset = webgl.getUniformLocation(this._progLine, "uoffset");
        webgl.uniform2fv(
          uoffset,
          new Float32Array([line.offsetX + this.gOffsetX, line.offsetY + this.gOffsetY])
        );

        const isLog = webgl.getUniformLocation(this._progLine, "is_log");
        webgl.uniform2iv(isLog, new Int32Array([this.gLog10X ? 1 : 0, this.gLog10Y ? 1 : 0]));

        const uColor = webgl.getUniformLocation(this._progLine, "uColor");
        webgl.uniform4fv(uColor, [line.color.r, line.color.g, line.color.b, line.color.a]);

        webgl.bufferData(webgl.ARRAY_BUFFER, line.xy as ArrayBuffer, webgl.STREAM_DRAW);

        webgl.drawArrays(line.loop ? webgl.LINE_LOOP : webgl.LINE_STRIP, 0, line.webglNumPoints);
      }
    });
  }

  private _drawSurfaces(squares: WebglSquare[]): void {
    const webgl = this.webgl;

    squares.forEach((square) => {
      if (square.visible) {
        webgl.useProgram(this._progLine);

        const uscale = webgl.getUniformLocation(this._progLine, "uscale");
        webgl.uniformMatrix2fv(
          uscale,
          false,
          new Float32Array([
            square.scaleX * this.gScaleX * (this.gLog10X ? 1 / Math.log(10) : 1),
            0,
            0,
            square.scaleY * this.gScaleY * this.gXYratio * (this.gLog10Y ? 1 / Math.log(10) : 1),
          ])
        );

        const uoffset = webgl.getUniformLocation(this._progLine, "uoffset");
        webgl.uniform2fv(
          uoffset,
          new Float32Array([square.offsetX + this.gOffsetX, square.offsetY + this.gOffsetY])
        );

        const isLog = webgl.getUniformLocation(this._progLine, "is_log");
        webgl.uniform2iv(isLog, new Int32Array([this.gLog10X ? 1 : 0, this.gLog10Y ? 1 : 0]));

        const uColor = webgl.getUniformLocation(this._progLine, "uColor");
        webgl.uniform4fv(uColor, [square.color.r, square.color.g, square.color.b, square.color.a]);

        webgl.bufferData(webgl.ARRAY_BUFFER, square.xy as ArrayBuffer, webgl.STREAM_DRAW);

        webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, square.webglNumPoints);
      }
    });
  }

  private _drawTriangles(thickLine: WebglThickLine): void {
    const webgl = this.webgl;

    webgl.bufferData(webgl.ARRAY_BUFFER, thickLine.xy as ArrayBuffer, webgl.STREAM_DRAW);

    webgl.useProgram(this._progLine);

    const uscale = webgl.getUniformLocation(this._progLine, "uscale");
    webgl.uniformMatrix2fv(
      uscale,
      false,
      new Float32Array([
        thickLine.scaleX * this.gScaleX * (this.gLog10X ? 1 / Math.log(10) : 1),
        0,
        0,
        thickLine.scaleY * this.gScaleY * this.gXYratio * (this.gLog10Y ? 1 / Math.log(10) : 1),
      ])
    );

    const uoffset = webgl.getUniformLocation(this._progLine, "uoffset");
    webgl.uniform2fv(
      uoffset,
      new Float32Array([thickLine.offsetX + this.gOffsetX, thickLine.offsetY + this.gOffsetY])
    );

    const isLog = webgl.getUniformLocation(this._progLine, "is_log");
    webgl.uniform2iv(isLog, new Int32Array([0, 0]));

    const uColor = webgl.getUniformLocation(this._progLine, "uColor");
    webgl.uniform4fv(uColor, [
      thickLine.color.r,
      thickLine.color.g,
      thickLine.color.b,
      thickLine.color.a,
    ]);

    webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, thickLine.xy.length / 2);
  }

  private _drawThickLines(): void {
    this._thickLines.forEach((thickLine) => {
      if (thickLine.visible) {
        const calibFactor = Math.min(this.gScaleX, this.gScaleY);
        //const calibFactor = 10;
        //console.log(thickLine.getThickness());
        thickLine.setActualThickness(thickLine.getThickness() / calibFactor);
        thickLine.convertToTriPoints();
        this._drawTriangles(thickLine);
      }
    });
  }

  /**
   * Draw and clear the canvas
   */
  public update(): void {
    this.clear();
    this.draw();
  }

  /**
   * Draw without clearing the canvas
   */
  public draw(): void {
    this._drawLines(this.linesData);
    this._drawLines(this.linesAux);
    this._drawThickLines();
    this._drawSurfaces(this.surfaces);
  }

  /**
   * Clear the canvas
   */
  public clear(): void {
    //this.webgl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.webgl.clear(this.webgl.COLOR_BUFFER_BIT);
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
  private _addLine(line: WebglLine | WebglStep | WebglPolar | WebglSquare | WebglThickLine): void {
    //line.initProgram(this.webgl);
    line._vbuffer = this.webgl.createBuffer() as WebGLBuffer;
    this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);
    this.webgl.bufferData(this.webgl.ARRAY_BUFFER, line.xy as ArrayBuffer, this.webgl.STREAM_DRAW);

    //this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);

    line._coord = this.webgl.getAttribLocation(this._progLine, "coordinates");
    this.webgl.vertexAttribPointer(line._coord, 2, this.webgl.FLOAT, false, 0, 0);
    this.webgl.enableVertexAttribArray(line._coord);
  }

  public addDataLine(line: WebglLine | WebglStep | WebglPolar): void {
    this._addLine(line);
    this.linesData.push(line);
  }

  public addLine = this.addDataLine;

  public addAuxLine(line: WebglLine | WebglStep | WebglPolar): void {
    this._addLine(line);
    this.linesAux.push(line);
  }

  public addThickLine(thickLine: WebglThickLine): void {
    this._addLine(thickLine);
    this._thickLines.push(thickLine);
  }

  public addSurface(surface: WebglSquare): void {
    this._addLine(surface);
    this.surfaces.push(surface);
  }

  private initThinLineProgram() {
    const vertCode = `
      attribute vec2 coordinates;
      uniform mat2 uscale;
      uniform vec2 uoffset;
      uniform ivec2 is_log;

      void main(void) {
         float x = (is_log[0]==1) ? log(coordinates.x) : coordinates.x;
         float y = (is_log[1]==1) ? log(coordinates.y) : coordinates.y;
         vec2 line = vec2(x, y);
         gl_Position = vec4(uscale*line + uoffset, 0.0, 1.0);
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
    this._progLine = this.webgl.createProgram() as WebGLProgram;
    this.webgl.attachShader(this._progLine, vertShader as WebGLShader);
    this.webgl.attachShader(this._progLine, fragShader as WebGLShader);
    this.webgl.linkProgram(this._progLine);
  }

  /**
   * remove the last data line
   */
  public popDataLine(): void {
    this.linesData.pop();
  }

  /**
   * remove all the lines
   */
  public removeAllLines(): void {
    this._linesData = [];
    this._linesAux = [];
    this._thickLines = [];
    this._surfaces = [];
  }

  /**
   * remove all data lines
   */
  public removeDataLines(): void {
    this._linesData = [];
  }

  /**
   * remove all auxiliary lines
   */
  public removeAuxLines(): void {
    this._linesAux = [];
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
