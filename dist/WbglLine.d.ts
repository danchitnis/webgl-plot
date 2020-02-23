import { ColorRGBA } from "./ColorRGBA";
import { WebglBaseLine } from "./WebglBaseLine";
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
//# sourceMappingURL=WbglLine.d.ts.map