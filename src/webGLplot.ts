/**
 * Author Danial Chitnis 2019
 * 
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */

import * as ndarray from "ndarray";


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
   intenisty: number;
   vbuffer: WebGLBuffer;
   prog: WebGLProgram;
   coord: number;
   visible: boolean;

   private _present_color: color_rgba;

   constructor(c: color_rgba, num:number) {
      this.num_points = num;
      this.color = c;
      this.intenisty = 1;
      this.xy = ndarray(new Float32Array(this.num_points*2), [this.num_points, 2]);
      this.vbuffer = 0;
      this.prog = 0;
      this.coord = 0;
      this.visible = true;
   }
   
   linespaceX() {
      for (let i=0; i<this.num_points; i++) {
         //set x to -num/2:1:+num/2
         this.xy.set(i, 0, 2*i/this.num_points-1);
       }
   }

   constY(c:number) {
      for (let i=0; i<this.num_points; i++) {
         //set x to -num/2:1:+num/2
         this.xy.set(i, 1, c);
       }
   }


   present_color():color_rgba {
      return this.color;
   }
}


export class webGLplot {

    gl:WebGLRenderingContext;

    scaleX: number;
    scaleY: number;

    linegroups: lineGroup[];



    /**
     * 
     * @param canv 
     * @param array 
     */
    constructor(canv:HTMLCanvasElement) {
       
      let devicePixelRatio = window.devicePixelRatio || 1;
 
      // set the size of the drawingBuffer based on the size it's displayed.
      canv.width = canv.clientWidth * devicePixelRatio;
      canv.height = canv.clientHeight * devicePixelRatio;
 
      const gl = <WebGLRenderingContext>canv.getContext("webgl", {
         antialias: true,
         transparent: false
      });

      this.linegroups = [];

      this.gl = gl;

      this.scaleX = 1;
      this.scaleY = 1;
      
 
 
      // Clear the canvas  //??????????????????
      //gl.clearColor(0.1, 0.1, 0.1, 1.0);
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
         if (lg.visible) {
            gl.useProgram(lg.prog);

            let uscale = gl.getUniformLocation(lg.prog, 'uscale');
            gl.uniformMatrix2fv(uscale, false, new Float32Array([this.scaleX,0, 0,this.scaleY]));

            let uColor = gl.getUniformLocation(lg.prog,'uColor');
            gl.uniform4fv(uColor, [lg.present_color().r, lg.present_color().g, lg.present_color().b, lg.present_color().a]);

            gl.bufferData(gl.ARRAY_BUFFER, <ArrayBuffer>lg.xy.data, gl.STREAM_DRAW);

            gl.drawArrays(gl.LINE_STRIP, 0, lg.num_points);
         }
         
      });

   }

   clear() {
      // Clear the canvas  //??????????????????
      this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
   }

   add_line(line:lineGroup) {
      

      line.num_points = line.xy.shape[0];
      line.vbuffer = <WebGLBuffer>this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, line.vbuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, <ArrayBuffer>line.xy.data, this.gl.STREAM_DRAW);

      let vertCode = `
      attribute vec2 coordinates;
      uniform mat2 uscale;
      void main(void) {
         gl_Position = vec4(uscale*coordinates, 0.0, 1.0);
      }`;

      // Create a vertex shader object
      let vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);

      // Attach vertex shader source code
      this.gl.shaderSource(<WebGLShader>vertShader, vertCode);

      // Compile the vertex shader
      this.gl.compileShader(<WebGLShader>vertShader);

      // Fragment shader source code
      let fragCode = `
         precision mediump float;
         uniform highp vec4 uColor;
         void main(void) {
            gl_FragColor =  uColor;
         }`;
      

      let fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
      this.gl.shaderSource(<WebGLShader>fragShader, fragCode);
      this.gl.compileShader(<WebGLShader>fragShader);
      line.prog = <WebGLProgram>this.gl.createProgram();
      this.gl.attachShader(line.prog, <WebGLShader>vertShader);
      this.gl.attachShader(line.prog, <WebGLShader>fragShader);
      this.gl.linkProgram(line.prog);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, line.vbuffer);
      
      line.coord = this.gl.getAttribLocation(line.prog, "coordinates");
      this.gl.vertexAttribPointer(line.coord, 2, this.gl.FLOAT, false, 0, 0);
      this.gl.enableVertexAttribArray(line.coord);

      this.linegroups.push(line);
   }



 }


 