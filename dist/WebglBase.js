import { ColorRGBA } from "./ColorRGBA";
/**
 * Baseline class
 */
export class WebglBase {
    //private static program: WebGLProgram;
    intensity;
    visible;
    /**
     * The number of data point pairs in the line
     */
    numPoints;
    /**
     * The data ponits for webgl array
     * @internal
     */
    xy;
    /**
     * The Color of the line
     */
    color;
    /**
     * The horizontal scale of the line
     * @default = 1
     */
    scaleX;
    /**
     * The vertical scale of the line
     * @default = 1
     */
    scaleY;
    /**
     * The horizontal offset of the line
     * @default = 0
     */
    offsetX;
    /**
     * the vertical offset of the line
     * @default = 0
     */
    offsetY;
    /**
     * if this is a close loop line or not
     * @default = false
     */
    loop;
    /**
     * total webgl number of points
     * @internal
     */
    webglNumPoints;
    /**
     * @private
     * @internal
     */
    _vbuffer;
    /**
     * @private
     * @internal
     */
    //public _prog: WebGLProgram;
    /**
     * @private
     * @internal
     */
    _coord;
    /**
     * @internal
     */
    constructor() {
        this.scaleX = 1;
        this.scaleY = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.loop = false;
        this._vbuffer = 0;
        this._coord = 0;
        this.visible = true;
        this.intensity = 1;
        this.xy = new Float32Array([]);
        this.numPoints = 0;
        this.color = new ColorRGBA(0, 0, 0, 1);
        this.webglNumPoints = 0;
    }
}
//# sourceMappingURL=WebglBase.js.map