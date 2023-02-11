/**
 * Author Danial Chitnis 2019-20
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */
import { ColorRGBA } from "./ColorRGBA";
import { WebglLine } from "./WbglLine";
import { WebglScatterAcc } from "./WbglScatterAcc";
export { WebglLine, ColorRGBA, WebglScatterAcc };
/**
 * The main class for the webgl-plot library
 */
export class WebglPlot {
    /**
     * Create a webgl-plot instance
     * @param canvas - the canvas in which the plot appears
     * @param debug - (Optional) log debug messages to console
     *
     * @example
     *
     * For HTMLCanvas
     * ```typescript
     * const canvas = document.getElementbyId("canvas");
     *
     * const devicePixelRatio = window.devicePixelRatio || 1;
     * canvas.width = canvas.clientWidth * devicePixelRatio;
     * canvas.height = canvas.clientHeight * devicePixelRatio;
     *
     * const webglp = new WebGLplot(canvas);
     * ...
     * ```
     * @example
     *
     * For OffScreenCanvas
     * ```typescript
     * const offscreen = htmlCanvas.transferControlToOffscreen();
     *
     * offscreen.width = htmlCanvas.clientWidth * window.devicePixelRatio;
     * offscreen.height = htmlCanvas.clientHeight * window.devicePixelRatio;
     *
     * const worker = new Worker("offScreenCanvas.js", { type: "module" });
     * worker.postMessage({ canvas: offscreen }, [offscreen]);
     * ```
     * Then in offScreenCanvas.js
     * ```typescript
     * onmessage = function (evt) {
     * const wglp = new WebGLplot(evt.data.canvas);
     * ...
     * }
     * ```
     */
    constructor(canvas, options) {
        /**
         * log debug output
         */
        this.debug = false;
        if (options == undefined) {
            this.webgl = canvas.getContext("webgl", {
                antialias: true,
                transparent: false,
            });
        }
        else {
            this.webgl = canvas.getContext("webgl", {
                antialias: options.antialias,
                transparent: options.transparent,
                desynchronized: options.deSync,
                powerPerformance: options.powerPerformance,
                preserveDrawing: options.preserveDrawing,
            });
            this.debug = options.debug == undefined ? false : options.debug;
        }
        this.log("canvas type is: " + canvas.constructor.name);
        this.log(`[webgl-plot]:width=${canvas.width}, height=${canvas.height}`);
        //this.webgl = webgl;
        this.gScaleX = 1;
        this.gScaleY = 1;
        this.gXYratio = 1;
        this.gOffsetX = 0;
        this.gOffsetY = 0;
        this.gLog10X = false;
        this.gLog10Y = false;
        // Clear the color
        this.webgl.clear(this.webgl.COLOR_BUFFER_BIT);
        // Set the view port
        this.webgl.viewport(0, 0, canvas.width, canvas.height);
        this._progLine = this.webgl.createProgram();
        //this.initThinLineProgram();
        //https://learnopengl.com/Advanced-OpenGL/Blending
        this.webgl.enable(this.webgl.BLEND);
        this.webgl.blendFunc(this.webgl.SRC_ALPHA, this.webgl.ONE_MINUS_SRC_ALPHA);
    }
    /**
     * updates and redraws the content of the plot
     */
    _drawLines(lines) {
        const webgl = this.webgl;
    }
    /**
     * Draw and clear the canvas
     */
    update() {
        this.clear();
        //this.draw();
    }
    /**
     * Draw without clearing the canvas
     */
    /**
     * Clear the canvas
     */
    clear() {
        //this.webgl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.webgl.clear(this.webgl.COLOR_BUFFER_BIT);
    }
    /**
     * adds a line to the plot
     * @param line - this could be any of line, linestep, histogram, or polar
     *
     * @example
     * ```typescript
     * const line = new line(color, numPoints);
     * wglp.addLine(line);
     * ```
     */
    /*private _addLine(line: WebglLine | WebglStep | WebglPolar | WebglSquare | WebglThickLine): void {
      //line.initProgram(this.webgl);
      line._vbuffer = this.webgl.createBuffer() as WebGLBuffer;
      this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);
      this.webgl.bufferData(this.webgl.ARRAY_BUFFER, line.xy as ArrayBuffer, this.webgl.STREAM_DRAW);
  
      //this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);
  
      line._coord = this.webgl.getAttribLocation(this._progLine, "coordinates");
      this.webgl.vertexAttribPointer(line._coord, 2, this.webgl.FLOAT, false, 0, 0);
      this.webgl.enableVertexAttribArray(line._coord);
    }
  
    public addDataLine(line: WebglLine | WebglStep | WebglPolar): void {
      this._addLine(line);
      this.linesData.push(line);
    }
  
    public addLine = this.addDataLine;
  
    public addAuxLine(line: WebglLine | WebglStep | WebglPolar): void {
      this._addLine(line);
      this.linesAux.push(line);
    }
  
    public addThickLine(thickLine: WebglThickLine): void {
      this._addLine(thickLine);
      this._thickLines.push(thickLine);
    }
  
    public addSurface(surface: WebglSquare): void {
      this._addLine(surface);
      this.surfaces.push(surface);
    }
  
    private initThinLineProgram() {
      const vertCode = `
        attribute vec2 coordinates;
        uniform mat2 uscale;
        uniform vec2 uoffset;
        uniform ivec2 is_log;
  
        void main(void) {
           float x = (is_log[0]==1) ? log(coordinates.x) : coordinates.x;
           float y = (is_log[1]==1) ? log(coordinates.y) : coordinates.y;
           vec2 line = vec2(x, y);
           gl_Position = vec4(uscale*line + uoffset, 0.0, 1.0);
        }`;
  
      // Create a vertex shader object
      const vertShader = this.webgl.createShader(this.webgl.VERTEX_SHADER);
  
      // Attach vertex shader source code
      this.webgl.shaderSource(vertShader as WebGLShader, vertCode);
  
      // Compile the vertex shader
      this.webgl.compileShader(vertShader as WebGLShader);
  
      // Fragment shader source code
      const fragCode = `
           precision mediump float;
           uniform highp vec4 uColor;
           void main(void) {
              gl_FragColor =  uColor;
           }`;
  
      const fragShader = this.webgl.createShader(this.webgl.FRAGMENT_SHADER);
      this.webgl.shaderSource(fragShader as WebGLShader, fragCode);
      this.webgl.compileShader(fragShader as WebGLShader);
      this._progLine = this.webgl.createProgram() as WebGLProgram;
      this.webgl.attachShader(this._progLine, vertShader as WebGLShader);
      this.webgl.attachShader(this._progLine, fragShader as WebGLShader);
      this.webgl.linkProgram(this._progLine);
    }*/
    /**
     * remove all data lines
     */
    removeDataLines() {
        this._linesData = [];
    }
    /**
     * Change the WbGL viewport
     * @param a
     * @param b
     * @param c
     * @param d
     */
    viewport(a, b, c, d) {
        this.webgl.viewport(a, b, c, d);
    }
    log(str) {
        if (this.debug) {
            console.log("[webgl-plot]:" + str);
        }
    }
}
//# sourceMappingURL=webglplot.js.map