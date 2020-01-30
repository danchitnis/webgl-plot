/**
 * Author Danial Chitnis 2019
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */

import {ColorRGBA} from "./ColorRGBA";
import {WebglLine} from "./WbglLine";
import {WebglStep} from "./WbglStep";
import {WebglBaseLine} from "./WebglBaseLine";

export {WebglLine, ColorRGBA, WebglStep};



/**
 * The main class for Webgl-plot
 */
export class WebGLplot {

   private webgl: WebGLRenderingContext;
   
   /** Global X scale */
   public gScaleX: number; 
   
   /** Global Y scale */
   public gScaleY: number; 

   public gOffsetX: number;
   public gOffsetY: number;

   public lines: WebglBaseLine[];
   public backgroundColor: ColorRGBA;



   /**
    * The constructor when calling WebGLplot
    * @param canv - The canvas which the plot is displayed
    * @param backgroundColor - The background color for the plotting area
    * @returns
    * 
    * @example
    * ```ts
    * const wglp = new WebGlplot( myCanv, new ColorRGBA(0.1,0.1,0.1,1) );
    */
   constructor(canv: HTMLCanvasElement, backgroundColor: ColorRGBA) {

      const devicePixelRatio = window.devicePixelRatio || 1;

      // set the size of the drawingBuffer based on the size it's displayed.
      canv.width = canv.clientWidth * devicePixelRatio;
      canv.height = canv.clientHeight * devicePixelRatio;

      const webgl =  canv.getContext("webgl", {
         antialias: true,
         transparent: false,
      }) as WebGLRenderingContext;

      this.lines = [];

      this.webgl = webgl;

      this.gScaleX = 1;
      this.gScaleY = 1;
      this.gOffsetX = 0;
      this.gOffsetY = 0;

      this.backgroundColor = backgroundColor;



      // Clear the canvas
      webgl.clearColor(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b, this.backgroundColor.a);

      // Enable the depth test
      webgl.enable(webgl.DEPTH_TEST);

      // Clear the color and depth buffer
      webgl.clear(webgl.COLOR_BUFFER_BIT || webgl.DEPTH_BUFFER_BIT);

      // Set the view port
      webgl.viewport(0, 0, canv.width, canv.height);

   }


   public update(): void {
      const webgl = this.webgl;

      this.lines.forEach((line) => {
         if (line.visible) {
            webgl.useProgram(line.prog);

            const uscale = webgl.getUniformLocation(line.prog, "uscale");
            webgl.uniformMatrix2fv(uscale, false, new Float32Array([line.scaleX * this.gScaleX, 0, 0, line.scaleY * this.gScaleY]));

            const uoffset = webgl.getUniformLocation(line.prog, "uoffset");
            webgl.uniform2fv(uoffset, new Float32Array([line.offsetX + this.gOffsetX, line.offsetY + this.gOffsetY]));

            const uColor = webgl.getUniformLocation(line.prog, "uColor");
            webgl.uniform4fv(uColor, [line.color.r, line.color.g, line.color.b, line.color.a]);

            webgl.bufferData(webgl.ARRAY_BUFFER, line.xy as ArrayBuffer, webgl.STREAM_DRAW);

            webgl.drawArrays(webgl.LINE_STRIP, 0, line.webglNumPoints);
         }

      });

   }

   public clear(): void {
      // Clear the canvas  //??????????????????
      this.webgl.clearColor(0.1, 0.1, 0.1, 1.0);
      this.webgl.clear(this.webgl.COLOR_BUFFER_BIT || this.webgl.DEPTH_BUFFER_BIT);
   }

   public addLine(line: WebglBaseLine): void {

      line.vbuffer = ( this.webgl.createBuffer() as WebGLBuffer);
      this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line.vbuffer);
      this.webgl.bufferData(this.webgl.ARRAY_BUFFER,  line.xy as ArrayBuffer, this.webgl.STREAM_DRAW);

      const vertCode = `
      attribute vec2 coordinates;
      uniform mat2 uscale;
      uniform vec2 uoffset;

      void main(void) {
         gl_Position = vec4(uscale*coordinates + uoffset, 0.0, 1.0);
      }`;

      // Create a vertex shader object
      const vertShader = this.webgl.createShader(this.webgl.VERTEX_SHADER);

      // Attach vertex shader source code
      this.webgl.shaderSource( vertShader as WebGLShader, vertCode);

      // Compile the vertex shader
      this.webgl.compileShader( vertShader as WebGLShader);

      // Fragment shader source code
      const fragCode = `
         precision mediump float;
         uniform highp vec4 uColor;
         void main(void) {
            gl_FragColor =  uColor;
         }`;


      const fragShader = this.webgl.createShader(this.webgl.FRAGMENT_SHADER);
      this.webgl.shaderSource( fragShader as WebGLShader, fragCode);
      this.webgl.compileShader( fragShader as WebGLShader);
      line.prog = ( this.webgl.createProgram() as WebGLProgram);
      this.webgl.attachShader(line.prog,  vertShader as WebGLShader);
      this.webgl.attachShader(line.prog,  fragShader as WebGLShader);
      this.webgl.linkProgram(line.prog);

      this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line.vbuffer);

      line.coord = this.webgl.getAttribLocation(line.prog, "coordinates");
      this.webgl.vertexAttribPointer(line.coord, 2, this.webgl.FLOAT, false, 0, 0);
      this.webgl.enableVertexAttribArray(line.coord);

      this.lines.push(line);
   }

   public viewport(a: number, b: number, c: number, d: number): void {
      this.webgl.viewport(a, b, c, d);
   }



}
