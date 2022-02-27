import { PolyLine } from "./thickTools/thick";
import { scaleAndAdd } from "./thickTools/vecTools";
import { WebglBase } from "./WebglBase";
/**
 * The standard Line class
 */
export class WebglThickLine extends WebglBase {
    /**
     * Create a new line
     * @param c - the color of the line
     * @param numPoints - number of data pints
     * @example
     * ```typescript
     * x= [0,1]
     * y= [1,2]
     * line = new WebglLine( new ColorRGBA(0.1,0.1,0.1,1), 2);
     * ```
     */
    constructor(c, numPoints, thickness) {
        super();
        this.currentIndex = 0;
        this._thicknessRequested = 0;
        this._actualThickness = 0;
        this.webglNumPoints = numPoints * 2;
        this.numPoints = numPoints;
        this.color = c;
        this._thicknessRequested = thickness;
        this._linePoints = new Float32Array(numPoints * 2);
        //this.triPoints = new Float32Array(this.numPoints * 4);
        this.xy = new Float32Array(2 * this.webglNumPoints);
    }
    convertToTriPoints() {
        //const thick = 0.01;
        const halfThick = this._actualThickness / 2;
        const normals = PolyLine(this._linePoints);
        //console.log(this.linePoints);
        //console.log(normals);
        for (let i = 0; i < this.numPoints; i++) {
            const x = this._linePoints[2 * i];
            const y = this._linePoints[2 * i + 1];
            const point = { x: x, y: y };
            const top = scaleAndAdd(point, normals[i].vec2, normals[i].miterLength * halfThick);
            const bot = scaleAndAdd(point, normals[i].vec2, -normals[i].miterLength * halfThick);
            this.xy[i * 4] = top.x;
            this.xy[i * 4 + 1] = top.y;
            this.xy[i * 4 + 2] = bot.x;
            this.xy[i * 4 + 3] = bot.y;
        }
    }
    /**
     * Set the X value at a specific index
     * @param index - the index of the data point
     * @param x - the horizontal value of the data point
     */
    setX(index, x) {
        this._linePoints[index * 2] = x;
    }
    /**
     * Set the Y value at a specific index
     * @param index : the index of the data point
     * @param y : the vertical value of the data point
     */
    setY(index, y) {
        this._linePoints[index * 2 + 1] = y;
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
    lineSpaceX(start, stepSize) {
        for (let i = 0; i < this.numPoints; i++) {
            // set x to -num/2:1:+num/2
            this.setX(i, start + stepSize * i);
        }
    }
    setThickness(thickness) {
        this._thicknessRequested = thickness;
    }
    getThickness() {
        return this._thicknessRequested;
    }
    setActualThickness(thickness) {
        this._actualThickness = thickness;
    }
}
//# sourceMappingURL=WbglThickLine.js.map