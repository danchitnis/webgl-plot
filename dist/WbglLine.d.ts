import { WebglBase } from "./WebglBase";
/**
 * The standard Line class
 */
export declare class WebglLine extends WebglBase {
    private currentIndex;
    private color;
    private xy;
    private numPoints;
    private webglNumPoints;
    private gl;
    private coord;
    private vbuffer;
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
    constructor(gl: WebGL2RenderingContext);
    draw(): void;
}
//# sourceMappingURL=WbglLine.d.ts.map