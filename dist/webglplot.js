/**
 * Author Danial Chitnis 2019-23
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */
import { ColorRGBA } from "./ColorRGBA";
import { WebglAux } from "./WbglAux";
import { WebglScatterAcc } from "./WbglScatterAcc";
import { WebglAuxLine } from "./WbglAux";
export { WebglAux, ColorRGBA, WebglScatterAcc, WebglAuxLine };
/**
 * The main class for the webgl-plot library
 */
export class WebglPlot {
    constructor(canvas, options) {
        /**
         * log debug output
         */
        this.debug = false;
        if (options == undefined) {
            this.gl = canvas.getContext("webgl2", {
                antialias: true,
                transparent: false,
            });
        }
        else {
            this.gl = canvas.getContext("webgl2", {
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
        const gl = this.gl;
        this.gScaleX = 1;
        this.gScaleY = 1;
        this.gXYratio = 1;
        this.gOffsetX = 0;
        this.gOffsetY = 0;
        this.width = canvas.width;
        this.height = canvas.height;
        // Set the view port
        gl.viewport(0, 0, canvas.width, canvas.height);
        //https://learnopengl.com/Advanced-OpenGL/Blending
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    /**
     * Draw and clear the canvas
     */
    update() {
        this.clear();
        //this.draw();
    }
    /**
     * Clear the canvas
     */
    clear() {
        //this.webgl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
    /**
     * remove all data lines
     */
    /**
     * Change the WbGL viewport
     * @param a
     * @param b
     * @param c
     * @param d
     */
    viewport(a, b, c, d) {
        this.gl.viewport(a, b, c, d);
    }
    log(str) {
        if (this.debug) {
            console.log("[webgl-plot]:" + str);
        }
    }
}
//# sourceMappingURL=webglplot.js.map