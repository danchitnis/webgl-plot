class ColorRGBA {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

/**
 * The standard Line class
 */
class WebglLine {
    /**
     * Create a new line
     * @param c - the color of the line
     * @param numPoints - number of data pints
     * @example
     * ```typescript
     * x= [0,1]
     * y= [1,2]
     * line = new WebglLine( new ColorRGBA(0.1,0.1,0.1,1), 2);
     * ```
     */
    constructor(wglp) {
        //super();
        this.gl = wglp.gl;
        const gl = this.gl;
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
        this.xy = new Float32Array([-1, -1, 1, 1]);
        this.vbuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.xy, gl.STREAM_DRAW);
        this.coord = this.gl.getAttribLocation(this.prog, "coord");
        this.gl.vertexAttribPointer(this.coord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.coord);
        gl.useProgram(this.prog);
        const uscale = gl.getUniformLocation(this.prog, "uscale");
        gl.uniformMatrix2fv(uscale, false, new Float32Array([1, 0, 0, 1]));
        const uoffset = gl.getUniformLocation(this.prog, "uoffset");
        gl.uniform2fv(uoffset, new Float32Array([0, 0]));
        const uColor = gl.getUniformLocation(this.prog, "uColor");
        gl.uniform4fv(uColor, [1, 1, 0, 1]);
        gl.bufferData(gl.ARRAY_BUFFER, this.xy, gl.STREAM_DRAW);
        //gl.bindBuffer(gl.ARRAY_BUFFER, null);
        //gl.viewport(0, 0, 800, 600);
        //gl.drawArrays(gl.LINE_STRIP, 0, this.xy.length / 2);
        // Clear the color
        //this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        // Set the view port
        //this.gl.viewport(0, 0, canvas.width, canvas.height);
    }
    draw() {
        this.gl.useProgram(this.prog);
        //this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuffer);
        //this.gl.vertexAttribPointer(this.coord, 2, this.gl.FLOAT, false, 0, 0);
        //this.gl.vertexAttribDivisor(this.coord, 0);
        //this.gl.enableVertexAttribArray(this.coord);
        this.gl.drawArrays(this.gl.LINE_STRIP, 0, this.xy.length / 2);
    }
}

/**
 * The standard Line class
 */
class WebglScatterAcc {
    constructor(wglp, maxSquare) {
        //super();
        this.headIndex = 0;
        this.squareIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);
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
        this.gl.uniformMatrix2fv(scaleUniformLocation, false, [scaleX, 0, 0, scaleY]);
    }
    setOffset(offsetX, offsetY) {
        const offsetUniformLocation = this.gl.getUniformLocation(this.prog, "u_offset");
        this.gl.uniform2f(offsetUniformLocation, offsetX, offsetY);
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

/**
 * Author Danial Chitnis 2019-20
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
        // Set the view port
        gl.viewport(0, 0, canvas.width, canvas.height);
        //https://learnopengl.com/Advanced-OpenGL/Blending
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    /**
     * updates and redraws the content of the plot
     */
    _drawLines(lines) {
        this.gl;
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
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
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

export { ColorRGBA, WebglLine, WebglPlot, WebglScatterAcc };
