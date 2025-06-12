/**
 * Author Danial Chitnis 2019-23
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */

import { ColorRGBA } from "./ColorRGBA";
import { WebglAux } from "./WbglAux";
import { WebglScatterAcc } from "./WbglScatterAcc";
import { WebglLine } from "./WbglLine";
import { WebglLineRoll } from "./WbglLineRoll";
import { WebglLinePlot } from "./WbglLinePlot";
import { WebglLineThick } from "./WbglLineThick";
import type { LineConfig } from "./LineConfig";

export type { LineConfig }; // Export LineConfig instead of LineInitData

export {
  WebglAux,
  ColorRGBA,
  WebglScatterAcc,
  WebglLine,
  WebglLineRoll,
  WebglLinePlot,
  WebglLineThick,
};

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
  public width: number;
  public height: number;

  /**
   * Creates a new WebglLineThick instance for rendering thick lines.
   * @param maxLines The maximum number of thick lines this instance can handle.
   * @returns A new WebglLineThick instance.
   *
   * Note: The `lineData` parameter was removed from the factory method itself.
   * You would call `initLines()` on the returned instance to provide the data.
   */
  public newThickLinePlotter(maxLines: number): WebglLineThick {
    return new WebglLineThick({ gl: this.gl }, maxLines);
  }

  /**
   * Creates a new WebglLinePlot instance for rendering thin lines.
   * @param maxLines The maximum number of thin lines this instance can handle.
   * @returns A new WebglLinePlot instance.
   */
  public newThinLinePlotter(maxLines: number): WebglLinePlot {
    return new WebglLinePlot(this, maxLines);
  }

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

    this.width = canvas.width;
    this.height = canvas.height;

    // Set the view port
    gl.viewport(0, 0, canvas.width, canvas.height);

    //https://learnopengl.com/Advanced-OpenGL/Blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /**
   * Draw and clear the canvas
   */
  public update(): void {
    this.clear();
    //this.draw();
  }

  /**
   * Clear the canvas
   */
  public clear(): void {
    //this.webgl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

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

  /**
   * @deprecated The newThickLine method along with WebglLineThick class should be used instead.
   */
  public newLine(webglLine: WebglLine): void {
    this.log(
      "Deprecated: newLine is deprecated. Use newThickLine with WebglLineThick."
    );
    // This method would typically add the line to an internal list of lines to be drawn.
    // Since the old rendering logic is being phased out, this might be a no-op or
    // delegate to a compatible structure if one exists.
    // For now, as we are focusing on WebglLineThick, we'll just log the deprecation.
  }
}
