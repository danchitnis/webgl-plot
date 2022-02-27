/**
 * inspired and modified from:
 * https://github.com/mattdesl/polyline-normals
 * See License1.md for more info
 */
import { Vec2 } from "./vecTools.js";
export declare type NormalMiter = {
    vec2: Vec2;
    miterLength: number;
};
export declare const PolyLine: (lineXY: Float32Array) => NormalMiter[];
//# sourceMappingURL=thick.d.ts.map