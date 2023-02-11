/**
 * Author Danial Chitnis 2019-20
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */
import { ColorRGBA } from "./ColorRGBA";
import { WebglAux } from "./WbglAux";
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
export declare class WebglPlot {
    /**
     * @private
     */
    readonly gl: WebGL2RenderingContext;
    /**
     * Global horizontal scale factor
     * @default = 1.0
     */
    gScaleX: number;
    /**
     * Global vertical scale factor
     * @default = 1.0
     */
    gScaleY: number;
    /**
     * Global X/Y scale ratio
     * @default = 1
     */
    gXYratio: number;
    /**
     * Global horizontal offset
     * @default = 0
     */
    gOffsetX: number;
    /**
     * Global vertical offset
     * @default = 0
     */
    gOffsetY: number;
    /**
     * log debug output
     */
    debug: boolean;
    constructor(canvas: HTMLCanvasElement, options?: WebglPlotConfig);
    /**
     * updates and redraws the content of the plot
     */
    private _drawLines;
    /**
     * Draw and clear the canvas
     */
    update(): void;
    /**
     * Draw without clearing the canvas
     */
    /**
     * Clear the canvas
     */
    clear(): void;
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
    viewport(a: number, b: number, c: number, d: number): void;
    private log;
}
//# sourceMappingURL=webglplot.d.ts.map