import type { ColorRGBA } from "./ColorRGBA";
import { WebglBase } from "./WebglBase";
/**
 * The step based line plot
 */
export declare class WebglStep extends WebglBase {
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
//# sourceMappingURL=WbglStep.d.ts.map