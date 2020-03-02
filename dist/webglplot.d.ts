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
export declare class WebGLplot {
    /**
     * @private
     */
    private webgl;
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
     * collection of lines in the plot
     */
    lines: WebglBaseLine[];
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
    constructor(canv: HTMLCanvasElement);
    /**
     * updates and redraws the content of the plot
     */
    update(): void;
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
    addLine(line: WebglBaseLine): void;
    /**
     * Change the WbGL viewport
     * @param a
     * @param b
     * @param c
     * @param d
     */
    viewport(a: number, b: number, c: number, d: number): void;
}
//# sourceMappingURL=webglplot.d.ts.map