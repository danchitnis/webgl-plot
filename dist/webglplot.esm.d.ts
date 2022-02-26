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
    intensity: number;
    visible: boolean;
    /**
     * The number of data point pairs in the line
     */
    numPoints: number;
    /**
     * The data ponits for webgl array
     * @internal
     */
    xy: Float32Array;
    /**
     * The Color of the line
     */
    color: ColorRGBA;
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
     * if this is a close loop line or not
     * @default = false
     */
    loop: boolean;
    /**
     * total webgl number of points
     * @internal
     */
    webglNumPoints: number;
    /**
     * @private
     * @internal
     */
    _vbuffer: WebGLBuffer;
    /**
     * @private
     * @internal
     */
    /**
     * @private
     * @internal
     */
    _coord: number;
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
    constructor(c: ColorRGBA, numPoints: number);
    /**
     * Set the X value at a specific index
     * @param index - the index of the data point
     * @param x - the horizontal value of the data point
     */
    setX(index: number, x: number): void;
    /**
     * Set the Y value at a specific index
     * @param index : the index of the data point
     * @param y : the vertical value of the data point
     */
    setY(index: number, y: number): void;
    /**
     * Get an X value at a specific index
     * @param index - the index of X
     */
    getX(index: number): number;
    /**
     * Get an Y value at a specific index
     * @param index - the index of Y
     */
    getY(index: number): number;
    /**
     * Make an equally spaced array of X points
     * @param start  - the start of the series
     * @param stepSize - step size between each data point
     *
     * @example
     * ```typescript
     * //x = [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8]
     * const numX = 10;
     * line.lineSpaceX(-1, 2 / numX);
     * ```
     */
    lineSpaceX(start: number, stepSize: number): void;
    /**
     * Automatically generate X between -1 and 1
     * equal to lineSpaceX(-1, 2/ number of points)
     */
    arrangeX(): void;
    /**
     * Set a constant value for all Y values in the line
     * @param c - constant value
     */
    constY(c: number): void;
    /**
     * Add a new Y values to the end of current array and shift it, so that the total number of the pair remains the same
     * @param data - the Y array
     *
     * @example
     * ```typescript
     * yArray = new Float32Array([3, 4, 5]);
     * line.shiftAdd(yArray);
     * ```
     */
    shiftAdd(data: Float32Array): void;
    /**
     * Add new Y values to the line and maintain the position of the last data point
     */
    addArrayY(yArray: number[]): void;
    /**
     * Replace the all Y values of the line
     */
    replaceArrayY(yArray: number[]): void;
}

/**
 * The step based line plot
 */
declare class WebglStep extends WebglBase {
    /**
     * Create a new step line
     * @param c - the color of the line
     * @param numPoints - number of data pints
     * @example
     * ```typescript
     * x= [0,1]
     * y= [1,2]
     * line = new WebglStep( new ColorRGBA(0.1,0.1,0.1,1), 2);
     * ```
     */
    constructor(c: ColorRGBA, num: number);
    /**
     * Set the Y value at a specific index
     * @param index - the index of the data point
     * @param y - the vertical value of the data point
     */
    setY(index: number, y: number): void;
    getX(index: number): number;
    /**
     * Get an X value at a specific index
     * @param index - the index of X
     */
    getY(index: number): number;
    /**
     * Make an equally spaced array of X points
     * @param start  - the start of the series
     * @param stepSize - step size between each data point
     *
     * @example
     * ```typescript
     * //x = [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8]
     * const numX = 10;
     * line.lineSpaceX(-1, 2 / numX);
     * ```
     */
    lineSpaceX(start: number, stepsize: number): void;
    /**
     * Set a constant value for all Y values in the line
     * @param c - constant value
     */
    constY(c: number): void;
    /**
     * Add a new Y values to the end of current array and shift it, so that the total number of the pair remains the same
     * @param data - the Y array
     *
     * @example
     * ```typescript
     * yArray = new Float32Array([3, 4, 5]);
     * line.shiftAdd(yArray);
     * ```
     */
    shiftAdd(data: Float32Array): void;
}

declare class WebglPolar extends WebglBase {
    numPoints: number;
    xy: Float32Array;
    color: ColorRGBA;
    intenisty: number;
    visible: boolean;
    offsetTheta: number;
    constructor(c: ColorRGBA, numPoints: number);
    /**
     * @param index: index of the line
     * @param theta : angle in deg
     * @param r : radius
     */
    setRtheta(index: number, theta: number, r: number): void;
    getTheta(index: number): number;
    getR(index: number): number;
    private setX;
    private setY;
    getX(index: number): number;
    getY(index: number): number;
}

/**
 * The Square class
 */
declare class WebglSquare extends WebglBase {
    /**
     * Create a new line
     * @param c - the color of the line
     * @example
     * ```typescript
     * line = new WebglSquare( new ColorRGBA(0.1,0.1,0.1,0.5) );
     * ```
     */
    constructor(c: ColorRGBA);
    /**
     * draw a square
     * @param x1 start x
     * @param y1 start y
     * @param x2 end x
     * @param y2 end y
     */
    setSquare(x1: number, y1: number, x2: number, y2: number): void;
}

/**
 * The standard Line class
 */
declare class WebglThickLine extends WebglBase {
    private currentIndex;
    private _linePoints;
    private _thicknessRequested;
    private _actualThickness;
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
    constructor(c: ColorRGBA, numPoints: number, thickness: number);
    convertToTriPoints(): void;
    /**
     * Set the X value at a specific index
     * @param index - the index of the data point
     * @param x - the horizontal value of the data point
     */
    setX(index: number, x: number): void;
    /**
     * Set the Y value at a specific index
     * @param index : the index of the data point
     * @param y : the vertical value of the data point
     */
    setY(index: number, y: number): void;
    /**
     * Make an equally spaced array of X points
     * @param start  - the start of the series
     * @param stepSize - step size between each data point
     *
     * @example
     * ```typescript
     * //x = [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8]
     * const numX = 10;
     * line.lineSpaceX(-1, 2 / numX);
     * ```
     */
    lineSpaceX(start: number, stepSize: number): void;
    setThickness(thickness: number): void;
    getThickness(): number;
    setActualThickness(thickness: number): void;
}

/**
 * Author Danial Chitnis 2019-20
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */

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

export { ColorRGBA, WebglLine, WebglPlot, WebglPolar, WebglSquare, WebglStep, WebglThickLine };
