class ColorRGBA {
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
class WebglAuxLine {
    constructor(xy, color) {
        this.xy = xy;
        this.color = color;
    }
}
/**
 * The standard Line class
 */
class WebglAux {
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
    constructor(wglp, maxSquare) {
        this.headIndex = 0;
        this.squareIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);
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

class WebglLineRoll {
    constructor(wglp, bufferSize) {
        //super();
        this.wglp = wglp;
        this.gl = wglp.gl;
        const gl = this.gl;
        this.bufferSize = bufferSize;
        this.shift = 0;
        this.dataIndex = 0;
        this.dataX = 1;
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
        //uniform vec4 uColor
        out vec4 color;
    
        void main(void) {
            color = vec4(1, 1, 0, 1);
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
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.bufferSize), this.gl.STATIC_DRAW);
        this.coord = gl.getAttribLocation(this.prog, "a_position");
        gl.vertexAttribPointer(this.coord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.coord);
        //const color = gl.getUniformLocation(this.prog, "uColor");
        //gl.uniform4fv(color, [1, 1, 0, 1]);
    }
    addPoint(y) {
        const gl = this.gl;
        this.shift += 4 / this.bufferSize;
        this.dataX += 4 / this.bufferSize;
        gl.useProgram(this.prog);
        gl.uniform1f(gl.getUniformLocation(this.prog, "u_shift"), this.shift);
        gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, this.dataIndex * 2 * 4, new Float32Array([this.dataX, y]));
        gl.enableVertexAttribArray(this.coord);
        this.dataIndex = (this.dataIndex + 1) % (this.bufferSize / 2);
    }
    draw() {
        const gl = this.gl;
        this.gl.useProgram(this.prog);
        gl.drawArrays(gl.LINE_STRIP, 0, this.dataIndex);
        gl.drawArrays(gl.LINE_STRIP, this.dataIndex, this.bufferSize / 2 - this.dataIndex);
    }
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

export { ColorRGBA, WebglAux, WebglAuxLine, WebglLineRoll, WebglPlot, WebglScatterAcc };
