/**
 * Baseline class
 */
export declare abstract class WebglBase {
    visible: boolean;
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
     * @private
     * @internal
     */
    _prog: WebGLProgram;
    /**
     * @internal
     */
    constructor();
}
//# sourceMappingURL=WebglBase.d.ts.map