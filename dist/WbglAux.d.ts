import type { ColorRGBA } from "./ColorRGBA";
import type { WebglPlot } from "./webglplot";
export declare class WebglAuxLine {
    xy: number[];
    color: ColorRGBA;
    constructor(xy: number[], color: ColorRGBA);
}
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
    addLine(line: WebglAuxLine): void;
    draw(): void;
}
//# sourceMappingURL=WbglAux.d.ts.map