/**
 * Author Danial Chitnis 2019
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */
import { ColorRGBA } from "./ColorRGBA";
import { WebglLine } from "./WbglLine";
import { WebglStep } from "./WbglStep";
import { WebglPolar } from "./WbglPolar";
export { WebglLine, ColorRGBA, WebglStep, WebglPolar };
/**
 * The main class for the webgl-plot library
 */
export default class WebGLPlot {
    /**
     * Create a webgl-plot instance
     * @param canvas - the canvas in which the plot appears
     * @param debug - (Optional) log debug messages to console
     *
     * @example
     *
     * For HTMLCanvas
     * ```typescript
     * const canvas = dcoument.getEelementbyId("canvas");
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
    constructor(canvas, debug) {
        /**
         * log debug output
         */
        this.debug = false;
        this.debug = debug == undefined ? false : debug;
        this.log("canvas type is: " + canvas.constructor.name);
        this.log(`[webgl-plot]:width=${canvas.width}, height=${canvas.height}`);
        const webgl = canvas.getContext("webgl", {
            antialias: true,
            transparent: false,
        });
        this.lines = [];
        this.webgl = webgl;
        this.gScaleX = 1;
        this.gScaleY = 1;
        this.gXYratio = 1;
        this.gOffsetX = 0;
        this.gOffsetY = 0;
        // Enable the depth test
        webgl.enable(webgl.DEPTH_TEST);
        // Clear the color and depth buffer
        webgl.clear(webgl.COLOR_BUFFER_BIT || webgl.DEPTH_BUFFER_BIT);
        // Set the view port
        webgl.viewport(0, 0, canvas.width, canvas.height);
        const vertCode = `
      attribute vec2 coordinates;
      uniform mat2 uscale;
      uniform vec2 uoffset;

      void main(void) {
        gl_Position = vec4(uscale*coordinates + uoffset, 0.0, 1.0);
      }`;
        const fragCode = `
      precision mediump float;
      uniform highp vec4 uColor;
      void main(void) {
        gl_FragColor =  uColor;
      }`;
        // Create a vertex shader object
        const vertShader = this.webgl.createShader(this.webgl.VERTEX_SHADER);
        // Attach vertex shader source code
        webgl.shaderSource(vertShader, vertCode);
        // Compile the vertex shader
        webgl.compileShader(vertShader);
        // Fragment shader source code
        const fragShader = this.webgl.createShader(this.webgl.FRAGMENT_SHADER);
        webgl.shaderSource(fragShader, fragCode);
        webgl.compileShader(fragShader);
        this.lineProg = this.webgl.createProgram();
        webgl.attachShader(this.lineProg, vertShader);
        webgl.attachShader(this.lineProg, fragShader);
        webgl.linkProgram(this.lineProg);
    }
    /**
     * updates and redraws the content of the plot
     */
    update() {
        const webgl = this.webgl;
        this.lines.forEach((line) => {
            if (line.visible) {
                webgl.useProgram(line._prog);
                const uscale = webgl.getUniformLocation(line._prog, "uscale");
                webgl.uniformMatrix2fv(uscale, false, new Float32Array([
                    line.scaleX * this.gScaleX,
                    0,
                    0,
                    line.scaleY * this.gScaleY * this.gXYratio,
                ]));
                const uoffset = webgl.getUniformLocation(line._prog, "uoffset");
                webgl.uniform2fv(uoffset, new Float32Array([line.offsetX + this.gOffsetX, line.offsetY + this.gOffsetY]));
                const uColor = webgl.getUniformLocation(line._prog, "uColor");
                webgl.uniform4fv(uColor, [line.color.r, line.color.g, line.color.b, line.color.a]);
                webgl.bufferData(webgl.ARRAY_BUFFER, line.xy, webgl.STREAM_DRAW);
                webgl.drawArrays(line.loop ? webgl.LINE_LOOP : webgl.LINE_STRIP, 0, line.webglNumPoints);
            }
        });
    }
    clear() {
        // Clear the canvas  //??????????????????
        //this.webgl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.webgl.clear(this.webgl.COLOR_BUFFER_BIT || this.webgl.DEPTH_BUFFER_BIT);
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
    addLine(line) {
        line._vbuffer = this.webgl.createBuffer();
        this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);
        this.webgl.bufferData(this.webgl.ARRAY_BUFFER, line.xy, this.webgl.STREAM_DRAW);
        line._prog = this.lineProg;
        line._coord = this.webgl.getAttribLocation(line._prog, "coordinates");
        this.webgl.vertexAttribPointer(line._coord, 2, this.webgl.FLOAT, false, 0, 0);
        this.webgl.enableVertexAttribArray(line._coord);
        this.lines.push(line);
    }
    /**
     * remove the last line
     */
    popLine() {
        this.lines.pop();
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