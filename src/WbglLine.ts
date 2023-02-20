import type { ColorRGBA } from "./ColorRGBA";
import type { WebglPlot } from "./webglplot";

export class WebglLine {
  public xy = [] as number[];
  public color: ColorRGBA;

  constructor(xy?: number[], color?: ColorRGBA) {
    if (xy === undefined) {
      xy = [0, 0, 1, 1];
    }
    if (color === undefined) {
      color = { r: 0, g: 0, b: 0, a: 1 };
    }

    this.xy = xy;
    this.color = color;
  }

  public getSize() {
    return this.xy.length / 2;
  }

  public setY(y: number) {
    for (let i = 0; i < this.xy.length; i += 2) {
      this.xy[i + 1] = y;
    }
  }

  public setYs(ys: number[]) {
    for (let i = 0; i < this.xy.length; i += 2) {
      this.xy[i + 1] = ys[i / 2];
    }
  }

  public setXYArray(xy: number[]) {
    this.xy = xy;
  }

  public setX(x: number) {
    for (let i = 0; i < this.xy.length; i += 2) {
      this.xy[i] = x;
    }
  }

  public lineSpaceX(lineSize: number) {
    const n = lineSize;
    this.xy = new Array(n * 2);
    console.log(this.xy);
    for (let i = 0; i < n; i++) {
      this.xy[i * 2] = i / (n - 1);
      this.xy[i * 2 + 1] = 0;
    }
    console.log(this.xy);
  }

  public emptyLine(lineSize: number) {
    const n = lineSize;
    this.xy = new Array(n * 2);
    for (let i = 0; i < n; i++) {
      this.xy[i * 2] = 0;
      this.xy[i * 2 + 1] = 0;
    }
  }

  public setColor(color: ColorRGBA) {
    this.color = color;
  }
}
