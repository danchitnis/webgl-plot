/**
 * Author Danial Chitnis 2019
 * 
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */

import ndarray = require("ndarray");


export class color_rgba {
   r: number;
   g: number;
   b: number;
   a: number;

   constructor(r:number, g:number, b:number, a:number) {
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
   }
}


export class lineGroup {
   num_points: number;
   xy: ndarray;
   color: color_rgba;
   vbuffer: WebGLBuffer;
   prog: WebGLProgram;

   constructor(c: color_rgba) {
      this.color = c;
   }
}


export class webGLplot {
    num_points:number;
    array:ndarray;
    array2:ndarray;
    gl:WebGLRenderingContext;
    color: color_rgba;
    scaleX: number;
    scaleY: number;

    linegroups: lineGroup[];



    /**
     * 
     * @param canv 
     * @param array 
     */
    constructor(canv:HTMLCanvasElement, linegroups: lineGroup[]) {
       
      let devicePixelRatio = window.devicePixelRatio || 1;
 
      // set the size of the drawingBuffer based on the size it's displayed.
      canv.width = canv.clientWidth * devicePixelRatio;
      canv.height = canv.clientHeight * devicePixelRatio;
 
      const gl = <WebGLRenderingContext>canv.getContext("webgl", {
         antialias: true,
         transparent: false
      });

      this.gl = gl;
      this.linegroups = linegroups;
      this.scaleX = 1;
      this.scaleY = 1;
      
 
      linegroups.forEach(lg => {
         lg.num_points = lg.xy.shape[0];
         lg.vbuffer = gl.createBuffer();
         gl.bindBuffer(gl.ARRAY_BUFFER, lg.vbuffer);
         gl.bufferData(gl.ARRAY_BUFFER, <ArrayBuffer>lg.xy, gl.STREAM_DRAW);

         let vertCode = `
         attribute vec2 coordinates;
         uniform mat2 uscale;
         void main(void) {
            gl_Position = vec4(uscale*coordinates, 0.0, 1.0);
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
               gl_FragColor = vec4(${lg.color.r}, ${lg.color.g}, ${lg.color.b}, ${lg.color.a});
            }`;
         

         let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
         gl.shaderSource(fragShader, fragCode);
         gl.compileShader(fragShader);
         lg.prog = gl.createProgram();
         gl.attachShader(lg.prog, vertShader);
         gl.attachShader(lg.prog, fragShader);
         gl.linkProgram(lg.prog);

         gl.bindBuffer(gl.ARRAY_BUFFER, lg.vbuffer);
         
         let coord = gl.getAttribLocation(lg.prog, "coordinates");
         gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
         gl.enableVertexAttribArray(coord);


      });

 
      // Clear the canvas  //??????????????????
      gl.clearColor(0.1, 0.1, 0.1, 1.0);

      // Enable the depth test
      gl.enable(gl.DEPTH_TEST);

      // Clear the color and depth buffer
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Set the view port
      gl.viewport(0,0,canv.width,canv.height);

    }

   /**
   * update
   */
   update() {
      let gl = this.gl;

      this.linegroups.forEach(lg => {
         gl.useProgram(lg.prog);

         let uscale = gl.getUniformLocation(lg.prog, 'uscale');
         gl.uniformMatrix2fv(uscale, false, new Float32Array([this.scaleX,0, 0,this.scaleY]));

         gl.bufferData(gl.ARRAY_BUFFER, <ArrayBuffer>lg.xy.data, gl.STREAM_DRAW);


         gl.drawArrays(gl.LINE_STRIP, 0, lg.num_points);

      });

   }
 }


 