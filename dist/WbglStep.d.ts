import { ColorRGBA } from "./ColorRGBA";
import { WebglBaseLine } from "./WebglBaseLine";
export declare class WebglStep extends WebglBaseLine {
    constructor(c: ColorRGBA, num: number);
    setY(index: number, y: number): void;
    getX(index: number): number;
    getY(index: number): number;
    linespaceX(start: number, stepsize: number): void;
    constY(c: number): void;
    shiftAdd(data: Float32Array): void;
}
//# sourceMappingURL=WbglStep.d.ts.map