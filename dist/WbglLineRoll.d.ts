import type { WebglPlot } from "./webglplot";
export declare class WebglLineRoll {
    private wglp;
    private color;
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
    constructor(wglp: WebglPlot, rollBufferSize: number);
    addPoint(y: number): void;
    draw(): void;
}
//# sourceMappingURL=WbglLineRoll.d.ts.map