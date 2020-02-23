
import {ColorRGBA} from "./ColorRGBA";
import {WebglBaseLine} from "./WebglBaseLine";

export class WebglLine extends WebglBaseLine {

   //public numPoints: number;
   //public xy: Float32Array;
   //public color: ColorRGBA;
   //public intenisty: number;
   //public visible: boolean;
   //public coord: number;


   /**
    * Create a new line
    * @param c :the color of the line
    * @param numPoints : number of data pints
    * @example 
    * ```typescript
    * x= [0,1]
    * y= [1,2]
    * line = new WebglLine( new ColorRGBA(0.1,0.1,0.1,1), 2);
    * ```
    */
   constructor(c: ColorRGBA, numPoints: number) {
      super();
      this.webglNumPoints = numPoints;
      this.numPoints = numPoints;
      this.color = c;
      this.intensity = 1;
      this.xy = new Float32Array(2 * this.webglNumPoints);
      this.vbuffer = 0;
      this.prog = 0;
      this.coord = 0;
      this.visible = true;
      
   }

   /**
    * 
    * @param index : the index of the data point 
    * @param x : the horizontal value of the data point
    */
   public setX(index: number, x: number): void {
      this.xy[index * 2] = x;
   }

   /**
    * 
    * @param index : the index of the data point 
    * @param y : the vertical value of the data point
    */
   public setY(index: number, y: number): void {
      this.xy[index * 2 + 1] = y;
   }

   public getX(index: number): number {
      return this.xy[index * 2];
   }

   public getY(index: number): number {
      return this.xy[index * 2 + 1];
   }

   public linespaceX(start: number, stepsize: number): void {
      for (let i = 0; i < this.numPoints; i++) {
         // set x to -num/2:1:+num/2
         this.setX(i, start + stepsize * i);
      }
   }

   public constY(c: number): void {
      for (let i = 0; i < this.numPoints; i++) {
         // set x to -num/2:1:+num/2
         this.setY(i, c);
      }
   }

   public shiftAdd(data: Float32Array): void {
      const shiftSize = data.length;

      for (let i = 0; i < this.numPoints - shiftSize; i++) {
         this.setY(i, this.getY(i + shiftSize));
      }

      for (let i = 0; i < shiftSize; i++) {
         this.setY(i + this.numPoints - shiftSize, data[i]);
      }

   }



 }
