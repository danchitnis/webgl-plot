import { ColorRGBA } from "./ColorRGBA";

/**
 * Baseline class
 */
export class WebglBaseLine {
  private static readonly vertCode = `
      attribute vec2 coordinates;
      uniform mat2 uscale;
      uniform vec2 uoffset;

      void main(void) {
          gl_Position = vec4(uscale*coordinates + uoffset, 0.0, 1.0);
      }`;

  private static readonly fragCode = `
      precision mediump float;
      uniform highp vec4 uColor;

      void main(void) {
         gl_FragColor =  uColor;
      }`;

  private static program: WebGLProgram;

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
   * The vertical sclae of the line
   * @default = 1
   */
  public scaleY: number;

  /**
   * The horixontal offset of the line
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
  public _prog: WebGLProgram;

  /**
   * @private
   * @internal
   */
  public _coord: number;

  public initProgram(webgl: WebGLRenderingContext) {
    if(!WebglBaseLine.program) {
      this.createProgram(webgl);
    }
    this._prog = WebglBaseLine.program;
  }

  private createProgram(webgl: WebGLRenderingContext) {
    const vertShader = webgl.createShader(webgl.VERTEX_SHADER);
    webgl.shaderSource(vertShader as WebGLShader, WebglBaseLine.vertCode);
    webgl.compileShader(vertShader as WebGLShader);

    const fragShader = webgl.createShader(webgl.FRAGMENT_SHADER);
    webgl.shaderSource(fragShader as WebGLShader, WebglBaseLine.fragCode);
    webgl.compileShader(fragShader as WebGLShader);

    WebglBaseLine.program = webgl.createProgram() as WebGLProgram;
    webgl.attachShader(WebglBaseLine.program, vertShader as WebGLShader);
    webgl.attachShader(WebglBaseLine.program, fragShader as WebGLShader);
    webgl.linkProgram(WebglBaseLine.program);
  }

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
    this._prog = 0;
    this._coord = 0;
    this.visible = true;
    this.intensity = 1;
  }
}
