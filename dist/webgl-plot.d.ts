
export declare class ColorRGBA {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b: number, a: number);
}

declare class WebglBaseLine {
    vbuffer: WebGLBuffer;
    prog: WebGLProgram;
    webglNumPoints: number;
    intensity: number;
    visible: boolean;
    coord: number;
    numPoints: number;
    xy: Float32Array;
    color: ColorRGBA;
    scaleX: number;
    scaleY: number;
    offsetX: number;
    offsetY: number;
    loop: boolean;
    constructor();
}

export declare class WebglLine extends WebglBaseLine {
    /**
     * Create a new line
     * @param c :the color of the line
     * @param numPoints : number of data pints
     * @example
     * ```
     * x= [0,1]
     * y= [1,2]
     * line = new WebglLine( new ColorRGBA(0.1,0.1,0.1,1), 2);
     */
    constructor(c: ColorRGBA, numPoints: number);
    /**
     *
     * @param index : the index of the data point
     * @param x : the horizontal value of the data point
     */
    setX(index: number, x: number): void;
    /**
     *
     * @param index : the index of the data point
     * @param y : the vertical value of the data point
     */
    setY(index: number, y: number): void;
    getX(index: number): number;
    getY(index: number): number;
    linespaceX(start: number, stepsize: number): void;
    constY(c: number): void;
    shiftAdd(data: Float32Array): void;
}

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

export declare class WebglPolar extends WebglBaseLine {
    numPoints: number;
    xy: Float32Array;
    color: ColorRGBA;
    intenisty: number;
    visible: boolean;
    coord: number;
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

export declare class WebglStep extends WebglBaseLine {
    constructor(c: ColorRGBA, num: number);
    setY(index: number, y: number): void;
    getX(index: number): number;
    getY(index: number): number;
    linespaceX(start: number, stepsize: number): void;
    constY(c: number): void;
    shiftAdd(data: Float32Array): void;
}

export { }
