import type { ColorRGBA } from "./ColorRGBA";
import { WebglBase } from "./WebglBase";
/**
 * The standard Line class
 */
export declare class WebglLine extends WebglBase {
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
//# sourceMappingURL=WbglLine.d.ts.map