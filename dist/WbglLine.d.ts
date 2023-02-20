import type { WebglPlot } from "./webglplot";
export declare class WebglLine {
    private wglp;
    private gl;
    private coord;
    private vertexBuffer;
    prog: WebGLProgram;
    lineSizes: number[];
    private totalLineSizes;
    private lineSizeAccum;
    private indexData;
    constructor(wglp: WebglPlot, lineSizes: number[]);
    setXYbuffer: (xy: number[], index: number) => void;
    draw: () => void;
}
//# sourceMappingURL=WbglLine.d.ts.map