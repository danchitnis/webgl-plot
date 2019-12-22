"use strict";
/**
 * Author Danial Chitnis 2019
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */
exports.__esModule = true;
var ColorRGBA_1 = require("./ColorRGBA");
exports.ColorRGBA = ColorRGBA_1.ColorRGBA;
var WbglLine_1 = require("./WbglLine");
exports.WebglLine = WbglLine_1.WebglLine;
var WbglStep_1 = require("./WbglStep");
exports.WebglStep = WbglStep_1.WebglStep;
var WebGLplot = /** @class */ (function () {
    /**
     *
     * @param canv
     * @param array
     */
    function WebGLplot(canv, backgroundColor) {
        var devicePixelRatio = window.devicePixelRatio || 1;
        // set the size of the drawingBuffer based on the size it's displayed.
        canv.width = canv.clientWidth * devicePixelRatio;
        canv.height = canv.clientHeight * devicePixelRatio;
        var webgl = canv.getContext("webgl", {
            antialias: true,
            transparent: false
        });
        this.lines = [];
        this.webgl = webgl;
        this.scaleX = 1;
        this.scaleY = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.backgroundColor = backgroundColor;
        // Clear the canvas
        webgl.clearColor(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b, this.backgroundColor.a);
        // Enable the depth test
        webgl.enable(webgl.DEPTH_TEST);
        // Clear the color and depth buffer
        webgl.clear(webgl.COLOR_BUFFER_BIT || webgl.DEPTH_BUFFER_BIT);
        // Set the view port
        webgl.viewport(0, 0, canv.width, canv.height);
    }
    WebGLplot.prototype.update = function () {
        var _this = this;
        var webgl = this.webgl;
        this.lines.forEach(function (line) {
            if (line.visible) {
                webgl.useProgram(line.prog);
                var uscale = webgl.getUniformLocation(line.prog, "uscale");
                webgl.uniformMatrix2fv(uscale, false, new Float32Array([_this.scaleX, 0, 0, _this.scaleY]));
                var uoffset = webgl.getUniformLocation(line.prog, "uoffset");
                webgl.uniform2fv(uoffset, new Float32Array([_this.offsetX, _this.offsetY]));
                var uColor = webgl.getUniformLocation(line.prog, "uColor");
                webgl.uniform4fv(uColor, [line.color.r, line.color.g, line.color.b, line.color.a]);
                webgl.bufferData(webgl.ARRAY_BUFFER, line.xy, webgl.STREAM_DRAW);
                webgl.drawArrays(webgl.LINE_STRIP, 0, line.webglNumPoints);
            }
        });
    };
    WebGLplot.prototype.clear = function () {
        // Clear the canvas  //??????????????????
        this.webgl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.webgl.clear(this.webgl.COLOR_BUFFER_BIT || this.webgl.DEPTH_BUFFER_BIT);
    };
    WebGLplot.prototype.addLine = function (line) {
        line.vbuffer = this.webgl.createBuffer();
        this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line.vbuffer);
        this.webgl.bufferData(this.webgl.ARRAY_BUFFER, line.xy, this.webgl.STREAM_DRAW);
        var vertCode = "\n      attribute vec2 coordinates;\n      uniform mat2 uscale;\n      uniform vec2 uoffset;\n\n      void main(void) {\n         gl_Position = vec4(uscale*coordinates + uoffset, 0.0, 1.0);\n      }";
        // Create a vertex shader object
        var vertShader = this.webgl.createShader(this.webgl.VERTEX_SHADER);
        // Attach vertex shader source code
        this.webgl.shaderSource(vertShader, vertCode);
        // Compile the vertex shader
        this.webgl.compileShader(vertShader);
        // Fragment shader source code
        var fragCode = "\n         precision mediump float;\n         uniform highp vec4 uColor;\n         void main(void) {\n            gl_FragColor =  uColor;\n         }";
        var fragShader = this.webgl.createShader(this.webgl.FRAGMENT_SHADER);
        this.webgl.shaderSource(fragShader, fragCode);
        this.webgl.compileShader(fragShader);
        line.prog = this.webgl.createProgram();
        this.webgl.attachShader(line.prog, vertShader);
        this.webgl.attachShader(line.prog, fragShader);
        this.webgl.linkProgram(line.prog);
        this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line.vbuffer);
        line.coord = this.webgl.getAttribLocation(line.prog, "coordinates");
        this.webgl.vertexAttribPointer(line.coord, 2, this.webgl.FLOAT, false, 0, 0);
        this.webgl.enableVertexAttribArray(line.coord);
        this.lines.push(line);
    };
    WebGLplot.prototype.viewport = function (a, b, c, d) {
        this.webgl.viewport(a, b, c, d);
    };
    return WebGLplot;
}());
exports.WebGLplot = WebGLplot;
//# sourceMappingURL=index.js.map