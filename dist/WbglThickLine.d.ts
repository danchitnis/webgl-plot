import type { ColorRGBA } from "./ColorRGBA";
import { WebglBase } from "./WebglBase";
/**
 * The standard Line class
 */
export declare class WebglThickLine extends WebglBase {
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
//# sourceMappingURL=WbglThickLine.d.ts.map