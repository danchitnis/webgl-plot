/**
 * Author Danial Chitnis 2019-20
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */

import { ColorRGBA } from "./ColorRGBA";
import { WebglAux } from "./WbglAux";
import type { WebglBase } from "./WebglBase";
import { WebglScatterAcc } from "./WbglScatterAcc";

export { WebglAux, ColorRGBA, WebglScatterAcc };

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
  public readonly gl: WebGL2RenderingContext;

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
   * log debug output
   */
  public debug = false;

  constructor(canvas: HTMLCanvasElement, options?: WebglPlotConfig) {
    if (options == undefined) {
      this.gl = canvas.getContext("webgl2", {
        antialias: true,
        transparent: false,
      }) as WebGL2RenderingContext;
    } else {
      this.gl = canvas.getContext("webgl2", {
        antialias: options.antialias,
        transparent: options.transparent,
        desynchronized: options.deSync,
        powerPerformance: options.powerPerformance,
        preserveDrawing: options.preserveDrawing,
      }) as WebGL2RenderingContext;
      this.debug = options.debug == undefined ? false : options.debug;
    }

    this.log("canvas type is: " + canvas.constructor.name);
    this.log(`[webgl-plot]:width=${canvas.width}, height=${canvas.height}`);

    const gl = this.gl;

    this.gScaleX = 1;
    this.gScaleY = 1;
    this.gXYratio = 1;
    this.gOffsetX = 0;
    this.gOffsetY = 0;

    // Set the view port
    gl.viewport(0, 0, canvas.width, canvas.height);

    //https://learnopengl.com/Advanced-OpenGL/Blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /**
   * updates and redraws the content of the plot
   */
  private _drawLines(lines: WebglBase[]): void {
    const webgl = this.gl;
  }

  /**
   * Draw and clear the canvas
   */
  public update(): void {
    this.clear();
    //this.draw();
  }

  /**
   * Draw without clearing the canvas
   */

  /**
   * Clear the canvas
   */
  public clear(): void {
    //this.webgl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
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
  /*private _addLine(line: WebglLine | WebglStep | WebglPolar | WebglSquare | WebglThickLine): void {
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
  }*/

  /**
   * remove all data lines
   */

  /**
   * Change the WbGL viewport
   * @param a
   * @param b
   * @param c
   * @param d
   */
  public viewport(a: number, b: number, c: number, d: number): void {
    this.gl.viewport(a, b, c, d);
  }

  private log(str: string): void {
    if (this.debug) {
      console.log("[webgl-plot]:" + str);
    }
  }
}
