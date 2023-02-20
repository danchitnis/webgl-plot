import type { WebglPlot } from "./webglplot";
export declare class WebglLineRoll {
    private wglp;
    private color;
    private gl;
    private coord;
    private vbuffer;
    prog: WebGLProgram;
    rollBufferSize: number;
    private shift;
    private dataIndex;
    private dataX;
    private lastDataX;
    private lastDataY;
    private colorLocation;
    constructor(wglp: WebglPlot, bufferSize: number);
    addPoint(y: number): void;
    draw(): void;
}
//# sourceMappingURL=WbglLineRoll.d.ts.map