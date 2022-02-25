import { WebglBase } from "./WebglBase";
export class WebglPolar extends WebglBase {
    constructor(c, numPoints) {
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
    setRtheta(index, theta, r) {
        //const rA = Math.abs(r);
        //const thetaA = theta % 360;
        const x = r * Math.cos((2 * Math.PI * (theta + this.offsetTheta)) / 360);
        const y = r * Math.sin((2 * Math.PI * (theta + this.offsetTheta)) / 360);
        //const index = Math.round( ((theta % 360)/360) * this.numPoints );
        this.setX(index, x);
        this.setY(index, y);
    }
    getTheta(index) {
        //return Math.tan
        return 0;
    }
    getR(index) {
        //return Math.tan
        return Math.sqrt(Math.pow(this.getX(index), 2) + Math.pow(this.getY(index), 2));
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
}
//# sourceMappingURL=WbglPolar.js.map