import {ColorRGBA} from "./ColorRGBA";

export class WebglBaseLine {

    public vbuffer: WebGLBuffer;
    public prog: WebGLProgram;

    public webglNumPoints: number;

    public intenisty: number;
    public visible: boolean;
    public coord: number;

    public numPoints: number;
    public xy: Float32Array;
    public color: ColorRGBA;

}