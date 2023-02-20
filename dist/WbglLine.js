export class WebglLine {
    wglp;
    gl;
    coord;
    vertexBuffer;
    prog;
    lineSizes;
    totalLineSizes;
    lineSizeAccum;
    indexData;
    constructor(wglp, lineSizes) {
        //super();
        this.wglp = wglp;
        this.gl = wglp.gl;
        const gl = this.gl;
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
    setXYbuffer = (xy, index) => {
        const gl = this.gl;
        gl.useProgram(this.prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 4 * 2 * this.lineSizeAccum[index], new Float32Array(xy));
        gl.enableVertexAttribArray(this.coord);
    };
    draw = () => {
        const gl = this.gl;
        gl.useProgram(this.prog);
        gl.drawElements(gl.LINE_STRIP, this.indexData.length, gl.UNSIGNED_INT, 0);
    };
}
//# sourceMappingURL=WbglLine.js.map