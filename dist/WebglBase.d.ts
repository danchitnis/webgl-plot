import { ColorRGBA } from "./ColorRGBA";
/**
 * Baseline class
 */
export declare abstract class WebglBase {
    intensity: number;
    visible: boolean;
    /**
     * The number of data point pairs in the line
     */
    numPoints: number;
    /**
     * The data ponits for webgl array
     * @internal
     */
    xy: Float32Array;
    /**
     * The Color of the line
     */
    color: ColorRGBA;
    /**
     * The horizontal scale of the line
     * @default = 1
     */
    scaleX: number;
    /**
     * The vertical scale of the line
     * @default = 1
     */
    scaleY: number;
    /**
     * The horizontal offset of the line
     * @default = 0
     */
    offsetX: number;
    /**
     * the vertical offset of the line
     * @default = 0
     */
    offsetY: number;
    /**
     * if this is a close loop line or not
     * @default = false
     */
    loop: boolean;
    /**
     * total webgl number of points
     * @internal
     */
    webglNumPoints: number;
    /**
     * @private
     * @internal
     */
    _vbuffer: WebGLBuffer;
    /**
     * @private
     * @internal
     */
    /**
     * @private
     * @internal
     */
    _coord: number;
    /**
     * @internal
     */
    constructor();
}
//# sourceMappingURL=WebglBase.d.ts.map