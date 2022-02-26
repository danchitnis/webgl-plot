/**
 * Author Danial Chitnis 2019-20
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */
import { ColorRGBA } from "./ColorRGBA";
import { WebglLine } from "./WbglLine";
import { WebglStep } from "./WbglStep";
import { WebglPolar } from "./WbglPolar";
import { WebglSquare } from "./WbglSquare";
import { WebglThickLine } from "./WbglThickLine";
export { WebglLine, ColorRGBA, WebglStep, WebglPolar, WebglSquare, WebglThickLine };
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
        this.addLine = this.addDataLine;
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
        this._linesData = [];
        this._linesAux = [];
        this._thickLines = [];
        this._surfaces = [];
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
        this.initThinLineProgram();
        //https://learnopengl.com/Advanced-OpenGL/Blending
        this.webgl.enable(this.webgl.BLEND);
        this.webgl.blendFunc(this.webgl.SRC_ALPHA, this.webgl.ONE_MINUS_SRC_ALPHA);
    }
    get linesData() {
        return this._linesData;
    }
    get linesAux() {
        return this._linesAux;
    }
    get thickLines() {
        return this._thickLines;
    }
    get surfaces() {
        return this._surfaces;
    }
    /**
     * updates and redraws the content of the plot
     */
    _drawLines(lines) {
        const webgl = this.webgl;
        lines.forEach((line) => {
            if (line.visible) {
                webgl.useProgram(this._progLine);
                const uscale = webgl.getUniformLocation(this._progLine, "uscale");
                webgl.uniformMatrix2fv(uscale, false, new Float32Array([
                    line.scaleX * this.gScaleX * (this.gLog10X ? 1 / Math.log(10) : 1),
                    0,
                    0,
                    line.scaleY * this.gScaleY * this.gXYratio * (this.gLog10Y ? 1 / Math.log(10) : 1),
                ]));
                const uoffset = webgl.getUniformLocation(this._progLine, "uoffset");
                webgl.uniform2fv(uoffset, new Float32Array([line.offsetX + this.gOffsetX, line.offsetY + this.gOffsetY]));
                const isLog = webgl.getUniformLocation(this._progLine, "is_log");
                webgl.uniform2iv(isLog, new Int32Array([this.gLog10X ? 1 : 0, this.gLog10Y ? 1 : 0]));
                const uColor = webgl.getUniformLocation(this._progLine, "uColor");
                webgl.uniform4fv(uColor, [line.color.r, line.color.g, line.color.b, line.color.a]);
                webgl.bufferData(webgl.ARRAY_BUFFER, line.xy, webgl.STREAM_DRAW);
                webgl.drawArrays(line.loop ? webgl.LINE_LOOP : webgl.LINE_STRIP, 0, line.webglNumPoints);
            }
        });
    }
    _drawSurfaces(squares) {
        const webgl = this.webgl;
        squares.forEach((square) => {
            if (square.visible) {
                webgl.useProgram(this._progLine);
                const uscale = webgl.getUniformLocation(this._progLine, "uscale");
                webgl.uniformMatrix2fv(uscale, false, new Float32Array([
                    square.scaleX * this.gScaleX * (this.gLog10X ? 1 / Math.log(10) : 1),
                    0,
                    0,
                    square.scaleY * this.gScaleY * this.gXYratio * (this.gLog10Y ? 1 / Math.log(10) : 1),
                ]));
                const uoffset = webgl.getUniformLocation(this._progLine, "uoffset");
                webgl.uniform2fv(uoffset, new Float32Array([square.offsetX + this.gOffsetX, square.offsetY + this.gOffsetY]));
                const isLog = webgl.getUniformLocation(this._progLine, "is_log");
                webgl.uniform2iv(isLog, new Int32Array([this.gLog10X ? 1 : 0, this.gLog10Y ? 1 : 0]));
                const uColor = webgl.getUniformLocation(this._progLine, "uColor");
                webgl.uniform4fv(uColor, [square.color.r, square.color.g, square.color.b, square.color.a]);
                webgl.bufferData(webgl.ARRAY_BUFFER, square.xy, webgl.STREAM_DRAW);
                webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, square.webglNumPoints);
            }
        });
    }
    _drawTriangles(thickLine) {
        const webgl = this.webgl;
        webgl.bufferData(webgl.ARRAY_BUFFER, thickLine.xy, webgl.STREAM_DRAW);
        webgl.useProgram(this._progLine);
        const uscale = webgl.getUniformLocation(this._progLine, "uscale");
        webgl.uniformMatrix2fv(uscale, false, new Float32Array([
            thickLine.scaleX * this.gScaleX * (this.gLog10X ? 1 / Math.log(10) : 1),
            0,
            0,
            thickLine.scaleY * this.gScaleY * this.gXYratio * (this.gLog10Y ? 1 / Math.log(10) : 1),
        ]));
        const uoffset = webgl.getUniformLocation(this._progLine, "uoffset");
        webgl.uniform2fv(uoffset, new Float32Array([thickLine.offsetX + this.gOffsetX, thickLine.offsetY + this.gOffsetY]));
        const isLog = webgl.getUniformLocation(this._progLine, "is_log");
        webgl.uniform2iv(isLog, new Int32Array([0, 0]));
        const uColor = webgl.getUniformLocation(this._progLine, "uColor");
        webgl.uniform4fv(uColor, [
            thickLine.color.r,
            thickLine.color.g,
            thickLine.color.b,
            thickLine.color.a,
        ]);
        webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, thickLine.xy.length / 2);
    }
    _drawThickLines() {
        this._thickLines.forEach((thickLine) => {
            if (thickLine.visible) {
                const calibFactor = Math.min(this.gScaleX, this.gScaleY);
                //const calibFactor = 10;
                //console.log(thickLine.getThickness());
                thickLine.setActualThickness(thickLine.getThickness() / calibFactor);
                thickLine.convertToTriPoints();
                this._drawTriangles(thickLine);
            }
        });
    }
    /**
     * Draw and clear the canvas
     */
    update() {
        this.clear();
        this.draw();
    }
    /**
     * Draw without clearing the canvas
     */
    draw() {
        this._drawLines(this.linesData);
        this._drawLines(this.linesAux);
        this._drawThickLines();
        this._drawSurfaces(this.surfaces);
    }
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
    _addLine(line) {
        //line.initProgram(this.webgl);
        line._vbuffer = this.webgl.createBuffer();
        this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);
        this.webgl.bufferData(this.webgl.ARRAY_BUFFER, line.xy, this.webgl.STREAM_DRAW);
        //this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);
        line._coord = this.webgl.getAttribLocation(this._progLine, "coordinates");
        this.webgl.vertexAttribPointer(line._coord, 2, this.webgl.FLOAT, false, 0, 0);
        this.webgl.enableVertexAttribArray(line._coord);
    }
    addDataLine(line) {
        this._addLine(line);
        this.linesData.push(line);
    }
    addAuxLine(line) {
        this._addLine(line);
        this.linesAux.push(line);
    }
    addThickLine(thickLine) {
        this._addLine(thickLine);
        this._thickLines.push(thickLine);
    }
    addSurface(surface) {
        this._addLine(surface);
        this.surfaces.push(surface);
    }
    initThinLineProgram() {
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
        this.webgl.shaderSource(vertShader, vertCode);
        // Compile the vertex shader
        this.webgl.compileShader(vertShader);
        // Fragment shader source code
        const fragCode = `
         precision mediump float;
         uniform highp vec4 uColor;
         void main(void) {
            gl_FragColor =  uColor;
         }`;
        const fragShader = this.webgl.createShader(this.webgl.FRAGMENT_SHADER);
        this.webgl.shaderSource(fragShader, fragCode);
        this.webgl.compileShader(fragShader);
        this._progLine = this.webgl.createProgram();
        this.webgl.attachShader(this._progLine, vertShader);
        this.webgl.attachShader(this._progLine, fragShader);
        this.webgl.linkProgram(this._progLine);
    }
    /**
     * remove the last data line
     */
    popDataLine() {
        this.linesData.pop();
    }
    /**
     * remove all the lines
     */
    removeAllLines() {
        this._linesData = [];
        this._linesAux = [];
        this._thickLines = [];
        this._surfaces = [];
    }
    /**
     * remove all data lines
     */
    removeDataLines() {
        this._linesData = [];
    }
    /**
     * remove all auxiliary lines
     */
    removeAuxLines() {
        this._linesAux = [];
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