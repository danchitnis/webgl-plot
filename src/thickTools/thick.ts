/**
 * inspired and modified from:
 * https://github.com/mattdesl/polyline-normals
 * See License1.md for more info
 */

import { Vec2, add, normal, direction, normalize, set, dot } from "./vecTools.js";

export type NormalMiter = {
  vec2: Vec2;
  miterLength: number;
};

export const PolyLine = (lineXY: Float32Array): NormalMiter[] => {
  let curNormal: Vec2;
  let lineA = { x: 0, y: 0 } as Vec2;
  let lineB = { x: 0, y: 0 } as Vec2;
  const out = [] as NormalMiter[];

  const addNext = (normal: Vec2, length: number) => {
    out.push({ vec2: normal, miterLength: length } as NormalMiter);
  };

  const getXY = (index: number): Vec2 => {
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

const computeMiter = (lineA: Vec2, lineB: Vec2): Vec2 => {
  //get tangent line
  let tangent = add(lineA, lineB);
  tangent = normalize(tangent);

  //get miter as a unit vector
  const miter = set(-tangent.y, tangent.x);

  return miter;
};

const computeMiterLen = (lineA: Vec2, miter: Vec2, halfThick: number): number => {
  const tmp = set(-lineA.y, lineA.x);
  //get the necessary length of our miter
  return halfThick / dot(miter, tmp);
};
