declare class ColorRGBA {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b: number, a: number);
}

type Line = {
    xy: number[];
    color: ColorRGBA;
};
/**
 * The standard Line class
 */
declare class WebglAux {
    private wglp;
    private lines;
    private color;
    private gl;
    private coord;
    private vbuffer;
    prog: WebGLProgram;
    constructor(wglp: WebglPlot);
    addLine(line: Line): void;
    drawLines(): void;
}

/**
 * The standard Line class
 */
declare class WebglScatterAcc {
    private wglp;
    private headIndex;
    private color;
    private squareSize;
    private maxSquare;
    private gl;
    private squareIndices;
    private colorsBuffer;
    private positionBuffer;
    prog: WebGLProgram;
    private attrPosLocation;
    private attrColorLocation;
    constructor(wglp: WebglPlot, maxSquare: number);
    setColor(color: ColorRGBA): void;
    setSquareSize(squareSize: number): void;
    setScale(scaleX: number, scaleY: number): void;
    setOffset(offsetX: number, offsetY: number): void;
    addSquare(pos: Float32Array, color: Uint8Array): void;
    draw(): void;
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

export { ColorRGBA, WebglAux, WebglPlot, WebglScatterAcc };
