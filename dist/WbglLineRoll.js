export class WebglLineRoll {
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
//# sourceMappingURL=WbglLineRoll.js.map