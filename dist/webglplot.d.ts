/**
 * Author Danial Chitnis 2019-20
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */
import { ColorRGBA } from "./ColorRGBA";
import { WebglLine } from "./WbglLine";
import { WebglStep } from "./WbglStep";
import { WebglPolar } from "./WbglPolar";
import { WebglSquare } from "./WbglSquare";
import type { WebglBase } from "./WebglBase";
import { WebglThickLine } from "./WbglThickLine";
export { WebglLine, ColorRGBA, WebglStep, WebglPolar, WebglSquare, WebglThickLine };
declare type WebglPlotConfig = {
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
    private readonly webgl;
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
     * Global log10 of x-axis
     * @default = false
     */
    gLog10X: boolean;
    /**
     * Global log10 of y-axis
     * @default = false
     */
    gLog10Y: boolean;
    /**
     * collection of data lines in the plot
     */
    private _linesData;
    /**
     * collection of auxiliary lines (grids, markers, etc) in the plot
     */
    private _linesAux;
    private _thickLines;
    private _surfaces;
    get linesData(): WebglBase[];
    get linesAux(): WebglBase[];
    get thickLines(): WebglThickLine[];
    get surfaces(): WebglSquare[];
    private _progLine;
    /**
     * log debug output
     */
    debug: boolean;
    /**
     * Create a webgl-plot instance
     * @param canvas - the canvas in which the plot appears
     * @param debug - (Optional) log debug messages to console
     *
     * @example
     *
     * For HTMLCanvas
     * ```typescript
     * const canvas = document.getElementbyId("canvas");
     *
     * const devicePixelRatio = window.devicePixelRatio || 1;
     * canvas.width = canvas.clientWidth * devicePixelRatio;
     * canvas.height = canvas.clientHeight * devicePixelRatio;
     *
     * const webglp = new WebGLplot(canvas);
     * ...
     * ```
     * @example
     *
     * For OffScreenCanvas
     * ```typescript
     * const offscreen = htmlCanvas.transferControlToOffscreen();
     *
     * offscreen.width = htmlCanvas.clientWidth * window.devicePixelRatio;
     * offscreen.height = htmlCanvas.clientHeight * window.devicePixelRatio;
     *
     * const worker = new Worker("offScreenCanvas.js", { type: "module" });
     * worker.postMessage({ canvas: offscreen }, [offscreen]);
     * ```
     * Then in offScreenCanvas.js
     * ```typescript
     * onmessage = function (evt) {
     * const wglp = new WebGLplot(evt.data.canvas);
     * ...
     * }
     * ```
     */
    constructor(canvas: HTMLCanvasElement, options?: WebglPlotConfig);
    /**
     * updates and redraws the content of the plot
     */
    private _drawLines;
    private _drawSurfaces;
    private _drawTriangles;
    private _drawThickLines;
    /**
     * Draw and clear the canvas
     */
    update(): void;
    /**
     * Draw without clearing the canvas
     */
    draw(): void;
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
    private _addLine;
    addDataLine(line: WebglLine | WebglStep | WebglPolar): void;
    addLine: (line: WebglLine | WebglStep | WebglPolar) => void;
    addAuxLine(line: WebglLine | WebglStep | WebglPolar): void;
    addThickLine(thickLine: WebglThickLine): void;
    addSurface(surface: WebglSquare): void;
    private initThinLineProgram;
    /**
     * remove the last data line
     */
    popDataLine(): void;
    /**
     * remove all the lines
     */
    removeAllLines(): void;
    /**
     * remove all data lines
     */
    removeDataLines(): void;
    /**
     * remove all auxiliary lines
     */
    removeAuxLines(): void;
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