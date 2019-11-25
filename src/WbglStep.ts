
import {ColorRGBA} from "./ColorRGBA";
import {WebglBaseLine} from "./WebglBaseLine";

export class WebglStep extends WebglBaseLine {




   constructor(c: ColorRGBA, num: number) {
      super();
      this.webglNumPoints = num * 2;
      this.numPoints = num;
      this.color = c;
      this.intenisty = 1;
      this.xy = new Float32Array(2 * this.webglNumPoints);
      this.vbuffer = 0;
      this.prog = 0;
      this.coord = 0;
      this.visible = true;
   }


   public setY(index: number, y: number) {
      this.xy[index * 4 + 1] = y;
      this.xy[index * 4 + 3] = y;
   }

   public getX(index: number): number {
      return this.xy[index * 4];
   }

   public getY(index: number): number {
      return this.xy[index * 4 + 1];
   }

   public linespaceX() {
      for (let i = 0; i < this.numPoints; i++) {
         // set x to -num/2:1:+num/2
         this.xy[i * 4] = 2 * (i / this.numPoints) - 1;
         this.xy[i * 4 + 2] = 2 * ((i+1) / this.numPoints) - 1;
      }
   }

   public constY(c: number) {
      for (let i = 0; i < this.numPoints; i++) {
         // set x to -num/2:1:+num/2
         this.setY(i, c);
      }
   }

   public shift_add(data: Float32Array) {
      let shift_size = data.length;

      for (let i = 0; i < this.numPoints - shift_size; i++) {
         this.setY(i, this.getY(i + shift_size));
      }

      for (let i = 0; i < shift_size; i++) {
         this.setY(i + this.numPoints - shift_size, data[i]);
      }

   }


   




 }
