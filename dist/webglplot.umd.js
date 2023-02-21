(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.WebglPlotBundle = {}));
})(this, (function (exports) { 'use strict';

    class ColorRGBA {
        r;
        g;
        b;
        a;
        constructor(r, g, b, a) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }
    }

    /*type Line = {
      xy: number[];
      color: ColorRGBA;
    };*/
    /**
     * The standard Line class
     */
    class WebglAux {
        wglp;
        lines;
        color;
        gl;
        coord;
        vbuffer;
        prog;
        constructor(wglp) {
            //super();
            this.wglp = wglp;
            this.gl = wglp.gl;
            const gl = this.gl;
            this.lines = [];
            const vertCode = `#version 300 es

    layout(location = 0) in vec2 coord;
    uniform mat2 uscale;
    uniform vec2 uoffset;

    void main(void) {
      vec2 line = vec2(coord.x, coord.y);
      gl_Position = vec4(uscale*line + uoffset, 0.0, 1.0);
    }`;
            const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
            this.gl.shaderSource(vertShader, vertCode);
            this.gl.compileShader(vertShader);
            if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
                // there was an error
                console.error(gl.getShaderInfoLog(vertShader));
            }
            // Fragment shader source code
            const fragCode = `#version 300 es

         precision mediump float;
         uniform highp vec4 uColor;
         out vec4 outColor;
         
         void main(void) {
            outColor=  uColor;
         }`;
            const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
            this.gl.shaderSource(fragShader, fragCode);
            this.gl.compileShader(fragShader);
            if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
                // there was an error
                console.error(gl.getShaderInfoLog(fragShader));
            }
            this.prog = this.gl.createProgram();
            this.gl.attachShader(this.prog, vertShader);
            this.gl.attachShader(this.prog, fragShader);
            this.gl.linkProgram(this.prog);
            this.gl.useProgram(this.prog);
            this.vbuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuffer);
            this.coord = this.gl.getAttribLocation(this.prog, "coord");
            this.gl.vertexAttribPointer(this.coord, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.coord);
            gl.useProgram(this.prog);
            const uscale = gl.getUniformLocation(this.prog, "uscale");
            gl.uniformMatrix2fv(uscale, false, new Float32Array([this.wglp.gScaleX, 0, 0, this.wglp.gScaleY]));
            const uoffset = gl.getUniformLocation(this.prog, "uoffset");
            gl.uniform2fv(uoffset, new Float32Array([this.wglp.gOffsetX, this.wglp.gOffsetY]));
            const uColor = gl.getUniformLocation(this.prog, "uColor");
            gl.uniform4fv(uColor, [1, 1, 0, 1]);
        }
        addLine(line) {
            this.lines.push(line);
        }
        draw() {
            this.gl.useProgram(this.prog);
            this.lines.forEach((line) => {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(line.xy), this.gl.STREAM_DRAW);
                const uColor = this.gl.getUniformLocation(this.prog, "uColor");
                this.gl.uniform4f(uColor, line.color.r, line.color.g, line.color.b, line.color.a);
                this.gl.drawArrays(this.gl.LINE_STRIP, 0, line.xy.length / 2);
            });
        }
    }

    /**
     * The standard Line class
     */
    class WebglScatterAcc {
        wglp;
        headIndex = 0;
        color;
        squareSize;
        maxSquare;
        gl;
        squareIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);
        colorsBuffer;
        positionBuffer;
        prog;
        attrPosLocation;
        attrColorLocation;
        constructor(wglp, maxSquare) {
            //super();
            this.wglp = wglp;
            this.color = new ColorRGBA(1, 1, 1, 1);
            this.squareSize = 0.1;
            this.maxSquare = maxSquare;
            this.gl = wglp.gl;
            const gl = this.gl;
            // Create vertex shader
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, `#version 300 es

    layout(location = 1) in vec2 position;
    layout(location = 2) in vec3 sColor;
    uniform float u_size;
    uniform vec2 u_offset;
    uniform mat2 u_scale;

    out vec3 vColor;
    
    void main() {
      vColor = sColor / vec3(255.0, 255.0, 255.0);
      vec2 squareVertices[4] = vec2[4](vec2(-1.0, 1.0), vec2(1.0, 1.0), vec2(-1.0, -1.0), vec2(1.0, -1.0));
      vec2 pos = u_size * squareVertices[gl_VertexID] + position;
      gl_Position = vec4((u_scale * pos) + u_offset, 0.0, 1.0);
    }

`);
            gl.compileShader(vertexShader);
            if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
                // there was an error
                console.error(gl.getShaderInfoLog(vertexShader));
            }
            // Create fragment shader
            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, `#version 300 es
    precision mediump float;

    //uniform vec4 u_color;
    in vec3 vColor;
    out vec4 outColor;

    void main() {
      outColor = vec4(vColor, 0.7);
    }
`);
            gl.compileShader(fragmentShader);
            if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
                // there was an error
                console.error(gl.getShaderInfoLog(fragmentShader));
            }
            // Create program
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);
            this.prog = program;
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.squareIndices, gl.STATIC_DRAW);
            // Create the square positions buffer
            const squarePositions = new Float32Array(Array.from({ length: this.maxSquare * 2 }, (_, i) => 0));
            this.positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, squarePositions, gl.DYNAMIC_DRAW);
            this.attrPosLocation = gl.getAttribLocation(this.prog, "position");
            gl.vertexAttribPointer(this.attrPosLocation, 2, gl.FLOAT, false, 0, 0);
            gl.vertexAttribDivisor(this.attrPosLocation, 1);
            gl.enableVertexAttribArray(this.attrPosLocation);
            // Create the color buffer
            const colors = new Uint8Array(Array.from({ length: this.maxSquare * 3 }, (_, i) => 255));
            this.colorsBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
            this.attrColorLocation = gl.getAttribLocation(this.prog, "sColor");
            gl.vertexAttribPointer(this.attrColorLocation, 3, gl.UNSIGNED_BYTE, false, 0, 0);
            gl.vertexAttribDivisor(this.attrColorLocation, 1);
            gl.enableVertexAttribArray(this.attrColorLocation);
            this.setScale(1, 1);
            this.setOffset(0, 0);
            // Set viewport and clear color
            //gl.enable(gl.DEPTH_TEST);
            //gl.viewport(0, 0, canvas.width, canvas.height);
            //gl.viewport(0, 0, 800, 600);
            //https://learnopengl.com/Advanced-OpenGL/Blending
            //gl.enable(gl.BLEND);
            //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA);
            //gl.clearColor(0, 0, 0, 1);
            //gl.clear(gl.COLOR_BUFFER_BIT);
        }
        setColor(color) {
            this.color = color;
            const colorUniformLocation = this.gl.getUniformLocation(this.prog, "u_color");
            this.gl.uniform4f(colorUniformLocation, color.r, color.g, color.b, color.a);
        }
        setSquareSize(squareSize) {
            this.squareSize = squareSize;
            const sizeUniformLocation = this.gl.getUniformLocation(this.prog, "u_size");
            this.gl.uniform1f(sizeUniformLocation, this.squareSize);
        }
        setScale(scaleX, scaleY) {
            const scaleUniformLocation = this.gl.getUniformLocation(this.prog, "u_scale");
            this.gl.uniformMatrix2fv(scaleUniformLocation, false, [
                scaleX * this.wglp.gScaleX,
                0,
                0,
                scaleY * this.wglp.gScaleY,
            ]);
        }
        setOffset(offsetX, offsetY) {
            const offsetUniformLocation = this.gl.getUniformLocation(this.prog, "u_offset");
            this.gl.uniform2f(offsetUniformLocation, offsetX + this.wglp.gOffsetX, offsetY + this.wglp.gOffsetY);
        }
        addSquare(pos, color) {
            const gl = this.gl;
            gl.useProgram(this.prog);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.bufferSubData(this.gl.ARRAY_BUFFER, this.headIndex * 2 * 4, pos, 0, pos.length);
            gl.enableVertexAttribArray(this.attrPosLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBuffer);
            gl.bufferSubData(this.gl.ARRAY_BUFFER, this.headIndex * 3 * 1, color, 0, color.length);
            gl.enableVertexAttribArray(this.attrColorLocation);
            this.headIndex = (this.headIndex + pos.length / 2) % this.maxSquare;
        }
        draw() {
            this.gl.useProgram(this.prog);
            this.gl.drawElementsInstanced(this.gl.TRIANGLES, this.squareIndices.length, this.gl.UNSIGNED_SHORT, 0, this.maxSquare);
        }
    }

    class WebglLine {
        xy = [];
        color;
        constructor(xy, color) {
            if (xy === undefined) {
                xy = [0, 0, 1, 1];
            }
            if (color === undefined) {
                color = { r: 0, g: 0, b: 0, a: 1 };
            }
            this.xy = xy;
            this.color = color;
        }
        getSize() {
            return this.xy.length / 2;
        }
        setY(y) {
            for (let i = 0; i < this.xy.length; i += 2) {
                this.xy[i + 1] = y;
            }
        }
        setYs(ys) {
            if (ys.length == this.xy.length / 2) {
                for (let i = 0; i < this.xy.length; i += 2) {
                    this.xy[i + 1] = ys[i / 2];
                }
            }
            else {
                throw new Error("mismatch in array length");
            }
        }
        setXYArray(xy) {
            this.xy = xy;
        }
        setX(x) {
            for (let i = 0; i < this.xy.length; i += 2) {
                this.xy[i] = x;
            }
        }
        lineSpaceX(lineSize) {
            const n = lineSize;
            this.xy = new Array(n * 2);
            console.log(this.xy);
            for (let i = 0; i < n; i++) {
                this.xy[i * 2] = (2 * i) / n - 1;
                this.xy[i * 2 + 1] = 0;
            }
            console.log(this.xy);
        }
        emptyLine(lineSize) {
            const n = lineSize;
            this.xy = new Array(n * 2);
            for (let i = 0; i < n; i++) {
                this.xy[i * 2] = 0;
                this.xy[i * 2 + 1] = 0;
            }
        }
        setColor(color) {
            this.color = color;
        }
    }

    class WebglLineRoll {
        wglp;
        color;
        gl;
        coord;
        vbuffer;
        prog;
        rollBufferSize;
        shift;
        dataIndex;
        dataX;
        lastDataX;
        lastDataY;
        colorLocation;
        constructor(wglp, bufferSize) {
            //super();
            this.wglp = wglp;
            this.gl = wglp.gl;
            const gl = this.gl;
            this.rollBufferSize = bufferSize;
            this.shift = 0;
            this.dataIndex = 0;
            this.dataX = 1;
            this.lastDataX = 0;
            this.lastDataY = 0;
            this.colorLocation = null;
            const vertCode = `#version 300 es
    
        layout(location = 1) in vec2 a_position;
        uniform float u_shift;
    
        void main(void) {
            vec2 shiftedPosition = a_position - vec2(u_shift, 0);
            gl_Position = vec4(shiftedPosition, 0, 1);
        }`;
            const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
            this.gl.shaderSource(vertShader, vertCode);
            this.gl.compileShader(vertShader);
            if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
                // there was an error
                console.error(gl.getShaderInfoLog(vertShader));
            }
            // Fragment shader source code
            const fragCode = `#version 300 es
        precision mediump float;    
        uniform vec4 uColor;
        out vec4 outColor;
    
        void main(void) {
            outColor = uColor;
        }`;
            const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
            this.gl.shaderSource(fragShader, fragCode);
            this.gl.compileShader(fragShader);
            if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
                // there was an error
                console.error(gl.getShaderInfoLog(fragShader));
            }
            // Create the shader program
            this.prog = this.gl.createProgram();
            this.gl.attachShader(this.prog, vertShader);
            this.gl.attachShader(this.prog, fragShader);
            this.gl.linkProgram(this.prog);
            if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
                // there was an error
                console.error(gl.getProgramInfoLog(this.prog));
            }
            // Create a buffer for the vertex coordinates
            this.vbuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.rollBufferSize * 2 + 4), this.gl.STATIC_DRAW);
            this.coord = gl.getAttribLocation(this.prog, "a_position");
            gl.vertexAttribPointer(this.coord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.coord);
            this.colorLocation = gl.getUniformLocation(this.prog, "uColor");
        }
        addPoint(y) {
            const gl = this.gl;
            this.shift += 2 / this.rollBufferSize;
            this.dataX += 2 / this.rollBufferSize;
            gl.useProgram(this.prog);
            gl.uniform1f(gl.getUniformLocation(this.prog, "u_shift"), this.shift);
            gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, this.dataIndex * 2 * 4, new Float32Array([this.dataX, y]));
            gl.enableVertexAttribArray(this.coord);
            if (this.dataIndex === this.rollBufferSize - 1) {
                this.lastDataX = this.dataX;
                this.lastDataY = y;
            }
            if (this.dataIndex === 0 && this.lastDataX !== 0) {
                gl.bufferSubData(gl.ARRAY_BUFFER, this.rollBufferSize * 2 * 4, new Float32Array([this.lastDataX, this.lastDataY, this.dataX, y]));
            }
            this.dataIndex = (this.dataIndex + 1) % this.rollBufferSize;
        }
        draw() {
            const gl = this.gl;
            this.gl.useProgram(this.prog);
            gl.uniform4fv(this.colorLocation, [1, 1, 0, 1]);
            gl.drawArrays(gl.LINE_STRIP, 0, this.dataIndex);
            gl.drawArrays(gl.LINE_STRIP, this.dataIndex, this.rollBufferSize - this.dataIndex);
            gl.drawArrays(gl.LINE_STRIP, this.rollBufferSize, 2);
        }
    }

    class WebglLinePlot {
        wglp;
        lines;
        gl;
        coord;
        vertexBuffer;
        prog;
        lineSizes;
        totalLineSizes;
        lineSizeAccum;
        indexData;
        constructor(wglp, lines) {
            //super();
            this.wglp = wglp;
            this.gl = wglp.gl;
            const gl = this.gl;
            this.lines = lines;
            const lineSizes = lines.map((line) => line.xy.length / 2);
            this.lineSizes = lineSizes;
            const vertCode = `#version 300 es
        layout(location = 1) in vec2 a_position;
        layout(location = 2) in vec3 a_Color;
      
        out vec3 vColor;
      
        void main() {
            vColor = a_Color;
            gl_Position = vec4(a_position, 0, 1);
        }`;
            const vertShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertShader, vertCode);
            gl.compileShader(vertShader);
            if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
                // there was an error
                console.error(gl.getShaderInfoLog(vertShader));
            }
            // Fragment shader source code
            const fragCode = `#version 300 es
        precision mediump float;
        in vec3 vColor;
        out vec4 outColor;
    
        void main() {
            outColor = vec4(vColor,0.7);
        }`;
            const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragShader, fragCode);
            gl.compileShader(fragShader);
            if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
                // there was an error
                console.error(gl.getShaderInfoLog(fragShader));
            }
            // Create the shader program
            this.prog = gl.createProgram();
            gl.attachShader(this.prog, vertShader);
            gl.attachShader(this.prog, fragShader);
            gl.linkProgram(this.prog);
            gl.useProgram(this.prog);
            const colorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            this.totalLineSizes = lineSizes.reduce((a, b) => a + b, 0);
            console.log(this.totalLineSizes);
            this.lineSizeAccum = lineSizes
                .reduce((acc, cur) => {
                acc.push(acc[acc.length - 1] + cur);
                return acc;
            }, [0])
                .splice(0, lineSizes.length);
            const colors = Array.from({ length: lineSizes.length }, () => [
                Math.random(),
                Math.random(),
                Math.random(),
            ]);
            let colorData = Array.from({ length: lineSizes[0] }, (_, i) => i).flatMap((x) => colors[0]);
            for (let i = 1; i < lineSizes.length; i++) {
                colorData = colorData.concat(Array.from({ length: lineSizes[i] }, (_, j) => j).flatMap((x) => colors[i]));
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.DYNAMIC_DRAW);
            const uColorLocation = gl.getAttribLocation(this.prog, "a_Color");
            gl.vertexAttribPointer(uColorLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(uColorLocation);
            // Create a vertex buffer and bind it to the ARRAY_BUFFER target
            this.vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            this.coord = gl.getAttribLocation(this.prog, "a_position");
            gl.vertexAttribPointer(this.coord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.coord);
            // Define the vertex data
            const vertexData = new Float32Array(this.totalLineSizes * 2);
            // Upload the vertex data to the GPU
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.DYNAMIC_DRAW);
            // Create an index buffer and bind it to the ELEMENT_ARRAY_BUFFER target
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            // Define the index data
            this.indexData = Array.from({ length: lineSizes[0] }, (_, i) => i);
            for (let i = 1; i < lineSizes.length; i++) {
                this.indexData.push(-1);
                this.indexData = this.indexData.concat(Array.from({ length: lineSizes[i] }, (_, j) => this.lineSizeAccum[i] + j));
            }
            // Upload the index data to the GPU
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indexData), gl.STATIC_DRAW);
            gl.clearColor(0.1, 0.1, 0.1, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.viewport(0, 0, wglp.width, wglp.height);
        }
        updateLine = (lineIndex) => {
            const gl = this.gl;
            gl.useProgram(this.prog);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 4 * 2 * this.lineSizeAccum[lineIndex], new Float32Array(this.lines[lineIndex].xy));
            gl.enableVertexAttribArray(this.coord);
        };
        draw = () => {
            const gl = this.gl;
            gl.useProgram(this.prog);
            gl.drawElements(gl.LINE_STRIP, this.indexData.length, gl.UNSIGNED_INT, 0);
        };
    }

    /**
     * Author Danial Chitnis 2019-23
     *
     * inspired by:
     * https://codepen.io/AzazelN28
     * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
     */
    /**
     * The main class for the webgl-plot library
     */
    class WebglPlot {
        /**
         * @private
         */
        gl;
        width;
        height;
        devicePixelRatio;
        /**
         * Global horizontal scale factor
         * @default = 1.0
         */
        gScaleX;
        /**
         * Global vertical scale factor
         * @default = 1.0
         */
        gScaleY;
        /**
         * Global X/Y scale ratio
         * @default = 1
         */
        gXYratio;
        /**
         * Global horizontal offset
         * @default = 0
         */
        gOffsetX;
        /**
         * Global vertical offset
         * @default = 0
         */
        gOffsetY;
        /**
         * log debug output
         */
        debug = false;
        constructor(canvas, options) {
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

    exports.ColorRGBA = ColorRGBA;
    exports.WebglAux = WebglAux;
    exports.WebglLine = WebglLine;
    exports.WebglLinePlot = WebglLinePlot;
    exports.WebglLineRoll = WebglLineRoll;
    exports.WebglPlot = WebglPlot;
    exports.WebglScatterAcc = WebglScatterAcc;

}));
