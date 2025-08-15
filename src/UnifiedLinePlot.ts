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

  public setGlobalTransform(
    scale: [number, number],
    offset: [number, number]
  ): void {
    if (this.internalPlotter) {
      this.internalPlotter.setGlobalTransform(scale, offset);
    }
  }

  /**
   * Auto-scale to fit all enabled lines and apply linear space.
   *
   * **IMPORTANT**: This method resets to linear coordinate space before calculating bounds.
   * Choose the right method based on your current coordinate system:
   *
   * **Use autoScale() when:**
   * - Scaling linear spaces
   * - Switching from log back to linear space
   *
   *
   * @returns DataBounds object with calculated bounds, null if no valid data, or void for some internal plotters
   *
   */
  public autoScale(): DataBounds | null | void {
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
   * Get the data bounds of all enabled lines without changing current coordinate space.
   *
   * **IMPORTANT**: This method preserves your current coordinate space (linear or log).
   * Choose the right method based on your current coordinate system:
   *
   * **Use getDataBounds() when:**
   * - Data changes and you're already in log coordinate space
   * - You want bounds without changing current coordinate transformation
   * - Followed by transformToLogSpace() to rescale in log coordinate space
   *
   *
   * @returns Object with minX, maxX, minY, maxY of the actual data, or null if no valid data
   *
   * @example
   * ```typescript
   * // Data update when already in log coordinate space - PRESERVES current coordinate system
   * const bounds = plotter.getDataBounds(); // No coordinate transformation change
   * if (bounds) plotter.transformToLogSpace(bounds); // Stay in log coordinate space
   *
   * // Compare with autoScale() which would cause visual jumps:
   * // plotter.autoScale(); // ❌ Resets to linear coordinate space first - causes jumps!
   * ```
   */
  public getDataBounds(): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null {
    if (!this.internalPlotter) {
      return null;
    }
    return this.internalPlotter.getDataBounds();
  }

  /**
   * Enable or disable logarithmic scaling for X and/or Y axes.
   *
   * **After calling setLogAxis(), you typically need to rescale:**
   * - **Enabling log axes**: Use getDataBounds() → transformToLogSpace()
   * - **Disabling log axes**: Use autoScale() (resets to linear)
   *
   * @param x Enable logarithmic base-10 scaling for X-axis
   * @param y Enable logarithmic base-10 scaling for Y-axis
   *
   * @example
   * ```typescript
   * // Enabling log Y axis
   * plotter.setLogAxis(false, true);
   * const bounds = plotter.getDataBounds(); // Get bounds with smart filtering
   * if (bounds) plotter.transformToLogSpace(bounds);
   *
   * // Disabling log axes (back to linear)
   * plotter.setLogAxis(false, false);
   * plotter.autoScale(); // Resets to linear - perfect!
   *
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
   * **IMPORTANT**: Only call this when log axes are enabled via setLogAxis().
   * This method should be paired with bounds from the correct source:
   *
   * **Typical usage patterns:**
   * - **Initial setup**: getDataBounds() → transformToLogSpace()
   * - **Data updates in log space**: getDataBounds() → transformToLogSpace()
   * - **Switching to linear**: Don't call this - use autoScale() only
   *
   * @param dataBounds Optional data bounds {minX, maxX, minY, maxY}.
   *                   If not provided, will attempt to get bounds from internal plotter.
   * @returns True if log space transformation was applied successfully,
   *          false if transformation not feasible (e.g., no positive data for log axes)
   *
   * @example
   * ```typescript
   * // Initial setup with log Y axis
   * plotter.setLogAxis(false, true);
   * const bounds = plotter.getDataBounds(); // Preserve current coordinate space
   * const success = plotter.transformToLogSpace(bounds); // Transform to log coordinate space
   * if (!success) console.log("Failed to transform to log coordinate space - check for positive data");
   *
   * // Data update when already in log coordinate space
   * const bounds = plotter.getDataBounds(); // Preserve current coordinate space
   * if (bounds) plotter.transformToLogSpace(bounds); // Rescale in log coordinate space
   *
   * // Without explicit bounds (uses internal bounds)
   * plotter.transformToLogSpace(); // Uses internal plotter's bounds
   * ```
   */
  public transformToLogSpace(dataBounds?: DataBounds | null): boolean {
    if (this.internalPlotter) {
      return this.internalPlotter.transformToLogSpace(dataBounds);
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
}
