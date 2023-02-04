import { ColorRGBA } from "./ColorRGBA";
/**
 * The standard Line class
 */
export declare class WebglScatterAcc {
    private headIndex;
    private color;
    private squareSize;
    private maxSquare;
    private gl;
    private program;
    private width;
    private height;
    private squareIndices;
    constructor(canvas: HTMLCanvasElement, maxSquare: number);
    setColor(color: ColorRGBA): void;
    setSquareSize(squareSize: number): void;
    setScale(scaleX: number, scaleY: number): void;
    setOffset(offsetX: number, offsetY: number): void;
    addSquare(pos: Float32Array): void;
    update(): void;
}
//# sourceMappingURL=WbglScatterAcc.d.ts.map