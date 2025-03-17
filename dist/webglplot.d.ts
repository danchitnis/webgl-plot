export declare class ColorRGBA {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b: number, a: number);
    toArray(): number[];
}

/**
 * The standard Line class
 */
export declare class WebglAux {
    private wglp;
    private lines;
    private gl;
    private coord;
    private vbuffer;
    prog: WebGLProgram;
    constructor(wglp: WebglPlot);
    addLine(line: WebglLine): void;
    draw(): void;
}

export declare class WebglLine {
    xy: number[];
    color: ColorRGBA;
    constructor(xy?: number[], color?: ColorRGBA);
    getSize(): number;
    setY(y: number): void;
    setYs(ys: number[]): void;
    setXYArray(xy: number[]): void;
    setX(x: number): void;
    lineSpaceX(lineSize: number): void;
    emptyLine(lineSize: number): void;
    setColor(color: ColorRGBA): void;
}

export declare class WebglLinePlot {
    private lines;
    private gl;
    private coord;
    private vertexBuffer;
    prog: WebGLProgram;
    lineSizes: number[];
    private totalLineSizes;
    private lineSizeAccum;
    constructor(wglp: WebglPlot, lines: WebglLine[]);
    updateLine: (lineIndex: number) => void;
    draw: () => void;
}

export declare class WebglLineRoll {
    private gl;
    private aPositionLocation;
    private vertexBuffer;
    program: WebGLProgram;
    rollBufferSize: number;
    private shift;
    private dataIndex;
    private dataX;
    private lastDataX;
    private lastDataY;
    numLines: number;
    private ext;
    private colorBuffer;
    private aColorLocation;
    private uShiftLocation;
    constructor(wglp: WebglPlot, rollBufferSize: number, numLines: number);
    addPoint(ys: number[]): void;
    addPoints(ys: number[][]): void;
    private drawOld;
    private drawExt;
    draw(): void;
    setLineColor(colors: ColorRGBA, lineIndex: number): void;
}

export declare class WebglLineThick {
    private gl;
    prog: WebGLProgram;
    private width;
    private height;
    private thickness;
    private offset;
    private pointsTexture;
    private vao;
    private vertexBuffer;
    private numPoints;
    private locations;
    constructor(wglp: {
        gl: WebGL2RenderingContext;
        width: number;
        height: number;
    }, thickness: number);
    updateLine(points: Float32Array): void;
    draw(): void;
    setOffset(x: number, y: number): void;
}

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

declare type WebglPlotConfig = {
    antialias?: boolean;
    transparent?: boolean;
    powerPerformance?: "default" | "high-performance" | "low-power";
    deSync?: boolean;
    preserveDrawing?: boolean;
    debug?: boolean;
};

/**
 * The standard Line class
 */
export declare class WebglScatterAcc {
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

export { }
