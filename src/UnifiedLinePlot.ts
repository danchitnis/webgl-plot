import { WebglLinePlot } from "./WebglLinePlot"; // Corrected import
import { WebglLineThick, DataBounds } from "./WebglLineThick"; // Corrected import
import type { LineConfig } from "./LineConfig";
import { DebugLogger } from "./DebugLogger";

export class UnifiedLinePlot {
  private gl: WebGL2RenderingContext;
  private maxLines: number;
  private internalPlotter: WebglLinePlot | WebglLineThick | null = null;

  constructor(gl: WebGL2RenderingContext, maxLines: number) {
    this.gl = gl;
    this.maxLines = maxLines;
  }

  /**
   * Initializes or re-initializes lines. Determines the internal plotter type
   * based on the thickness of the first line in the configuration array.
   * @param linesConfig Array of LineConfig objects.
   */
  public initLines(linesConfig: LineConfig[]): void {
    if (!linesConfig || linesConfig.length === 0) {
      if (this.internalPlotter) {
        // Potentially cleanup or just ensure no lines are drawn
        this.internalPlotter.initLines([]);
      }
      return;
    }

    // Determine primary thickness from the first line, defaulting to 1.0
    let primaryThickness = linesConfig[0].thickness;
    if (primaryThickness === undefined) {
      primaryThickness = 1.0;
    }
    if (primaryThickness < 1.0) {
      primaryThickness = 1.0;
    }

    const useThinPlotter = primaryThickness <= 1.0;

    if (useThinPlotter) {
      if (!(this.internalPlotter instanceof WebglLinePlot)) {
        if (this.internalPlotter) {
          this.internalPlotter.cleanup();
        }
        this.internalPlotter = new WebglLinePlot(this.gl, this.maxLines);
      }
      // Adjust all line configs for the thin plotter: thicknesses become 1.0
      const thinLinesConfig = linesConfig.map((config) => ({
        ...config,
        thickness: 1.0, // All lines will be 1.0 for WebglLinePlot via this unified interface
      }));
      this.internalPlotter.initLines(thinLinesConfig);
    } else {
      // Use thick plotter
      if (!(this.internalPlotter instanceof WebglLineThick)) {
        if (this.internalPlotter) {
          this.internalPlotter.cleanup();
        }
        // WebglLineThick constructor now expects WebGL2RenderingContext
        this.internalPlotter = new WebglLineThick(this.gl, this.maxLines);
      }
      // WebglLineThick can handle varied thicknesses, pass original (or default-adjusted) configs
      // No, it should also use the primaryThickness to decide if all lines are thick.
      // The current logic is: if *first* line is thick, *all* lines are rendered with WebglLineThick.
      // If first line is thin, *all* lines are rendered with WebglLinePlot (as thickness 1).
      // This seems to be the implication of switching plotter based on first line.
      this.internalPlotter.initLines(linesConfig);
    }
  }

  // --- Delegated Methods ---

  public draw(): void {
    if (this.internalPlotter) {
      this.internalPlotter.draw();
    }
  }

  public cleanup(): void {
    if (this.internalPlotter) {
      this.internalPlotter.cleanup();
      this.internalPlotter = null;
    }
  }

  public updateLinePoints(lineId: number, points: Float32Array): void {
    if (this.internalPlotter instanceof WebglLinePlot) {
      this.internalPlotter.updateLinePoints(lineId, points);
    } else if (this.internalPlotter instanceof WebglLineThick) {
      // WebglLineThick does not have a direct updateLinePoints method for XY pairs.
      // initLines is the primary way to update all points.
      // updateLineY can update Y values if X values are presumed constant or managed elsewhere.
      DebugLogger.warn(
        "updateLinePoints(xy) is not directly supported when WebglLineThick is active. " +
        "Consider re-initializing the line with initLines() for full XY updates, " +
        "or use updateLineY() if only Y values need changing and X values are stable."
      );
    } else {
      DebugLogger.warn("updateLinePoints: plotter not initialized.");
    }
  }

  public updateLineY(lineId: number, newY: Float32Array): void {
    if (this.internalPlotter) {
      // WebglLinePlot has updateLineY, WebglLineThick has updateLineY
      this.internalPlotter.updateLineY(lineId, newY);
    }
  }

  public updateLineColor(
    lineId: number,
    color: [number, number, number, number]
  ): void {
    if (this.internalPlotter) {
      this.internalPlotter.updateLineColor(lineId, color);
    }
  }

