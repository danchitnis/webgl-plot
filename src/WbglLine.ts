
import {ColorRGBA} from "./ColorRGBA";
import {WebglBaseLine} from "./WebglBaseLine";

export class WebglLine extends WebglBaseLine {

   public numPoints: number;
   public xy: Float32Array;
   public color: ColorRGBA;
   public intenisty: number;
   public visible: boolean;
   public coord: number;



   constructor(c: ColorRGBA, numPoints: number) {
      super();
      this.webglNumPoints = numPoints;
      this.numPoints = numPoints;
      this.color = c;
      this.intenisty = 1;
      this.xy = new Float32Array(2 * this.webglNumPoints);
      this.vbuffer = 0;
      this.prog = 0;
      this.coord = 0;
      this.visible = true;
   }

   public setX(index: number, x: number) {
      this.xy[index * 2] = x;
   }

   public setY(index: number, y: number) {
      this.xy[index * 2 + 1] = y;
   }

   public getX(index: number): number {
      return this.xy[index * 2];
   }

   public getY(index: number): number {
      return this.xy[index * 2 + 1];
   }

   public linespaceX(start: number, stepsize: number) {
      for (let i = 0; i < this.numPoints; i++) {
         // set x to -num/2:1:+num/2
         this.setX(i, start + stepsize * i);
      }
   }

   public constY(c: number) {
      for (let i = 0; i < this.numPoints; i++) {
         // set x to -num/2:1:+num/2
         this.setY(i, c);
      }
   }

   public shift_add(data: Float32Array) {
      const shiftSize = data.length;

      for (let i = 0; i < this.numPoints - shiftSize; i++) {
         this.setY(i, this.getY(i + shiftSize));
      }

      for (let i = 0; i < shiftSize; i++) {
         this.setY(i + this.numPoints - shiftSize, data[i]);
      }

   }



 }
