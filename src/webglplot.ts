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
import { DebugLogger } from "./DebugLogger";

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
  DebugLogger,
  // UnifiedLinePlot is exported above via `export { UnifiedLinePlot };`
};

/**
 * Parse CSS color string (rgba format) to WebGL color array
 * @param cssColor CSS color string in format "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1
 * @returns Array of [r, g, b, a] where all values are normalized to 0-1 range
 */
function parseCSSColor(cssColor: string): [number, number, number, number] {
  const rgbaMatch = cssColor.match(
    /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*([\d.]+))?\s*\)/
  );
  if (!rgbaMatch) {
    throw new Error(
      `Invalid CSS color format: ${cssColor}. Expected format: "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1`
    );
  }

  const r = Math.max(0, Math.min(255, parseFloat(rgbaMatch[1]))) / 255;
  const g = Math.max(0, Math.min(255, parseFloat(rgbaMatch[2]))) / 255;
  const b = Math.max(0, Math.min(255, parseFloat(rgbaMatch[3]))) / 255;
  const a = rgbaMatch[4]
    ? Math.max(0, Math.min(1, parseFloat(rgbaMatch[4])))
    : 1;

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
   * Creates a new WebglLineThick instance for rendering thick lines (thickness > 1.0).
   *
   * **Features:**
   * - Supports variable line thickness with proper joins and end caps
   * - Handles sharp angles with automatic bevel detection
   * - More computationally expensive than thin lines (~6x slower)
   * - Automatically supports log axis transformations on GPU
   *
   * **Performance Notes:**
   * - Use for lines requiring thickness > 1.0 pixel
   * - Consider `newUnifiedLinePlotter()` for automatic thin/thick selection
   * - Thickness is maintained in screen space regardless of zoom level
   *
   * **Example Usage:**
   * ```typescript
   * const thickPlotter = plot.newThickLinePlotter(10);
   * thickPlotter.initLines([{
   *   points: myData,
   *   color: [1, 0, 0, 1],
   *   thickness: 3.0,
   *   enabled: true
   * }]);
   * ```
   *
   * @param maxLines The maximum number of thick lines this instance can handle
   * @returns A new WebglLineThick instance ready for use
   */
  public newThickLinePlotter(maxLines: number): WebglLineThick {
    return new WebglLineThick(this, maxLines);
  }

  /**
   * Creates a new WebglLinePlot instance for rendering thin lines (thickness = 1.0).
   *
   * **Features:**
   * - Highest performance line rendering using native WebGL lines
   * - Fixed thickness of 1.0 pixel in screen space
   * - Automatically supports log axis transformations on GPU
   * - Ideal for high-density data visualization
   *
   * **Performance Notes:**
   * - Fastest line rendering option available
   * - Use for real-time data visualization with many points
   * - Thickness cannot be varied (always 1.0 pixel)
   *
   * **Example Usage:**
   * ```typescript
   * const thinPlotter = plot.newThinLinePlotter(50);
   * thinPlotter.initLines([{
   *   points: realTimeData,
   *   color: [0, 1, 0, 1],
   *   thickness: 1.0, // Will be enforced
   *   enabled: true
   * }]);
   * ```
   *
   * @param maxLines The maximum number of thin lines this instance can handle
   * @returns A new WebglLinePlot instance ready for use
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
   * X-axis logarithmic scale flag
   * @default = false
   */
  public logX: boolean;

  /**
   * Y-axis logarithmic scale flag
   * @default = false
   */
  public logY: boolean;

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
      DebugLogger.setDebugMode(this.debug);
    }

    this.log("canvas type is: " + canvas.constructor.name);
    this.log(`[webgl-plot]:width=${canvas.width}, height=${canvas.height}`);

    const gl = this.gl;

    this.gScaleX = 1;
    this.gScaleY = 1;
    this.gXYratio = 1;
    this.gOffsetX = 0;
    this.gOffsetY = 0;
    this.logX = false;
    this.logY = false;

    this.width = canvas.width;
    this.height = canvas.height;

    // Set the view port
    gl.viewport(0, 0, canvas.width, canvas.height);

    //https://learnopengl.com/Advanced-OpenGL/Blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA);

    // Set background color from options or default to black
    let bgColor: [number, number, number, number];
    if (options?.backgroundColor) {
      if (typeof options.backgroundColor === "string") {
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
   * Clear the canvas
   */
  public clear(): void {
    // Ensure background color is set before clearing
    this.gl.clearColor(
      this._backgroundColor[0],
      this._backgroundColor[1],
      this._backgroundColor[2],
      this._backgroundColor[3]
    );
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /**
   * Set the background color of the canvas
   * @param color Either:
   *   - CSS color string in format "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1
   *   - Array of [r, g, b, a] where all values are 0-1
   * Example: "rgba(25, 0, 100, 1)" or [0.1, 0, 0.4, 1]
   */
  public setBackgroundColor(
    color: string | [number, number, number, number]
  ): void;
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
    if (typeof colorOrR === "string") {
      this._backgroundColor = parseCSSColor(colorOrR);
    } else if (Array.isArray(colorOrR)) {
      this._backgroundColor = colorOrR;
    } else if (
      typeof colorOrR === "number" &&
      g !== undefined &&
      b !== undefined &&
      a !== undefined
    ) {
      this._backgroundColor = [colorOrR, g, b, a];
    } else {
      throw new Error(
        "Invalid arguments. Use either CSS color string, color array, or individual RGBA values."
      );
    }

    this.gl.clearColor(
      this._backgroundColor[0],
      this._backgroundColor[1],
      this._backgroundColor[2],
      this._backgroundColor[3]
    );
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
    DebugLogger.log(str);
  }

  /**
   * Creates a new UnifiedLinePlot instance that automatically chooses between thin and thick line rendering.
   *
   * **Smart Selection Logic:**
   * - Lines with thickness ≤ 1.0 → Uses WebglLinePlot (thin, high performance)
   * - Lines with thickness > 1.0 → Uses WebglLineThick (thick, full-featured)
   * - Decision made based on the first line's thickness in `initLines()`
   *
   * **Features:**
   * - Automatic optimization based on line requirements
   * - Unified API regardless of internal plotter type
   * - Automatically supports log axis transformations on GPU
   * - Seamless switching between rendering backends
   *
   * **Use Cases:**
   * - When you want optimal performance without manual plotter selection
   * - For applications with mixed line thickness requirements
   * - When you need a simple, unified interface for all line types
   *
   * **Example Usage:**
   * ```typescript
   * const plotter = plot.newUnifiedLinePlotter(20);
   * plotter.initLines([
   *   { points: data1, thickness: 1.0, color: [1,0,0,1] }, // → thin plotter
   *   { points: data2, thickness: 3.0, color: [0,1,0,1] }, // → thick plotter (all lines)
   * ]);
   * ```
   *
   * **Note:** All lines in a single UnifiedLinePlot instance use the same internal plotter,
   * determined by the thickness of the first line.
   *
   * @param maxLines The maximum number of lines this instance can handle
   * @returns A new UnifiedLinePlot instance ready for intelligent line rendering
   */
  public newUnifiedLinePlotter(maxLines: number): UnifiedLinePlot {
    return new UnifiedLinePlot(this, maxLines);
  }


  /**
   * Update canvas dimensions and WebGL viewport
   * Call this method when canvas size changes
   */
  public update(): void {
    const canvas = this.gl.canvas as HTMLCanvasElement;
    this.width = canvas.width;
    this.height = canvas.height;
    this.gl.viewport(0, 0, canvas.width, canvas.height);
  }
}
