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
    function lineGroup(c, num) {
        this.num_points = num;
        this.color = c;
        this.intenisty = 1;
        this.xy = new Float32Array(2 * this.num_points);
        this.vbuffer = 0;
        this.prog = 0;
        this.coord = 0;
        this.visible = true;
    }
    lineGroup.prototype.setX = function (index, x) {
        this.xy[index * 2] = x;
    };
    lineGroup.prototype.setY = function (index, y) {
        this.xy[index * 2 + 1] = y;
    };
    lineGroup.prototype.getX = function (index) {
        return this.xy[index * 2];
    };
    lineGroup.prototype.getY = function (index) {
        return this.xy[index * 2 + 1];
    };
    lineGroup.prototype.linespaceX = function () {
        for (var i = 0; i < this.num_points; i++) {
            //set x to -num/2:1:+num/2
            this.setX(i, 2 * i / this.num_points - 1);
        }
    };
    lineGroup.prototype.constY = function (c) {
        for (var i = 0; i < this.num_points; i++) {
            //set x to -num/2:1:+num/2
            this.setY(i, c);
        }
    };
    lineGroup.prototype.shift_add = function (data) {
        var shift_size = data.length;
        for (var i = 0; i < this.num_points - shift_size; i++) {
            this.setY(i, this.getY(i + shift_size));
        }
        for (var i = 0; i < shift_size; i++) {
            this.setY(i + this.num_points - shift_size, data[i]);
        }
    };
    lineGroup.prototype.present_color = function () {
        return this.color;
    };
    return lineGroup;
}());
exports.lineGroup = lineGroup;
var webGLplot = /** @class */ (function () {
    /**
     *
     * @param canv
     * @param array
     */
    function webGLplot(canv) {
        var devicePixelRatio = window.devicePixelRatio || 1;
        // set the size of the drawingBuffer based on the size it's displayed.
        canv.width = canv.clientWidth * devicePixelRatio;
        canv.height = canv.clientHeight * devicePixelRatio;
        var gl = canv.getContext("webgl", {
            antialias: true,
            transparent: false
        });
        this.linegroups = [];
        this.gl = gl;
        this.scaleX = 1;
        this.scaleY = 1;
        // Clear the canvas  //??????????????????
        //gl.clearColor(0.1, 0.1, 0.1, 1.0);
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
        var _this = this;
        var gl = this.gl;
        this.linegroups.forEach(function (lg) {
            if (lg.visible) {
                gl.useProgram(lg.prog);
                var uscale = gl.getUniformLocation(lg.prog, 'uscale');
                gl.uniformMatrix2fv(uscale, false, new Float32Array([_this.scaleX, 0, 0, _this.scaleY]));
                var uColor = gl.getUniformLocation(lg.prog, 'uColor');
                gl.uniform4fv(uColor, [lg.present_color().r, lg.present_color().g, lg.present_color().b, lg.present_color().a]);
                gl.bufferData(gl.ARRAY_BUFFER, lg.xy, gl.STREAM_DRAW);
                gl.drawArrays(gl.LINE_STRIP, 0, lg.num_points);
            }
        });
    };
    webGLplot.prototype.clear = function () {
        // Clear the canvas  //??????????????????
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    };
    webGLplot.prototype.add_line = function (line) {
        line.vbuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, line.vbuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, line.xy, this.gl.STREAM_DRAW);
        var vertCode = "\n      attribute vec2 coordinates;\n      uniform mat2 uscale;\n      void main(void) {\n         gl_Position = vec4(uscale*coordinates, 0.0, 1.0);\n      }";
        // Create a vertex shader object
        var vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        // Attach vertex shader source code
        this.gl.shaderSource(vertShader, vertCode);
        // Compile the vertex shader
        this.gl.compileShader(vertShader);
        // Fragment shader source code
        var fragCode = "\n         precision mediump float;\n         uniform highp vec4 uColor;\n         void main(void) {\n            gl_FragColor =  uColor;\n         }";
        var fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragShader, fragCode);
        this.gl.compileShader(fragShader);
        line.prog = this.gl.createProgram();
        this.gl.attachShader(line.prog, vertShader);
        this.gl.attachShader(line.prog, fragShader);
        this.gl.linkProgram(line.prog);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, line.vbuffer);
        line.coord = this.gl.getAttribLocation(line.prog, "coordinates");
        this.gl.vertexAttribPointer(line.coord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(line.coord);
        this.linegroups.push(line);
    };
    webGLplot.prototype.viewport = function (a, b, c, d) {
        this.gl.viewport(a, b, c, d);
    };
    webGLplot.prototype.combine_xy = function (x, y) {
        var xy = new Float32Array(2 * y.length);
        var j = 0;
        for (var i = 0; i < y.length; i++) {
            xy[j] = x[i];
            xy[j + 1] = y[i];
            j = j + 2;
        }
        return xy;
    };
    return webGLplot;
}());
exports.webGLplot = webGLplot;
