/**
 *
 */

import { Vec2, add, normal, direction, normalize, set, dot } from "./vecTools.js";

export type NormalMiter = {
  vec2: Vec2;
  miterLength: number;
};

export const PolyLine = (linePoints: Vec2[]): NormalMiter[] => {
  let curNormal: Vec2;
  let lineA = { x: 0, y: 0 } as Vec2;
  let lineB = { x: 0, y: 0 } as Vec2;
  const out = [] as NormalMiter[];

  const addNext = (normal: Vec2, length: number) => {
    out.push({ vec2: normal, miterLength: length } as NormalMiter);
  };

  // add initial normals
  lineA = direction(linePoints[1], linePoints[0]);
  curNormal = normal(lineA);
  addNext(curNormal, 1);

  for (let i = 1; i < linePoints.length - 1; i++) {
    const last = linePoints[i - 1];
    const cur = linePoints[i];
    const next = linePoints[i + 1];

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
  lineA = direction(linePoints[linePoints.length - 1], linePoints[linePoints.length - 2]);
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
