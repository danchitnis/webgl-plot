import type { WebglPlot } from "./webglplot"; // This will be the main class, ok for type
import { WebglLinePlot } from "./WbglLinePlot"; // Corrected import
import { WebglLineThick, DataBounds } from "./WbglLineThick"; // Corrected import
import type { LineConfig } from "./LineConfig";

export class UnifiedLinePlot {
  private wglp: WebglPlot;
  private gl: WebGL2RenderingContext;
  private maxLines: number;
  private internalPlotter: WebglLinePlot | WebglLineThick | null = null;

  constructor(wglp: WebglPlot, maxLines: number) {
    this.wglp = wglp;
    this.gl = wglp.gl;
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
        this.internalPlotter = new WebglLinePlot(this.wglp, this.maxLines);
      }
      // Adjust all line configs for the thin plotter: thicknesses become 1.0
      const thinLinesConfig = linesConfig.map(config => ({
        ...config,
        thickness: 1.0, // All lines will be 1.0 for WebglLinePlot via this unified interface
      }));
      this.internalPlotter.initLines(thinLinesConfig);
    } else { // Use thick plotter
      if (!(this.internalPlotter instanceof WebglLineThick)) {
        if (this.internalPlotter) {
          this.internalPlotter.cleanup();
        }
        // WebglLineThick constructor expects { gl: WebGL2RenderingContext }
        this.internalPlotter = new WebglLineThick({ gl: this.gl }, this.maxLines);
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
      console.warn(
        "updateLinePoints(xy) is not directly supported when WebglLineThick is active. " +
        "Consider re-initializing the line with initLines() for full XY updates, " +
        "or use updateLineY() if only Y values need changing and X values are stable."
      );
    } else {
      console.warn("updateLinePoints: plotter not initialized.");
    }
  }

  public updateLineY(lineId: number, newY: Float32Array): void {
    if (this.internalPlotter) {
      // WebglLinePlot has updateLineY, WebglLineThick has updateLineY
       this.internalPlotter.updateLineY(lineId, newY);
    }
  }

  public updateLineColor(lineId: number, color: [number, number, number, number]): void {
    if (this.internalPlotter) {
        this.internalPlotter.updateLineColor(lineId, color);
    }
  }

  public updateLineTransform(lineId: number, scale: [number, number], offset: [number, number]): void {
    if (this.internalPlotter) {
      // Both WebglLinePlot and WebglLineThick have updateLineTransform
      this.internalPlotter.updateLineTransform(lineId, scale, offset);
    } else {
      console.warn("updateLineTransform: plotter not initialized.");
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
        console.warn("UnifiedLinePlot: WebglLinePlot is active, thickness forced to 1.0.");
    }
  }


  public setLineEnabled(lineId: number, enabled: boolean): void {
    if (this.internalPlotter) {
        this.internalPlotter.setLineEnabled(lineId, enabled);
    }
  }

  public setGlobalTransform(scale: [number, number], offset: [number, number]): void {
    if (this.internalPlotter) {
        this.internalPlotter.setGlobalTransform(scale, offset);
    }
  }

  public autoScaleEnabledLines(): DataBounds | null | void { // void because WebglLinePlot returns void
    if (this.internalPlotter) {
        return this.internalPlotter.autoScaleEnabledLines();
    }
    return null;
  }

  public getLineConfig(lineId: number): Partial<LineConfig> | LineConfig | undefined {
     if (this.internalPlotter) {
        return this.internalPlotter.getLineConfig(lineId);
     }
     return undefined;
  }

  /**
   * Gets the type of the currently active internal plotter.
   * @returns A string indicating the type of the internal plotter:
   * 'WebglLinePlot', 'WebglLineThick', or 'null'.
   */
  public getInternalPlotterType(): 'WebglLinePlot' | 'WebglLineThick' | 'null' {
    if (this.internalPlotter instanceof WebglLinePlot) {
      return 'WebglLinePlot';
    }
    if (this.internalPlotter instanceof WebglLineThick) {
      return 'WebglLineThick';
    }
    return 'null';
  }
}
