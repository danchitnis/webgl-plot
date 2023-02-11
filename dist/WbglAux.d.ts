import type { ColorRGBA } from "./ColorRGBA";
import type { WebglPlot } from "./webglplot";
type Line = {
    xy: number[];
    color: ColorRGBA;
};
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
    addLine(line: Line): void;
    drawLines(): void;
}
export {};
//# sourceMappingURL=WbglAux.d.ts.map