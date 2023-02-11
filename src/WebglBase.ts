/**
 * Baseline class
 */
export abstract class WebglBase {
  //private static program: WebGLProgram;

  public visible: boolean;

  /**
   * The horizontal scale of the line
   * @default = 1
   */
  public scaleX: number;

  /**
   * The vertical scale of the line
   * @default = 1
   */
  public scaleY: number;

  /**
   * The horizontal offset of the line
   * @default = 0
   */
  public offsetX: number;

  /**
   * the vertical offset of the line
   * @default = 0
   */
  public offsetY: number;

  /**
   * @private
   * @internal
   */
  public _prog: WebGLProgram;

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
