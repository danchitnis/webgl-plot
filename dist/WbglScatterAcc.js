import { ColorRGBA } from "./ColorRGBA";
import "./WebglBase";
/**
 * The standard Line class
 */
export class WebglScatterAcc {
    constructor(gl, maxSquare) {
        //super();
        this.headIndex = 0;
        this.squareIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);
        this.color = new ColorRGBA(1, 1, 1, 1);
        this.squareSize = 0.1;
        this.maxSquare = maxSquare;
        //this.width = canvas.width;
        //this.height = canvas.height;
        this.gl = gl;
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
        // Create the color buffer
        const colors = new Uint8Array(Array.from({ length: this.maxSquare * 3 }, (_, i) => 255));
        this.colorsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(2, 3, gl.UNSIGNED_BYTE, false, 0, 0);
        gl.vertexAttribDivisor(2, 1);
        gl.enableVertexAttribArray(2);
        // Create the square positions buffer
        const squarePositions = new Float32Array(Array.from({ length: this.maxSquare * 2 }, (_, i) => 0));
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, squarePositions, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(3, 1);
        gl.enableVertexAttribArray(3);
        // Create vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, `#version 300 es

    layout(location = 3) in vec2 position;
    layout(location = 1) in float a_instanceID;
    layout(location = 2) in vec3 sColor;
    uniform float u_size;
    uniform vec2 u_offset;
    uniform mat2 u_scale;

    out vec3 vColor;
    
    void main() {
      vColor = sColor / vec3(255.0, 255.0, 255.0);
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
        this._prog = program;
        // Set viewport and clear color
        //gl.enable(gl.DEPTH_TEST);
        //gl.viewport(0, 0, canvas.width, canvas.height);
        //gl.viewport(0, 0, 800, 600);
        //https://learnopengl.com/Advanced-OpenGL/Blending
        //gl.enable(gl.BLEND);
        //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA);
        //gl.clearColor(0, 0, 0, 1);
        //gl.clear(gl.COLOR_BUFFER_BIT);
        //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        //gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    setColor(color) {
        this.color = color;
        const colorUniformLocation = this.gl.getUniformLocation(this._prog, "u_color");
        this.gl.uniform4f(colorUniformLocation, color.r, color.g, color.b, color.a);
    }
    setSquareSize(squareSize) {
        this.squareSize = squareSize;
        const sizeUniformLocation = this.gl.getUniformLocation(this._prog, "u_size");
        this.gl.uniform1f(sizeUniformLocation, this.squareSize);
    }
    setScale(scaleX, scaleY) {
        const scaleUniformLocation = this.gl.getUniformLocation(this._prog, "u_scale");
        this.gl.uniformMatrix2fv(scaleUniformLocation, false, [scaleX, 0, 0, scaleY]);
    }
    setOffset(offsetX, offsetY) {
        const offsetUniformLocation = this.gl.getUniformLocation(this._prog, "u_offset");
        this.gl.uniform2f(offsetUniformLocation, offsetX, offsetY);
    }
    addSquare(pos, color) {
        const gl = this.gl;
        gl.useProgram(this._prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferSubData(this.gl.ARRAY_BUFFER, this.headIndex * 2 * 4, pos, 0, pos.length);
        gl.enableVertexAttribArray(3);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBuffer);
        gl.bufferSubData(this.gl.ARRAY_BUFFER, this.headIndex * 3 * 1, color, 0, color.length);
        gl.enableVertexAttribArray(2);
        this.headIndex = (this.headIndex + pos.length / 2) % this.maxSquare;
        //console.log(this.headIndex);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    update() {
        this.gl.useProgram(this._prog);
        //this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawElementsInstanced(this.gl.TRIANGLES, this.squareIndices.length, this.gl.UNSIGNED_SHORT, 0, this.maxSquare);
    }
}
//# sourceMappingURL=WbglScatterAcc.js.map