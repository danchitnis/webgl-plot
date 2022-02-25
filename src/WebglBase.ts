import { ColorRGBA } from "./ColorRGBA";

/**
 * Baseline class
 */
export abstract class WebglBase {
  //private static program: WebGLProgram;

  public intensity: number;
  public visible: boolean;

  /**
   * The number of data point pairs in the line
   */
  public numPoints: number;

  /**
   * The data ponits for webgl array
   * @internal
   */
  public xy: Float32Array;

  /**
   * The Color of the line
   */
  public color: ColorRGBA;

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
   * if this is a close loop line or not
   * @default = false
   */
  public loop: boolean;

  /**
   * total webgl number of points
   * @internal
   */
  public webglNumPoints: number;

  /**
   * @private
   * @internal
   */
  public _vbuffer: WebGLBuffer;

  /**
   * @private
   * @internal
   */
  //public _prog: WebGLProgram;

  /**
   * @private
   * @internal
   */
  public _coord: number;

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
