import { WebglBaseLine } from "./WebglBaseLine";
/**
 * The standard Line class
 */
export class WebglSquare extends WebglBaseLine {
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
    constructor(c) {
        super();
        this.webglNumPoints = 4;
        this.numPoints = 4;
        this.color = c;
        this.xy = new Float32Array(2 * this.webglNumPoints);
    }
    setSquare(points) {
        if (points.length == 8)
            this.xy = new Float32Array(points);
    }
}
//# sourceMappingURL=WbglSquare.js.map