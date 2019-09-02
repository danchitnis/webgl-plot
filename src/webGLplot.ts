/**
 * Author Danial Chitnis 2019
 * 
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */

import ndarray = require("ndarray");


/**
 * 
 */
export class webGLplot {
    num_points:number;
    array:ndarray;
    gl:WebGLRenderingContext;


    /**
     * 
     * @param canv 
     * @param array 
     */
    constructor(canv:HTMLCanvasElement, array:ndarray) {
       
       let devicePixelRatio = window.devicePixelRatio || 1;
 
       // set the size of the drawingBuffer based on the size it's displayed.
       canv.width = canv.clientWidth * devicePixelRatio;
       canv.height = canv.clientHeight * devicePixelRatio;
 
       const gl = <WebGLRenderingContext>canv.getContext("webgl", {
          antialias: true,
          transparent: false
       });
 
       this.array = array;
       this.gl = gl;
       this.num_points = array.shape[0];
 
       // Create an empty buffer object
       let vertex_buffer = gl.createBuffer();
 
       // Bind appropriate array buffer to it
       gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
 
       // Pass the vertex data to the buffer
       //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
       gl.bufferData(gl.ARRAY_BUFFER, <ArrayBuffer>array.data, gl.DYNAMIC_DRAW);
 
       // Unbind the buffer
       //gl.bindBuffer(gl.ARRAY_BUFFER, null);
 
       /*=================== Shaders ====================*/
 
       // Vertex shader source code
       let vertCode = `
          attribute vec2 coordinates;
          void main(void) {
             gl_Position = vec4(coordinates, 0.0, 1.0);
          }`;
 
       // Create a vertex shader object
       let vertShader = gl.createShader(gl.VERTEX_SHADER);
 
       // Attach vertex shader source code
       gl.shaderSource(vertShader, vertCode);
 
       // Compile the vertex shader
       gl.compileShader(vertShader);
 
       // Fragment shader source code
       let fragCode = `
          void main(void) {
             gl_FragColor = vec4(1, 1.0, 0.0, 1);
          }`;
 
       // Create fragment shader object
       let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
 
       // Attach fragment shader source code
       gl.shaderSource(fragShader, fragCode);
 
       // Compile the fragmentt shader
       gl.compileShader(fragShader);
 
       // Create a shader program object to store
       // the combined shader program
       let shaderProgram = gl.createProgram();
 
       // Attach a vertex shader
       gl.attachShader(shaderProgram, vertShader);
 
       // Attach a fragment shader
       gl.attachShader(shaderProgram, fragShader);
 
       // Link both the programs
       gl.linkProgram(shaderProgram);
 
       // Use the combined shader program object
       gl.useProgram(shaderProgram);
 
       /*======= Associating shaders to buffer objects ======*/
 
       // Bind vertex buffer object
       gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
 
       // Get the attribute location
       let coord = gl.getAttribLocation(shaderProgram, "coordinates");
 
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
       gl.viewport(0,0,canv.width,canv.height);
 
       // Draw the triangle
       gl.drawArrays(gl.LINE_STRIP, 0, this.num_points);
 
       // POINTS, LINE_STRIP, LINE_LOOP, LINES,
       // TRIANGLE_STRIP,TRIANGLE_FAN, TRIANGLES
    }

    /**
     * update
     */
    update() {
       let gl = this.gl;
       gl.bufferData(gl.ARRAY_BUFFER, <ArrayBuffer>this.array.data, gl.DYNAMIC_DRAW);
       gl.drawArrays(gl.LINE_STRIP, 0, this.num_points);
    }
 }