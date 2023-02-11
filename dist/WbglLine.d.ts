import type { WebglPlot } from "./webglplot";
/**
 * The standard Line class
 */
export declare class WebglLine {
    private color;
    private xy;
    private gl;
    private coord;
    private vbuffer;
    prog: WebGLProgram;
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
    constructor(wglp: WebglPlot);
    draw(): void;
}
//# sourceMappingURL=WbglLine.d.ts.map