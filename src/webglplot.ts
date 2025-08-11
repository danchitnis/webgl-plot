/**
 * Author Danial Chitnis 2019-23
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */

import { ColorRGBA } from "./ColorRGBA";
import { WebglAux } from "./WebglAux";
import { WebglScatterAcc } from "./WebglScatterAcc";
import { WebglLine } from "./WebglLine";
import { WebglLineRoll } from "./WebglLineRoll";
import { WebglLinePlot } from "./WebglLinePlot";
import { WebglLineThick } from "./WebglLineThick";
import { WebglPolygonPlot, type PolygonConfig } from "./WebglPolygonPlot";
import { UnifiedLinePlot } from "./UnifiedLinePlot"; // Added import
import type { LineConfig } from "./LineConfig";

export type { LineConfig, PolygonConfig }; // Export LineConfig and PolygonConfig
export { UnifiedLinePlot }; // Added export

export {
  WebglAux,
  ColorRGBA,
  WebglScatterAcc,
  WebglLine,
  WebglLineRoll,
  WebglPolygonPlot,
  // WebglLinePlot, // Direct export might be removed if UnifiedLinePlot is preferred
  // WebglLineThick, // Direct export might be removed if UnifiedLinePlot is preferred
  // Keeping them exported for now for backward compatibility or direct use.
  WebglLinePlot,
  WebglLineThick,
  // UnifiedLinePlot is exported above via `export { UnifiedLinePlot };`
};

/**
 * Parse CSS color string (rgba format) to WebGL color array
 * @param cssColor CSS color string in format "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1
 * @returns Array of [r, g, b, a] where all values are normalized to 0-1 range
 */
function parseCSSColor(cssColor: string): [number, number, number, number] {
  const rgbaMatch = cssColor.match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (!rgbaMatch) {
    throw new Error(`Invalid CSS color format: ${cssColor}. Expected format: "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1`);
  }

  const r = Math.max(0, Math.min(255, parseFloat(rgbaMatch[1]))) / 255;
  const g = Math.max(0, Math.min(255, parseFloat(rgbaMatch[2]))) / 255;
  const b = Math.max(0, Math.min(255, parseFloat(rgbaMatch[3]))) / 255;
  const a = rgbaMatch[4] ? Math.max(0, Math.min(1, parseFloat(rgbaMatch[4]))) : 1;

  return [r, g, b, a];
}

export type WebglPlotConfig = {
  antialias?: boolean;
  transparent?: boolean;
  powerPerformance?: "default" | "high-performance" | "low-power";
  deSync?: boolean;
  preserveDrawing?: boolean;
  debug?: boolean;
  /** 
   * Background color as either:
   * - Array of [r, g, b, a] where all values are 0-1
   * - CSS color string in format "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1
   * Example: [0.1, 0, 0.4, 1] or "rgba(25, 0, 100, 1)"
   */
  backgroundColor?: [number, number, number, number] | string;
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
   * Stored background color
   * @private
   */
  private _backgroundColor: [number, number, number, number];

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

  /**
   * Create a new WebglPlot instance
   * @param canvas HTMLCanvasElement to render on
   * @param options Configuration options including background color
   * 
   * For React applications: To prevent black background flash during initialization,
   * set the canvas CSS background-color to match the WebGL background:
   * ```css
   * canvas { background-color: rgba(25, 0, 100, 1); }
   * ```
   * Or use inline styles:
   * ```jsx
   * <canvas style={{ backgroundColor: 'rgba(25, 0, 100, 1)' }} />
   * ```
   */
  constructor(canvas: HTMLCanvasElement, options?: WebglPlotConfig) {
    if (options == undefined) {
      this.gl = canvas.getContext("webgl2", {
        antialias: true,
        transparent: false,
      }) as WebGL2RenderingContext;
    } else {
      this.gl = canvas.getContext("webgl2", {
        antialias: options.antialias,
        transparent: options.transparent ?? false, // Default to false if not specified
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

    // Set background color from options or default to black
    let bgColor: [number, number, number, number];
    if (options?.backgroundColor) {
      if (typeof options.backgroundColor === 'string') {
        bgColor = parseCSSColor(options.backgroundColor);
      } else {
        bgColor = options.backgroundColor;
      }
    } else {
      bgColor = [0, 0, 0, 1];
    }
    this._backgroundColor = bgColor;
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
    // Ensure background color is set before clearing
    this.gl.clearColor(this._backgroundColor[0], this._backgroundColor[1], this._backgroundColor[2], this._backgroundColor[3]);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /**
   * Set the background color of the canvas
   * @param color Either:
   *   - CSS color string in format "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1
   *   - Array of [r, g, b, a] where all values are 0-1
   * Example: "rgba(25, 0, 100, 1)" or [0.1, 0, 0.4, 1]
   */
  public setBackgroundColor(color: string | [number, number, number, number]): void;
  /**
   * Set the background color of the canvas (legacy method)
   * @param r Red component (0-1)
   * @param g Green component (0-1)
   * @param b Blue component (0-1)
   * @param a Alpha component (0-1)
   */
  public setBackgroundColor(r: number, g: number, b: number, a: number): void;
  public setBackgroundColor(
    colorOrR: string | [number, number, number, number] | number,
    g?: number,
    b?: number,
    a?: number
  ): void {
    if (typeof colorOrR === 'string') {
      this._backgroundColor = parseCSSColor(colorOrR);
    } else if (Array.isArray(colorOrR)) {
      this._backgroundColor = colorOrR;
    } else if (typeof colorOrR === 'number' && g !== undefined && b !== undefined && a !== undefined) {
      this._backgroundColor = [colorOrR, g, b, a];
    } else {
      throw new Error('Invalid arguments. Use either CSS color string, color array, or individual RGBA values.');
    }
    
    this.gl.clearColor(this._backgroundColor[0], this._backgroundColor[1], this._backgroundColor[2], this._backgroundColor[3]);
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
   * Creates a new UnifiedLinePlot instance which internally manages WebglLinePlot or WebglLineThick.
   * @param maxLines The maximum number of lines this instance can handle.
   * @returns A new UnifiedLinePlot instance.
   */
  public newUnifiedLinePlotter(maxLines: number): UnifiedLinePlot {
    return new UnifiedLinePlot(this, maxLines);
  }
}
