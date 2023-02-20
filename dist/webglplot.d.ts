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
export { WebglAux, ColorRGBA, WebglScatterAcc, WebglLine, WebglLineRoll, WebglLinePlot };
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
    width: number;
    height: number;
    devicePixelRatio: number;
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
     * Draw and clear the canvas
     */
    update(): void;
    /**
     * Clear the canvas
     */
    clear(): void;
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