import type { ColorRGBA } from "./ColorRGBA";
import { WebglBase } from "./WebglBase";

/**
 * The standard Line class
 */
export class WebglLine extends WebglBase {
  private currentIndex = 0;
  private color: ColorRGBA;
  private xy: Float32Array;
  private numPoints: number;
  private webglNumPoints: number;
  private gl: WebGL2RenderingContext;

  /**
   * Create a new line
   * @param c - the color of the line
   * @param numPoints - number of data pints
   * @example
   * ```typescript
   * x= [0,1]
   * y= [1,2]
   * line = new WebglLine( new ColorRGBA(0.1,0.1,0.1,1), 2);
   * ```
   */
  constructor(gl: WebGL2RenderingContext, c: ColorRGBA, numPoints: number) {
    super();
    this.webglNumPoints = numPoints;
    this.numPoints = numPoints;
    this.color = c;
    this.gl = gl;

    const vertCode = `
      attribute vec2 coor;
      uniform mat2 uscale;
      uniform vec2 uoffset;

      void main(void) {
         vec2 line = vec2(coor.x, coor.y);
         gl_Position = vec4(uscale*line + uoffset, 0.0, 1.0);
      }`;

    // Create a vertex shader object
    const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);

    // Attach vertex shader source code
    this.gl.shaderSource(vertShader as WebGLShader, vertCode);

    // Compile the vertex shader
    this.gl.compileShader(vertShader as WebGLShader);

    // Fragment shader source code
    const fragCode = `
         precision mediump float;
         uniform highp vec4 uColor;
         void main(void) {
            gl_FragColor =  uColor;
         }`;

    const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(fragShader as WebGLShader, fragCode);
    this.gl.compileShader(fragShader as WebGLShader);
    this._prog = this.gl.createProgram() as WebGLProgram;
    this.gl.attachShader(this._prog, vertShader as WebGLShader);
    this.gl.attachShader(this._prog, fragShader as WebGLShader);
    this.gl.linkProgram(this._prog);

    this.xy = new Float32Array([-1, -1, 1, 1]);

    const vbuffer = this.gl.createBuffer() as WebGLBuffer;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.xy as ArrayBuffer, gl.STREAM_DRAW);

    const coord = this.gl.getAttribLocation(this._prog, "coor");
    this.gl.vertexAttribPointer(coord, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(coord);

    gl.useProgram(this._prog);

    const uscale = gl.getUniformLocation(this._prog, "uscale");
    gl.uniformMatrix2fv(uscale, false, new Float32Array([1, 0, 0, 1]));

    const uoffset = gl.getUniformLocation(this._prog, "uoffset");
    gl.uniform2fv(uoffset, new Float32Array([0, 0]));

    const uColor = gl.getUniformLocation(this._prog, "uColor");
    gl.uniform4fv(uColor, [1, 1, 0, 1]);

    gl.bufferData(gl.ARRAY_BUFFER, this.xy as ArrayBuffer, gl.STREAM_DRAW);
    //gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //gl.viewport(0, 0, 800, 600);

    gl.drawArrays(gl.LINE_STRIP, 0, this.xy.length / 2);

    // Clear the color
    //this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Set the view port
    //this.gl.viewport(0, 0, canvas.width, canvas.height);
  }

  draw() {
    this.gl.useProgram(this._prog);
    this.gl.drawArrays(this.gl.LINE_STRIP, 0, this.xy.length / 2);
  }
}
