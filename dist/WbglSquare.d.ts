import type { ColorRGBA } from "./ColorRGBA";
import { WebglBase } from "./WebglBase";
/**
 * The Square class
 */
export declare class WebglSquare extends WebglBase {
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
//# sourceMappingURL=WbglSquare.d.ts.map