  public updateLineTransform(
    lineId: number,
    scale: [number, number],
    offset: [number, number]
  ): void {
    if (this.internalPlotter) {
      // Both WebglLinePlot and WebglLineThick have updateLineTransform
      this.internalPlotter.updateLineTransform(lineId, scale, offset);
    } else {
      DebugLogger.warn("updateLineTransform: plotter not initialized.");
    }
  }

  public updateLineThickness(lineId: number, thickness: number): void {
    // This is tricky. If UnifiedLinePlot decided on WebglLinePlot, all thicknesses are 1.
    // If it decided on WebglLineThick, then individual thicknesses can be updated.
    // The decision is based on the *first* line's thickness during initLines.
    // For now, if a WebglLineThick is active, pass it through.
    // If WebglLinePlot is active, this call might be ignored or warn.
    if (this.internalPlotter instanceof WebglLineThick) {
      this.internalPlotter.updateLineThickness(lineId, thickness);
    } else if (this.internalPlotter instanceof WebglLinePlot) {
      // WebglLinePlot uses thickness 1.0. We could warn or update its config if needed.
      // For now, let's assume its `updateLineThickness` handles it (it does store the config).
      (this.internalPlotter as WebglLinePlot).updateLineThickness(lineId, 1.0); // Force 1.0
      DebugLogger.warn(
        "UnifiedLinePlot: WebglLinePlot is active, thickness forced to 1.0."
      );
    }
  }

  public setLineEnabled(lineId: number, enabled: boolean): void {
    if (this.internalPlotter) {
      this.internalPlotter.setLineEnabled(lineId, enabled);
    }
  }

  /**
   * Enable or disable rendering for multiple lines at once.
   * @param lineIds Array of line IDs to enable/disable
   * @param enabled True to enable rendering, false to disable
   */
  public setMultipleLinesEnabled(lineIds: number[], enabled: boolean): void {
    if (this.internalPlotter) {
      if (this.internalPlotter instanceof WebglLinePlot) {
        this.internalPlotter.setMultipleLinesEnabled(lineIds, enabled);
      } else if (this.internalPlotter instanceof WebglLineThick) {
        this.internalPlotter.setLinesEnabled(lineIds, enabled);
      }
    }
  }

  /**
   * Update transform parameters for multiple lines at once.
   * @param lineIds Array of line IDs to update
   * @param scale Scale factors [scaleX, scaleY]
   * @param offset Offset values [offsetX, offsetY]
   */
  public updateMultipleLinesTransform(
    lineIds: number[],
    scale: [number, number],
    offset: [number, number]
  ): void {
    if (this.internalPlotter) {
      if (this.internalPlotter instanceof WebglLinePlot) {
        this.internalPlotter.updateMultipleLinesTransform(lineIds, scale, offset);
      } else if (this.internalPlotter instanceof WebglLineThick) {
        this.internalPlotter.updateLinesTransform(lineIds, scale, offset);
      }
    }
  }

  public setGlobalTransform(
    scale: [number, number],
    offset: [number, number]
  ): void {
    if (this.internalPlotter) {
      this.internalPlotter.setGlobalTransform(scale, offset);
    }
  }

  /**
   * Auto-scale to fit all enabled lines in the current coordinate space.
   *
   * **IMPORTANT**: This method operates within the current coordinate space (linear or log)
   * and does NOT change coordinate spaces. It calculates bounds appropriate for the current
   * axis configuration and applies the transform.
   *
   * **Use autoScale() when:**
   * - Want to fit all data in the current coordinate space
   * - Need simple auto-scaling without changing coordinate spaces
   * - Don't need to preserve current zoom/pan state
   *
   * **⚠️ WARNING: Do NOT combine autoScale() with coordinate transforms!**
   * - autoScale() already works in the current coordinate space
   * - Calling transformToLogSpace() after autoScale() causes double-conversion
   *
   * **For coordinate space changes, use:**
   * - `transformToLogSpace()` - Switch to or operate in log space
   * - `transformToLinearSpace()` - Switch to or operate in linear space
   *
   * @returns DataBounds object with calculated bounds in current coordinate space, or null if no valid data
   *
   * @example
   * ```typescript
   * // ✅ CORRECT: Simple auto-scaling in current coordinate space
   * plotter.setLogAxis(false, true); // Enable log Y
   * plotter.autoScale(); // Auto-scales in log Y space - NO conversion needed!
   * 
   * // ❌ WRONG: Don't combine autoScale() with coordinate transforms
   * // const bounds = plotter.autoScale();
   * // plotter.transformToLogSpace(bounds); // This causes double-conversion!
   * 
   * // ✅ CORRECT: For coordinate space conversion, use getAllDataBounds():
   * // plotter.setLogAxis(false, true); // Enable log Y
   * // const bounds = plotter.getAllDataBounds(); // Gets linear data bounds
   * // if (bounds) plotter.transformToLogSpace(bounds); // Converts to log space
   * ```
   */
  public autoScale(): DataBounds | null {
    if (this.internalPlotter) {
      return this.internalPlotter.autoScale();
    }
    return null;
  }

