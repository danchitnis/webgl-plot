/**
 * Author Danial Chitnis 2019
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */

import { ColorRGBA } from "./ColorRGBA.js";
import { WebglLine } from "./WbglLine.js";
import { WebglStep } from "./WbglStep.js";
import { WebglPolar } from "./WbglPolar.js";
import { WebglBaseLine } from "./WebglBaseLine.js";

export { WebglLine, ColorRGBA, WebglStep, WebglPolar };

/**
 * The main class for the webgl-plot library
 */
export class WebGLplot {
  /**
   * @private
   */
  private webgl: WebGLRenderingContext;

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
  public lines: WebglBaseLine[];

  /**
   * Create a webgl-plot instance
   * @param canv - the HTML canvas in which the plot appears
   * 
   * @example
   * ```typescript
   * const canv = dcoument.getEelementbyId("canvas");
   * const webglp = new WebGLplot(canv);
   * ```
   */
  constructor(canv: HTMLCanvasElement) {
    const devicePixelRatio = window.devicePixelRatio || 1;

    // set the size of the drawingBuffer based on the size it's displayed.
    canv.width = canv.clientWidth * devicePixelRatio;
    canv.height = canv.clientHeight * devicePixelRatio;

    const webgl = canv.getContext("webgl", {
      antialias: true,
      transparent: false
    }) as WebGLRenderingContext;

    this.lines = [];

    this.webgl = webgl;

    this.gScaleX = 1;
    this.gScaleY = 1;
    this.gXYratio = 1;
    this.gOffsetX = 0;
    this.gOffsetY = 0;

    // Enable the depth test
    webgl.enable(webgl.DEPTH_TEST);

    // Clear the color and depth buffer
    webgl.clear(webgl.COLOR_BUFFER_BIT || webgl.DEPTH_BUFFER_BIT);

    // Set the view port
    webgl.viewport(0, 0, canv.width, canv.height);
  }

  /**
   * updates and redraws the content of the plot
   */
  public update(): void {
    const webgl = this.webgl;

    this.lines.forEach(line => {
      if (line.visible) {
        webgl.useProgram(line._prog);

        const uscale = webgl.getUniformLocation(line._prog, "uscale");
        webgl.uniformMatrix2fv(
          uscale,
          false,
          new Float32Array([
            line.scaleX * this.gScaleX,
            0,
            0,
            line.scaleY * this.gScaleY * this.gXYratio
          ])
        );

        const uoffset = webgl.getUniformLocation(line._prog, "uoffset");
        webgl.uniform2fv(
          uoffset,
          new Float32Array([
            line.offsetX + this.gOffsetX,
            line.offsetY + this.gOffsetY
          ])
        );

        const uColor = webgl.getUniformLocation(line._prog, "uColor");
        webgl.uniform4fv(uColor, [
          line.color.r,
          line.color.g,
          line.color.b,
          line.color.a
        ]);

        webgl.bufferData(
          webgl.ARRAY_BUFFER,
          line.xy as ArrayBuffer,
          webgl.STREAM_DRAW
        );

        webgl.drawArrays(
          line.loop ? webgl.LINE_LOOP : webgl.LINE_STRIP,
          0,
          line.webglNumPoints
        );
      }
    });
  }

  public clear(): void {
    // Clear the canvas  //??????????????????
    //this.webgl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.webgl.clear(
      this.webgl.COLOR_BUFFER_BIT || this.webgl.DEPTH_BUFFER_BIT
    );
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
  public addLine(line: WebglBaseLine): void {
    line._vbuffer = this.webgl.createBuffer() as WebGLBuffer;
    this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);
    this.webgl.bufferData(
      this.webgl.ARRAY_BUFFER,
      line.xy as ArrayBuffer,
      this.webgl.STREAM_DRAW
    );

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
    line._prog = this.webgl.createProgram() as WebGLProgram;
    this.webgl.attachShader(line._prog, vertShader as WebGLShader);
    this.webgl.attachShader(line._prog, fragShader as WebGLShader);
    this.webgl.linkProgram(line._prog);

    this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);

    line._coord = this.webgl.getAttribLocation(line._prog, "coordinates");
    this.webgl.vertexAttribPointer(
      line._coord,
      2,
      this.webgl.FLOAT,
      false,
      0,
      0
    );
    this.webgl.enableVertexAttribArray(line._coord);

    this.lines.push(line);
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
}
