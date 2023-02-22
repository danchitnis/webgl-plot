import type { ColorRGBA } from "./ColorRGBA";
import type { WebglPlot } from "./webglplot";
export declare class WebglLineRoll {
    private gl;
    private aPosition;
    private vertexBuffer;
    program: WebGLProgram;
    rollBufferSize: number;
    private shift;
    private dataIndex;
    private dataX;
    private lastDataX;
    private lastDataY;
    private colorLocation;
    numLines: number;
    private colors;
    constructor(wglp: WebglPlot, rollBufferSize: number, numLines: number);
    addPoint(ys: number[]): void;
    draw(): void;
    setColors(colors: ColorRGBA[]): void;
}
//# sourceMappingURL=WbglLineRoll.d.ts.map