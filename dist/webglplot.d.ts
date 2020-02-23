/**
 * Author Danial Chitnis 2019
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */
import { ColorRGBA } from "./ColorRGBA";
import { WebglLine } from "./WbglLine";
import { WebglStep } from "./WbglStep";
import { WebglPolar } from "./WbglPolar";
import { WebglBaseLine } from "./WebglBaseLine";
export { WebglLine, ColorRGBA, WebglStep, WebglPolar };
/**
 * The main class for the webgl-plot framework
 */
export declare class WebGLplot {
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
     * @param canv: the canvas in which the plot appears
     */
    constructor(canv: HTMLCanvasElement);
    /**
     * update and redraws the content
     */
    update(): void;
    clear(): void;
    /**
     * adds a line to the plot
     * @param line : this could be any of line, linestep, histogram, or polar
     */
    addLine(line: WebglBaseLine): void;
    viewport(a: number, b: number, c: number, d: number): void;
}
//# sourceMappingURL=webglplot.d.ts.map