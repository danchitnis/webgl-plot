import {ColorRGBA} from "./ColorRGBA";

export class WebglBaseLine {

    public vbuffer: WebGLBuffer;
    public prog: WebGLProgram;

    public webglNumPoints: number;

    public intensity: number;
    public visible: boolean;
    public coord: number;

    public numPoints: number;
    public xy: Float32Array;
    public color: ColorRGBA;

    public scaleX: number;
    public scaleY: number;
    public offsetX: number;
    public offsetY: number;

    public loop: boolean;

    constructor() {
        this.scaleX = 1;
        this.scaleY = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        this.loop = false;
    }

}