declare class ColorRGBA {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b: number, a: number);
}

/**
 * Baseline class
 */
declare abstract class WebglBase {
    visible: boolean;
    /**
     * The horizontal scale of the line
     * @default = 1
     */
    scaleX: number;
    /**
     * The vertical scale of the line
     * @default = 1
     */
    scaleY: number;
    /**
     * The horizontal offset of the line
     * @default = 0
     */
    offsetX: number;
    /**
     * the vertical offset of the line
     * @default = 0
     */
    offsetY: number;
    /**
     * @private
     * @internal
     */
    _prog: WebGLProgram;
    /**
     * @internal
     */
    constructor();
}

/**
 * The standard Line class
 */
declare class WebglLine extends WebglBase {
    private currentIndex;
    private color;
    private xy;
    private numPoints;
    private webglNumPoints;
    private gl;
    private coord;
    private vbuffer;
    /**
     * Create a new line
     * @param c - the color of the line
     * @param numPoints - number of data pints
     * @example
     * ```typescript
     * x= [0,1]
     * y= [1,2]
     * line = new WebglLine( new ColorRGBA(0.1,0.1,0.1,1), 2);
     * ```
     */
    constructor(gl: WebGL2RenderingContext);
    draw(): void;
}

/**
 * The standard Line class
 */
declare class WebglScatterAcc {
    private headIndex;
    private color;
    private squareSize;
    private maxSquare;
    private gl;
    private width;
    private height;
    private squareIndices;
    private colorsBuffer;
    private positionBuffer;
    private _prog;
    private attrPosLocation;
    private attrColorLocation;
    constructor(gl: WebGL2RenderingContext, maxSquare: number);
    setColor(color: ColorRGBA): void;
    setSquareSize(squareSize: number): void;
    setScale(scaleX: number, scaleY: number): void;
    setOffset(offsetX: number, offsetY: number): void;
    addSquare(pos: Float32Array, color: Uint8Array): void;
    update(): void;
}

/**
 * Author Danial Chitnis 2019-20
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */

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
declare class WebglPlot {
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
    removeDataLines(): void;
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

export { ColorRGBA, WebglLine, WebglPlot, WebglScatterAcc };
