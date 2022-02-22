import { WebglBase } from "./WebglBase";
/**
 * The Square class
 */
export class WebglSquare extends WebglBase {
    /**
     * Create a new line
     * @param c - the color of the line
     * @example
     * ```typescript
     * line = new WebglSquare( new ColorRGBA(0.1,0.1,0.1,0.5) );
     * ```
     */
    constructor(c) {
        super();
        this.webglNumPoints = 4;
        this.numPoints = 4;
        this.color = c;
        this.xy = new Float32Array(2 * this.webglNumPoints);
    }
    /**
     * draw a square
     * @param x1 start x
     * @param y1 start y
     * @param x2 end x
     * @param y2 end y
     */
    setSquare(x1, y1, x2, y2) {
        this.xy = new Float32Array([x1, y1, x1, y2, x2, y1, x2, y2]);
    }
}
//# sourceMappingURL=WbglSquare.js.map