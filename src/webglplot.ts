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
import { UnifiedLinePlot } from "./UnifiedLinePlot";
import type { LineConfig } from "./LineConfig";
import { DebugLogger } from "./DebugLogger";
import { setupCanvasAndWebGL, clearCanvas } from "./WebGLHelpers";

// Export types
export type { LineConfig, PolygonConfig };

// Export WebGL helper functions
export {
  // Individual helper functions
  setupCanvas,
  createWebGL2Context,
  setBackgroundColor,
  clearCanvas,
  updateViewport,
  setupCanvasAndWebGL,
  handleCanvasResize,
} from "./WebGLHelpers";

// Import WebGL helpers as namespace for re-export
import * as WebGLHelpers from "./WebGLHelpers";
export { WebGLHelpers };

// Export all plotter classes for direct construction
export {
  // Recommended unified line plotter
  UnifiedLinePlot,
  
  // Individual plotter types
  WebglLinePlot,
  WebglLineThick,
  WebglScatterAcc,
  WebglPolygonPlot,
  
  // Legacy classes (consider deprecating)
  WebglLine,
  WebglLineRoll,
  
  // Utilities
  WebglAux,
  ColorRGBA,
  DebugLogger,
};

// Export coordinate transformation utilities
export {
  transformBoundsToLogSpace,
  transformBoundsToLinearSpace,
  type DataBounds,
} from "./LogAxisUtils";

// Temporary backward compatibility stub for benchmark files  
// @deprecated Use individual plotters with WebGL2RenderingContext directly
export class WebglPlot {
  public readonly gl: WebGL2RenderingContext;
  public gScaleX = 1;
  public gScaleY = 1;
  public gOffsetX = 0;
  public gOffsetY = 0;
  public logX = false;
  public logY = false;
  public debug = false;
  
  constructor(canvas: HTMLCanvasElement, options?: { antialias?: boolean; powerPerformance?: "default" | "high-performance" | "low-power"; backgroundColor?: [number, number, number, number]; debug?: boolean }) {
    this.gl = setupCanvasAndWebGL(canvas, options);
  }
  
  clear() {
    clearCanvas(this.gl);
  }
  
  update() {
    // No-op for compatibility
  }
  
  newUnifiedLinePlotter(maxLines: number) {
    return new UnifiedLinePlot(this.gl, maxLines);
  }
  
  newThinLinePlotter(maxLines: number) {
    return new WebglLinePlot(this.gl, maxLines);
  }
  
  newThickLinePlotter(maxLines: number) {
    return new WebglLineThick(this.gl, maxLines);
  }
}

/**
 * webgl-plot v2 - High Performance 2D WebGL Plotting Library
 * 
 * BREAKING CHANGE: WebglPlot class has been removed.
 * 
 * NEW USAGE:
 * 1. Create WebGL2 context directly: const gl = canvas.getContext('webgl2')
 * 2. Use individual plotters: new UnifiedLinePlot(gl, maxLines)
 * 3. Use WebGLHelpers for common setup tasks
 * 
 * Example:
 * ```typescript
 * import { setupCanvasAndWebGL, UnifiedLinePlot } from 'webgl-plot';
 * 
 * const canvas = document.getElementById('canvas');
 * const gl = setupCanvasAndWebGL(canvas, { backgroundColor: [0, 0, 0, 1] });
 * const plotter = new UnifiedLinePlot(gl, 10);
 * 
 * function render() {
 *   gl.clear(gl.COLOR_BUFFER_BIT);
 *   plotter.draw();
 *   requestAnimationFrame(render);
 * }
 * ```
 */

// Note: Individual plotter usage examples:
// 
// Unified (recommended): new UnifiedLinePlot(gl, maxLines)
// Thin lines only:       new WebglLinePlot(gl, maxLines)
// Thick lines only:      new WebglLineThick(gl, maxLines) 
// Scatter plots:         new WebglScatterAcc(gl, maxPoints)
// Polygons:              new WebglPolygonPlot(gl)
//
// Use WebGLHelpers module for canvas setup utilities
