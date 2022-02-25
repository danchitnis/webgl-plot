import type { ColorRGBA } from "./ColorRGBA";
import { WebglBase } from "./WebglBase";

/**
 * The step based line plot
 */
export class WebglStep extends WebglBase {
  /**
   * Create a new step line
   * @param c - the color of the line
   * @param numPoints - number of data pints
   * @example
   * ```typescript
   * x= [0,1]
   * y= [1,2]
   * line = new WebglStep( new ColorRGBA(0.1,0.1,0.1,1), 2);
   * ```
   */
  constructor(c: ColorRGBA, num: number) {
    super();
    this.webglNumPoints = num * 2;
    this.numPoints = num;
    this.color = c;

    this.xy = new Float32Array(2 * this.webglNumPoints);
  }

  /**
   * Set the Y value at a specific index
   * @param index - the index of the data point
   * @param y - the vertical value of the data point
   */
  public setY(index: number, y: number): void {
    this.xy[index * 4 + 1] = y;
    this.xy[index * 4 + 3] = y;
  }

  public getX(index: number): number {
    return this.xy[index * 4];
  }

  /**
   * Get an X value at a specific index
   * @param index - the index of X
   */
  public getY(index: number): number {
    return this.xy[index * 4 + 1];
  }

  /**
   * Make an equally spaced array of X points
   * @param start  - the start of the series
   * @param stepSize - step size between each data point
   *
   * @example
   * ```typescript
   * //x = [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8]
   * const numX = 10;
   * line.lineSpaceX(-1, 2 / numX);
   * ```
   */
  public lineSpaceX(start: number, stepsize: number): void {
    for (let i = 0; i < this.numPoints; i++) {
      // set x to -num/2:1:+num/2
      this.xy[i * 4] = start + i * stepsize;
      this.xy[i * 4 + 2] = start + (i * stepsize + stepsize);
    }
  }

  /**
   * Set a constant value for all Y values in the line
   * @param c - constant value
   */
  public constY(c: number): void {
    for (let i = 0; i < this.numPoints; i++) {
      // set x to -num/2:1:+num/2
      this.setY(i, c);
    }
  }

  /**
   * Add a new Y values to the end of current array and shift it, so that the total number of the pair remains the same
   * @param data - the Y array
   *
   * @example
   * ```typescript
   * yArray = new Float32Array([3, 4, 5]);
   * line.shiftAdd(yArray);
   * ```
   */
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
