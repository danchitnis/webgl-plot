import { WebglBaseLine } from "./WebglBaseLine";
export class WebglLine extends WebglBaseLine {
    constructor(c, numPoints) {
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
    setX(index, x) {
        this.xy[index * 2] = x;
    }
    setY(index, y) {
        this.xy[index * 2 + 1] = y;
    }
    getX(index) {
        return this.xy[index * 2];
    }
    getY(index) {
        return this.xy[index * 2 + 1];
    }
    linespaceX(start, stepsize) {
        for (let i = 0; i < this.numPoints; i++) {
            // set x to -num/2:1:+num/2
            this.setX(i, start + stepsize * i);
        }
    }
    constY(c) {
        for (let i = 0; i < this.numPoints; i++) {
            // set x to -num/2:1:+num/2
            this.setY(i, c);
        }
    }
    shiftAdd(data) {
        const shiftSize = data.length;
        for (let i = 0; i < this.numPoints - shiftSize; i++) {
            this.setY(i, this.getY(i + shiftSize));
        }
        for (let i = 0; i < shiftSize; i++) {
            this.setY(i + this.numPoints - shiftSize, data[i]);
        }
    }
}
//# sourceMappingURL=WbglLine.js.map