  public getLineConfig(
    lineId: number
  ): Partial<LineConfig> | LineConfig | undefined {
    if (this.internalPlotter) {
      return this.internalPlotter.getLineConfig(lineId);
    }
    return undefined;
  }

  /**
   * Get the data bounds of the current coordinate space (viewport) with coordinate space information.
   * This preserves the current zoom/pan when transforming to log space.
   *
   * **ENHANCED**: This method now includes coordinate space information for each axis,
   * eliminating ambiguity about whether bounds are in linear or log space.
   *
   * **Use getDataBounds() when:**
   * - You want to preserve current zoom/pan state
   * - You need to know the coordinate space of the returned bounds
   * - Followed by transformToLogSpace() which automatically handles coordinate conversion
   *
   * @returns Object with minX, maxX, minY, maxY of the current view and coordinateSpace info, or null if no valid data
   *
   * @example
   * ```typescript
   * // Enhanced API automatically handles coordinate spaces
   * const bounds = plotter.getDataBounds(); // Returns bounds with coordinate space info
   * if (bounds) {
   *   console.log(`X axis in ${bounds.coordinateSpace.x} space, Y axis in ${bounds.coordinateSpace.y} space`);
   *   plotter.transformToLogSpace(bounds); // Automatically converts coordinate spaces as needed
   * }
   *
   * // Works seamlessly in any coordinate mode - no manual conversion needed!
   * ```
   */
  public getDataBounds(): DataBounds | null {
    if (!this.internalPlotter) {
      return null;
    }
    return this.internalPlotter.getDataBounds();
  }

  /**
   * Get the data bounds of all enabled lines (for autoscaling purposes) with coordinate space information.
   * This returns the complete extent of all data and should be used with autoScale().
   * For preserving current coordinate space, use getDataBounds() instead.
   * 
   * @returns Object with minX, maxX, minY, maxY of all the data and coordinateSpace info, or null if no valid data
   */
  public getAllDataBounds(): DataBounds | null {
    if (!this.internalPlotter) {
      return null;
    }
    return this.internalPlotter.getAllDataBounds();
  }

  /**
   * Enable or disable logarithmic scaling for X and/or Y axes.
   *
   * **After calling setLogAxis(), you need to apply appropriate scaling:**
   * 
   * **For view preservation (recommended):**
   * 1. Get current bounds: `const bounds = plotter.getDataBounds()`
   * 2. Convert to linear space if needed: `transformBoundsToLinearSpace(bounds, oldLogX, oldLogY)`
   * 3. Apply new coordinate space: `transformToLogSpace(linearBounds)` or linear transform
   * 
   * **For simple auto-scaling:**
   * - **Enabling log axes**: Use `getAllDataBounds()` → `transformToLogSpace()`
   * - **Disabling log axes**: Use `autoScale()` (resets to linear)
   *
   * @param x Enable logarithmic base-10 scaling for X-axis
   * @param y Enable logarithmic base-10 scaling for Y-axis
   *
   * @example
   * ```typescript
   * // View preservation when toggling axes
   * const currentBounds = plotter.getDataBounds(); // Current coordinate space
   * const linearBounds = transformBoundsToLinearSpace(currentBounds, wasLogX, wasLogY);
   * plotter.setLogAxis(true, false); // Toggle to log X
   * plotter.transformToLogSpace(linearBounds); // Preserve view
   *
   * // Simple auto-scaling approach
   * plotter.setLogAxis(false, true); // Enable log Y
   * const bounds = plotter.getAllDataBounds();
   * if (bounds) plotter.transformToLogSpace(bounds);
   * ```
   */
  public setLogAxis(x: boolean, y: boolean): void {
    if (this.internalPlotter) {
      this.internalPlotter.setLogAxis(x, y);
    }
  }

