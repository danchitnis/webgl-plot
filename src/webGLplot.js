"use strict";
/**
 * Author Danial Chitnis 2019
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */
exports.__esModule = true;
var color_rgba = /** @class */ (function () {
    function color_rgba(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    return color_rgba;
}());
exports.color_rgba = color_rgba;
var lineGroup = /** @class */ (function () {
    function lineGroup(c) {
        this.color = c;
    }
    return lineGroup;
}());
exports.lineGroup = lineGroup;
var webGLplot = /** @class */ (function () {
    /**
     *
     * @param canv
     * @param array
     */
    function webGLplot(canv, linegroups) {
        var devicePixelRatio = window.devicePixelRatio || 1;
        // set the size of the drawingBuffer based on the size it's displayed.
        canv.width = canv.clientWidth * devicePixelRatio;
        canv.height = canv.clientHeight * devicePixelRatio;
        var gl = canv.getContext("webgl", {
            antialias: true,
            transparent: false
        });
        this.gl = gl;
        this.linegroups = linegroups;
        linegroups.forEach(function (lg) {
            lg.num_points = lg.xy.shape[0];
            lg.vbuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, lg.vbuffer);
            gl.bufferData(gl.ARRAY_BUFFER, lg.xy, gl.DYNAMIC_DRAW);
            var vertCode = "\n         attribute vec2 coordinates;\n         void main(void) {\n            gl_Position = vec4(coordinates, 0.0, 1.0);\n         }";
            // Create a vertex shader object
            var vertShader = gl.createShader(gl.VERTEX_SHADER);
            // Attach vertex shader source code
            gl.shaderSource(vertShader, vertCode);
            // Compile the vertex shader
            gl.compileShader(vertShader);
            // Fragment shader source code
            var fragCode = "\n            void main(void) {\n               gl_FragColor = vec4(" + lg.color.r + ", " + lg.color.g + ", " + lg.color.b + ", " + lg.color.a + ");\n            }";
            var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragShader, fragCode);
            gl.compileShader(fragShader);
            lg.prog = gl.createProgram();
            gl.attachShader(lg.prog, vertShader);
            gl.attachShader(lg.prog, fragShader);
            gl.linkProgram(lg.prog);
            gl.bindBuffer(gl.ARRAY_BUFFER, lg.vbuffer);
            var coord = gl.getAttribLocation(lg.prog, "coordinates");
            gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(coord);
        });
        // Clear the canvas  //??????????????????
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        // Enable the depth test
        gl.enable(gl.DEPTH_TEST);
        // Clear the color and depth buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Set the view port
        gl.viewport(0, 0, canv.width, canv.height);
    }
    /**
    * update
    */
    webGLplot.prototype.update = function () {
        var gl = this.gl;
        this.linegroups.forEach(function (lg) {
            gl.useProgram(lg.prog);
            gl.bufferData(gl.ARRAY_BUFFER, lg.xy.data, gl.DYNAMIC_DRAW);
            gl.drawArrays(gl.LINE_STRIP, 0, lg.num_points);
        });
    };
    return webGLplot;
}());
exports.webGLplot = webGLplot;
