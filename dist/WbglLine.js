import { ColorRGBA } from "./ColorRGBA";
export class WebglLine {
    xy = [];
    color;
    constructor(xy, color) {
        if (xy === undefined) {
            xy = [0, 0, 1, 1];
        }
        if (color === undefined) {
            color = new ColorRGBA(1, 1, 1, 1);
        }
        this.xy = xy;
        this.color = color;
    }
    getSize() {
        return this.xy.length / 2;
    }
    setY(y) {
        for (let i = 0; i < this.xy.length; i += 2) {
            this.xy[i + 1] = y;
        }
    }
    setYs(ys) {
        if (ys.length == this.xy.length / 2) {
            for (let i = 0; i < this.xy.length; i += 2) {
                this.xy[i + 1] = ys[i / 2];
            }
        }
        else {
            throw new Error("mismatch in array length");
        }
    }
    setXYArray(xy) {
        this.xy = xy;
    }
    setX(x) {
        for (let i = 0; i < this.xy.length; i += 2) {
            this.xy[i] = x;
        }
    }
    lineSpaceX(lineSize) {
        const n = lineSize;
        this.xy = new Array(n * 2);
        console.log(this.xy);
        for (let i = 0; i < n; i++) {
            this.xy[i * 2] = (2 * i) / n - 1;
            this.xy[i * 2 + 1] = 0;
        }
        console.log(this.xy);
    }
    emptyLine(lineSize) {
        const n = lineSize;
        this.xy = new Array(n * 2);
        for (let i = 0; i < n; i++) {
            this.xy[i * 2] = 0;
            this.xy[i * 2 + 1] = 0;
        }
    }
    setColor(color) {
        this.color = color;
    }
}
//# sourceMappingURL=WbglLine.js.map