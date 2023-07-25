import type { WebglLine, WebglPlot } from "./webglplot";
export declare class WebglLinePlot {
    private wglp;
    private lines;
    private gl;
    private coord;
    private vertexBuffer;
    prog: WebGLProgram;
    lineSizes: number[];
    private totalLineSizes;
    private lineSizeAccum;
    constructor(wglp: WebglPlot, lines: WebglLine[]);
    updateLine: (lineIndex: number) => void;
    draw: () => void;
}
//# sourceMappingURL=WbglLinePlot.d.ts.map