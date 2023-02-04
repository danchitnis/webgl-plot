import { ColorRGBA } from "./ColorRGBA";
/**
 * The standard Line class
 */
export class WebglScatterAcc {
    constructor(canvas, maxSquare) {
        this.headIndex = 0;
        this.squareIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);
        //super();
        //this.webglNumPoints = numPoints;
        //this.numPoints = numPoints;
        this.gl = canvas.getContext("webgl2");
        this.color = new ColorRGBA(1, 1, 1, 1);
        this.squareSize = 0.1;
        this.maxSquare = maxSquare;
        this.width = canvas.width;
        this.height = canvas.height;
        const gl = this.gl;
        // Create the square indices buffer
        //const squareIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.squareIndices, gl.STATIC_DRAW);
        // Create the instance IDs buffer
        const instanceIDs = new Float32Array(Array.from({ length: this.maxSquare }, (_, i) => i));
        const instanceIDBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceIDBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, instanceIDs, gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(1, 1);
        gl.enableVertexAttribArray(1);
        // Create the square positions buffer
        const squarePositions = new Float32Array(Array.from({ length: this.maxSquare * 2 }, (_, i) => Math.random() * 2 - 1));
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, squarePositions, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(0, 1);
        gl.enableVertexAttribArray(0);
        // Create vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, `#version 300 es

    layout(location = 0) in vec2 position;
    layout(location = 1) in float a_instanceID;
    uniform float u_size;
    uniform vec2 u_offset;
    uniform mat2 u_scale;
    
    void main() {
      vec2 squareVertices[4] = vec2[4](vec2(-1.0, 1.0), vec2(1.0, 1.0), vec2(-1.0, -1.0), vec2(1.0, -1.0));
      vec2 pos = u_size * squareVertices[gl_VertexID] + position + vec2(0,0) * a_instanceID;
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

    uniform vec4 u_color;
    out vec4 outColor;

    void main() {
      outColor = u_color;
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
        this.program = program;
        // Set viewport and clear color
        gl.viewport(0, 0, canvas.width, canvas.height);
        //https://learnopengl.com/Advanced-OpenGL/Blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    setColor(color) {
        this.color = color;
        const colorUniformLocation = this.gl.getUniformLocation(this.program, "u_color");
        this.gl.uniform4f(colorUniformLocation, color.r, color.g, color.b, color.a);
    }
    setSquareSize(squareSize) {
        this.squareSize = squareSize;
        const sizeUniformLocation = this.gl.getUniformLocation(this.program, "u_size");
        this.gl.uniform1f(sizeUniformLocation, this.squareSize);
    }
    setScale(scaleX, scaleY) {
        const scaleUniformLocation = this.gl.getUniformLocation(this.program, "u_scale");
        this.gl.uniformMatrix2fv(scaleUniformLocation, false, [scaleX, 0, 0, scaleY]);
    }
    setOffset(offsetX, offsetY) {
        const offsetUniformLocation = this.gl.getUniformLocation(this.program, "u_offset");
        this.gl.uniform2f(offsetUniformLocation, offsetX, offsetY);
    }
    addSquare(pos) {
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, this.headIndex * 2 * 4, pos);
        this.headIndex = (this.headIndex + pos.length / 2) % this.maxSquare;
        //console.log(this.headIndex);
    }
    update() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.drawElementsInstanced(this.gl.TRIANGLES, this.squareIndices.length, this.gl.UNSIGNED_SHORT, 0, this.maxSquare);
    }
}
//# sourceMappingURL=WbglScatterAcc.js.map