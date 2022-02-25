import type { ColorRGBA } from "./ColorRGBA";
import { WebglBase } from "./WebglBase";

export class WebglPolar extends WebglBase {
  public numPoints: number;
  public xy: Float32Array;
  public color: ColorRGBA;
  public intenisty: number;
  public visible: boolean;
  public offsetTheta: number;

  constructor(c: ColorRGBA, numPoints: number) {
    super();
    this.webglNumPoints = numPoints;
    this.numPoints = numPoints;
    this.color = c;
    this.intenisty = 1;
    this.xy = new Float32Array(2 * this.webglNumPoints);
    this._vbuffer = 0;
    this._coord = 0;
    this.visible = true;

    this.offsetTheta = 0;
  }
  /**
   * @param index: index of the line
   * @param theta : angle in deg
   * @param r : radius
   */
  public setRtheta(index: number, theta: number, r: number): void {
    //const rA = Math.abs(r);
    //const thetaA = theta % 360;
    const x = r * Math.cos((2 * Math.PI * (theta + this.offsetTheta)) / 360);
    const y = r * Math.sin((2 * Math.PI * (theta + this.offsetTheta)) / 360);
    //const index = Math.round( ((theta % 360)/360) * this.numPoints );
    this.setX(index, x);
    this.setY(index, y);
  }

  public getTheta(index: number): number {
    //return Math.tan
    return 0;
  }

  public getR(index: number): number {
    //return Math.tan
    return Math.sqrt(Math.pow(this.getX(index), 2) + Math.pow(this.getY(index), 2));
  }

  private setX(index: number, x: number): void {
    this.xy[index * 2] = x;
  }

  private setY(index: number, y: number): void {
    this.xy[index * 2 + 1] = y;
  }

  public getX(index: number): number {
    return this.xy[index * 2];
  }

  public getY(index: number): number {
    return this.xy[index * 2 + 1];
  }

  /*public linespaceTheta(start: number, stepsize: number): void {
      for (let i = 0; i < this.numPoints; i++) {
         // set x to -num/2:1:+num/2
         this.setX(i, start + stepsize * i);  //???????????
      }
   }*/

  /*public constR(c: number): void {
      for (let i = 0; i < this.numPoints; i++) {
         // set x to -num/2:1:+num/2
         this.setRtheta(i, i*this.thetaSteps, c);
      }
   }*/

  /*public shiftAdd(data: Float32Array): void {
      const shiftSize = data.length;

      for (let i = 0; i < this.numPoints - shiftSize; i++) {
         this.setY(i, this.getY(i + shiftSize));
      }

      for (let i = 0; i < shiftSize; i++) {
         this.setY(i + this.numPoints - shiftSize, data[i]);
      }

   }*/
}
