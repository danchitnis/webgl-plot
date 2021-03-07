import type { ColorRGBA } from "./ColorRGBA";
import { WebglBaseLine } from "./WebglBaseLine";
/**
 * The standard Line class
 */
export declare class WebglSquare extends WebglBaseLine {
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
    constructor(c: ColorRGBA);
    setSquare(points: number[]): void;
}
//# sourceMappingURL=WbgSquare.d.ts.map