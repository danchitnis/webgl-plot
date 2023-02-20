import type { WebglPlot } from "./webglplot";
import type { WebglLine } from "./WbglLine";
/**
 * The standard Line class
 */
export declare class WebglAux {
    private wglp;
    private lines;
    private color;
    private gl;
    private coord;
    private vbuffer;
    prog: WebGLProgram;
    constructor(wglp: WebglPlot);
    addLine(line: WebglLine): void;
    draw(): void;
}
//# sourceMappingURL=WbglAux.d.ts.map