/**
 * Baseline class
 */
export class WebglBase {
    //private static program: WebGLProgram;
    visible;
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
     * @private
     * @internal
     */
    _prog;
    /**
     * @internal
     */
    constructor() {
        this.scaleX = 1;
        this.scaleY = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.visible = true;
    }
}
//# sourceMappingURL=WebglBase.js.map