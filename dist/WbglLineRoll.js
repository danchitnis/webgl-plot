export class WebglLineRoll {
    gl;
    aPosition;
    vertexBuffer;
    program;
    rollBufferSize;
    shift;
    dataIndex;
    dataX;
    lastDataX;
    lastDataY;
    colorLocation;
    numLines;
    colors;
    constructor(wglp, rollBufferSize, numLines) {
        this.gl = wglp.gl;
        this.rollBufferSize = rollBufferSize;
        this.shift = 0;
        this.dataIndex = 0;
        this.dataX = 1;
        this.lastDataX = Array(numLines).fill(0);
        this.lastDataY = Array(numLines).fill(0);
        this.colorLocation = null;
        this.numLines = numLines;
        const gl = this.gl;
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
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertShader);
        this.gl.attachShader(this.program, fragShader);
        this.gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            // there was an error
            console.error(gl.getProgramInfoLog(this.program));
        }
        // Create a buffer for the vertex coordinates
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array((this.rollBufferSize * 2 + 4) * numLines), this.gl.DYNAMIC_DRAW);
        this.aPosition = gl.getAttribLocation(this.program, "a_position");
        gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.aPosition);
        this.colorLocation = gl.getUniformLocation(this.program, "uColor");
    }
    addPoint(ys) {
        const gl = this.gl;
        const bfsize = this.rollBufferSize + 2;
        this.shift += 2 / this.rollBufferSize;
        this.dataX += 2 / this.rollBufferSize;
        gl.useProgram(this.program);
        gl.uniform1f(gl.getUniformLocation(this.program, "u_shift"), this.shift);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        for (let i = 0; i < this.numLines; i++) {
            gl.bufferSubData(gl.ARRAY_BUFFER, (this.dataIndex + bfsize * i) * 2 * 4, new Float32Array([this.dataX, ys[i]]));
        }
        gl.enableVertexAttribArray(this.aPosition);
        if (this.dataIndex === this.rollBufferSize - 1) {
            for (let i = 0; i < this.numLines; i++) {
                this.lastDataX[i] = this.dataX;
                this.lastDataY[i] = ys[i];
            }
        }
        if (this.dataIndex === 0 && this.lastDataX[0] !== 0) {
            for (let i = 0; i < this.numLines; i++) {
                gl.bufferSubData(gl.ARRAY_BUFFER, (this.rollBufferSize + bfsize * i) * 2 * 4, new Float32Array([this.lastDataX[i], this.lastDataY[i], this.dataX, ys[i]]));
            }
        }
        this.dataIndex = (this.dataIndex + 1) % this.rollBufferSize;
    }
    draw() {
        const bfsize = this.rollBufferSize + 2;
        const gl = this.gl;
        this.gl.useProgram(this.program);
        for (let i = 0; i < this.numLines; i++) {
            gl.uniform4f(this.colorLocation, this.colors[i].r, this.colors[i].g, this.colors[i].b, this.colors[i].a);
            gl.drawArrays(gl.LINE_STRIP, i * bfsize, this.dataIndex);
            gl.drawArrays(gl.LINE_STRIP, i * bfsize + this.dataIndex, this.rollBufferSize - this.dataIndex);
            gl.drawArrays(gl.LINE_STRIP, i * bfsize + this.rollBufferSize, 2);
        }
    }
    setColors(colors) {
        this.colors = colors;
    }
}
//# sourceMappingURL=WbglLineRoll.js.map