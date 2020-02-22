
import {ColorRGBA} from "./ColorRGBA";
import {WebglBaseLine} from "./WebglBaseLine";

export class WebglStep extends WebglBaseLine {




   constructor(c: ColorRGBA, num: number) {
      super();
      this.webglNumPoints = num * 2;
      this.numPoints = num;
      this.color = c;
      this.intensity = 1;
      this.xy = new Float32Array(2 * this.webglNumPoints);
      this.vbuffer = 0;
      this.prog = 0;
      this.coord = 0;
      this.visible = true;
   }


   public setY(index: number, y: number): void {
      this.xy[index * 4 + 1] = y;
      this.xy[index * 4 + 3] = y;
   }

   public getX(index: number): number {
      return this.xy[index * 4];
   }

   public getY(index: number): number {
      return this.xy[index * 4 + 1];
   }

   public linespaceX(start: number, stepsize: number): void {
      for (let i = 0; i < this.numPoints; i++) {
         // set x to -num/2:1:+num/2
         this.xy[i * 4] = start + (i *  stepsize);
         this.xy[i * 4 + 2] = start +  (i * stepsize + stepsize);
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
