import { ColorRGBA } from "./ColorRGBA";
import { WebglBaseLine } from "./WebglBaseLine";
export declare class WebglPolar extends WebglBaseLine {
    numPoints: number;
    xy: Float32Array;
    color: ColorRGBA;
    intenisty: number;
    visible: boolean;
    coord: number;
    offsetTheta: number;
    constructor(c: ColorRGBA, numPoints: number);
    /**
     * @param index: index of the line
     * @param theta : angle in deg
     * @param r : radius
     */
    setRtheta(index: number, theta: number, r: number): void;
    getTheta(index: number): number;
    getR(index: number): number;
    private setX;
    private setY;
    getX(index: number): number;
    getY(index: number): number;
}
//# sourceMappingURL=WbglPolar.d.ts.map