  /**
   * Transform data bounds to logarithmic space and apply appropriate scaling.
   *
   * **ENHANCED**: This method now automatically handles coordinate space conversion.
   * It detects the coordinate space of input bounds and converts as needed.
   *
   * **Typical usage patterns:**
   * - **Any coordinate mode**: getDataBounds() → transformToLogSpace() (always works!)
   * - **Initial setup**: getAllDataBounds() → transformToLogSpace()
   * - **Zoom/pan operations**: getDataBounds() → transformToLogSpace()
   *
   * @param dataBounds Optional data bounds with coordinate space information.
   *                   If not provided, will attempt to get bounds from internal plotter.
   * @returns True if log space transformation was applied successfully,
   *          false if transformation not feasible (e.g., no positive data for log axes)
   *
   * @example
   * ```typescript
   * // Works seamlessly in any coordinate mode
   * plotter.setLogAxis(false, true); // Enable log Y
   * const bounds = plotter.getDataBounds(); // Gets bounds with coordinate space info
   * const success = plotter.transformToLogSpace(bounds); // Automatically handles conversion
   * if (!success) console.log("Failed to transform - check for positive data");
   *
   * // Even works when switching between coordinate spaces
   * // (bounds might be in log space, but transformToLogSpace handles this automatically)
   * const currentBounds = plotter.getDataBounds(); 
   * plotter.transformToLogSpace(currentBounds); // Always works correctly!
   * ```
   */
  public transformToLogSpace(dataBounds?: DataBounds | null): boolean {
    if (this.internalPlotter) {
      return this.internalPlotter.transformToLogSpace(dataBounds);
    }
    return false;
  }

  /**
   * Transform data bounds to linear space and apply appropriate scaling.
   *
   * **ENHANCED**: This method automatically handles coordinate space conversion.
   * It detects the coordinate space of input bounds and converts as needed.
   *
   * **Typical usage patterns:**
   * - **Switching to linear axes**: `getDataBounds()` → `transformToLinearSpace()` (preserves view)
   * - **Zoom/pan in linear space**: `getDataBounds()` → `transformToLinearSpace()`
   * - **Initial linear setup**: `getAllDataBounds()` → `transformToLinearSpace()`
   *
   * @param dataBounds Optional data bounds with coordinate space information.
   *                   If not provided, will attempt to get bounds from internal plotter.
   * @returns True if linear space transformation was applied successfully,
   *          false if transformation not feasible
   *
   * @example
   * ```typescript
   * // Switching from log to linear axes while preserving view
   * const bounds = plotter.getDataBounds(); // Gets bounds with coordinate space info
   * plotter.setLogAxis(false, false); // Switch to linear axes
   * const success = plotter.transformToLinearSpace(bounds); // Preserves current view
   * 
   * // Works seamlessly from any coordinate mode
   * const currentBounds = plotter.getDataBounds(); 
   * plotter.transformToLinearSpace(currentBounds); // Always handles conversion correctly!
   * ```
   */
  public transformToLinearSpace(dataBounds?: DataBounds | null): boolean {
    if (this.internalPlotter) {
      return this.internalPlotter.transformToLinearSpace(dataBounds);
    }
    return false;
  }

  /**
   * Gets the type of the currently active internal plotter.
   * @returns A string indicating the type of the internal plotter:
   * 'WebglLinePlot', 'WebglLineThick', or 'null'.
   */
  public getInternalPlotterType(): "WebglLinePlot" | "WebglLineThick" | "null" {
    if (this.internalPlotter instanceof WebglLinePlot) {
      return "WebglLinePlot";
    }
    if (this.internalPlotter instanceof WebglLineThick) {
      return "WebglLineThick";
    }
    return "null";
  }

  /**
   * Get the current global transform scale values.
   * @returns [scaleX, scaleY] array or [1, 1] if no plotter is initialized
   */
  public getGlobalScale(): [number, number] {
    if (this.internalPlotter) {
      return this.internalPlotter.getGlobalScale();
    }
    return [1, 1];
  }

  /**
   * Get the current global transform offset values.
   * @returns [offsetX, offsetY] array or [0, 0] if no plotter is initialized
   */
  public getGlobalOffset(): [number, number] {
    if (this.internalPlotter) {
      return this.internalPlotter.getGlobalOffset();
    }
    return [0, 0];
  }
}
