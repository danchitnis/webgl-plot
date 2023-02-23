import type { ColorRGBA } from "./ColorRGBA";
import type { WebglPlot } from "./webglplot";
export declare class WebglLineRoll {
    private gl;
    private aPositionLocation;
    private vertexBuffer;
    program: WebGLProgram;
    rollBufferSize: number;
    private shift;
    private dataIndex;
    private dataX;
    private lastDataX;
    private lastDataY;
    numLines: number;
    private ext;
    private colorBuffer;
    private aColorLocation;
    constructor(wglp: WebglPlot, rollBufferSize: number, numLines: number);
    addPoint(ys: number[]): void;
    private drawOld;
    private drawExt;
    draw(): void;
    setLineColor(colors: ColorRGBA, lineIndex: number): void;
}
//# sourceMappingURL=WbglLineRoll.d.ts.map