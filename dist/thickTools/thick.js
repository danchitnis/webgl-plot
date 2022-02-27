/**
 * inspired and modified from:
 * https://github.com/mattdesl/polyline-normals
 * See License1.md for more info
 */
import { add, normal, direction, normalize, set, dot } from "./vecTools.js";
export const PolyLine = (lineXY) => {
    let curNormal;
    let lineA = { x: 0, y: 0 };
    let lineB = { x: 0, y: 0 };
    const out = [];
    const addNext = (normal, length) => {
        out.push({ vec2: normal, miterLength: length });
    };
    const getXY = (index) => {
        return { x: lineXY[index * 2], y: lineXY[index * 2 + 1] };
    };
    // add initial normals
    lineA = direction(getXY(1), getXY(0));
    curNormal = normal(lineA);
    addNext(curNormal, 1);
    const numPoints = lineXY.length / 2;
    for (let i = 1; i < numPoints - 1; i++) {
        const last = getXY(i - 1);
        const cur = getXY(i);
        const next = getXY(i + 1);
        lineA = direction(cur, last);
        curNormal = normal(lineA);
        lineB = direction(next, cur);
        //stores tangent & miter
        const miter = computeMiter(lineA, lineB);
        const miterLen = computeMiterLen(lineA, miter, 1);
        addNext(miter, miterLen);
    }
    // add last normal
    // no miter, simple segment
    lineA = direction(getXY(numPoints - 1), getXY(numPoints - 2));
    curNormal = normal(lineA); //reset normal
    addNext(curNormal, 1);
    return out;
};
const computeMiter = (lineA, lineB) => {
    //get tangent line
    let tangent = add(lineA, lineB);
    tangent = normalize(tangent);
    //get miter as a unit vector
    const miter = set(-tangent.y, tangent.x);
    return miter;
};
const computeMiterLen = (lineA, miter, halfThick) => {
    const tmp = set(-lineA.y, lineA.x);
    //get the necessary length of our miter
    return halfThick / dot(miter, tmp);
};
//# sourceMappingURL=thick.js.map