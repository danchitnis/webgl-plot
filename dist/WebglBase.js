import { ColorRGBA } from "./ColorRGBA";
/**
 * Baseline class
 */
export class WebglBase {
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