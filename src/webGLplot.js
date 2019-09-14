"use strict";
/**
 * Author Danial Chitnis 2019
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */
exports.__esModule = true;
var ndarray = require("ndarray");
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
/**
 *
 */
var webGLplot = /** @class */ (function () {
    /**
     *
     * @param canv
     * @param array
     */
    function webGLplot(canv, array, color) {
        var devicePixelRatio = window.devicePixelRatio || 1;
        // set the size of the drawingBuffer based on the size it's displayed.
        canv.width = canv.clientWidth * devicePixelRatio;
        canv.height = canv.clientHeight * devicePixelRatio;
        var gl = canv.getContext("webgl", {
            antialias: true,
            transparent: false
        });
        this.gl = gl;
        this.num_points = array.shape[0];
        this.color = color;
        var array2 = ndarray(new Float32Array(this.num_points * 2), [this.num_points, 2]);
        for (var i = 0; i < this.num_points; i++) {
            array2.set(i, 0, 2 * i / this.num_points - 1);
            array2.set(i, 1, 2 * i / this.num_points - 1);
        }
        this.array = array;
        this.array2 = array2;
        // Create an empty buffer object
        var vertex_buffer1 = gl.createBuffer();
        var vertex_buffer2 = gl.createBuffer();
        // Bind appropriate array buffer to it
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer1);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer2);
        // Pass the vertex data to the buffer
        gl.bufferData(gl.ARRAY_BUFFER, array.data, gl.DYNAMIC_DRAW);
        gl.bufferData(gl.ARRAY_BUFFER, array2.data, gl.DYNAMIC_DRAW);
        // Unbind the buffer
        //gl.bindBuffer(gl.ARRAY_BUFFER, null);
        /*=================== Shaders ====================*/
        // Vertex shader source code
        var vertCode = "\n          attribute vec2 coordinates;\n          void main(void) {\n             gl_Position = vec4(coordinates, 0.0, 1.0);\n          }";
        // Create a vertex shader object
        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        // Attach vertex shader source code
        gl.shaderSource(vertShader, vertCode);
        // Compile the vertex shader
        gl.compileShader(vertShader);
        // Fragment shader source code
        var fragCode = "\n          void main(void) {\n             gl_FragColor = vec4(" + color.r + ", " + color.g + ", " + color.b + ", " + color.a + ");\n          }";
        var fragCode2 = "\n      void main(void) {\n         gl_FragColor = vec4(0, 0, 1, " + color.a + ");\n      }";
        // Create fragment shader object
        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        var fragShader2 = gl.createShader(gl.FRAGMENT_SHADER);
        // Attach fragment shader source code
        gl.shaderSource(fragShader, fragCode);
        gl.shaderSource(fragShader2, fragCode2);
        // Compile the fragmentt shader
        gl.compileShader(fragShader);
        gl.compileShader(fragShader2);
        // Create a shader program object to store
        // the combined shader program
        var shaderProgram = gl.createProgram();
        var shaderProgram2 = gl.createProgram();
        // Attach a vertex shader
        gl.attachShader(shaderProgram, vertShader);
        gl.attachShader(shaderProgram2, vertShader);
        // Attach a fragment shader
        gl.attachShader(shaderProgram, fragShader);
        gl.attachShader(shaderProgram2, fragShader2);
        // Link both the programs
        gl.linkProgram(shaderProgram);
        gl.linkProgram(shaderProgram2);
        this.prog1 = shaderProgram;
        this.prog2 = shaderProgram2;
        // Use the combined shader program object
        gl.useProgram(shaderProgram);
        /*======= Associating shaders to buffer objects ======*/
        // Bind vertex buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer1);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer2);
        // Get the attribute location
        var coord = gl.getAttribLocation(shaderProgram, "coordinates");
        // Point an attribute to the currently bound VBO
        gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
        // Enable the attribute
        gl.enableVertexAttribArray(coord);
        /*============ Drawing the triangle =============*/
        // Clear the canvas
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        // Enable the depth test
        gl.enable(gl.DEPTH_TEST);
        // Clear the color and depth buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Set the view port
        gl.viewport(0, 0, canv.width, canv.height);
        // Draw the triangle
        gl.drawArrays(gl.LINE_STRIP, 0, this.num_points);
        // POINTS, LINE_STRIP, LINE_LOOP, LINES,
        // TRIANGLE_STRIP,TRIANGLE_FAN, TRIANGLES
    }
    /**
     * update
     */
    webGLplot.prototype.update = function () {
        var gl = this.gl;
        gl.useProgram(this.prog1);
        gl.bufferData(gl.ARRAY_BUFFER, this.array.data, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.LINE_STRIP, 0, this.num_points);
        gl.useProgram(this.prog2);
        gl.bufferData(gl.ARRAY_BUFFER, this.array2.data, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.LINE_STRIP, 0, this.num_points);
    };
    return webGLplot;
}());
exports.webGLplot = webGLplot;
