/**
 * modified functions from:
 * https://github.com/stackgl/gl-vec2
 * See License2.md for more info
 */

export type Vec2 = {
  x: number;
  y: number;
};

export const scaleAndAdd = (a: Vec2, b: Vec2, scale: number): Vec2 => {
  const out = { x: 0, y: 0 } as Vec2;
  out.x = a.x + b.x * scale;
  out.y = a.y + b.y * scale;
  return out;
};

export const normal = (dir: Vec2): Vec2 => {
  //get perpendicular
  const out = set(-dir.y, dir.x);
  return out;
};

export const direction = (a: Vec2, b: Vec2): Vec2 => {
  //get unit dir of two lines
  let out = subtract(a, b);
  out = normalize(out);
  return out;
};

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
export const add = (a: Vec2, b: Vec2): Vec2 => {
  const out = { x: 0, y: 0 } as Vec2;
  out.x = a.x + b.x;
  out.y = a.y + b.y;
  return out;
};

/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
export const dot = (a: Vec2, b: Vec2): number => {
  return a.x * b.x + a.y * b.y;
};

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
export const normalize = (a: Vec2): Vec2 => {
  const out = { x: 0, y: 0 } as Vec2;
  let len = a.x * a.x + a.y * a.y;
  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
    out.x = a.x * len;
    out.y = a.y * len;
  }
  return out;
};

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
export const set = (x: number, y: number): Vec2 => {
  const out = { x: 0, y: 0 } as Vec2;
  out.x = x;
  out.y = y;
  return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
export const subtract = (a: Vec2, b: Vec2): Vec2 => {
  const out = { x: 0, y: 0 } as Vec2;
  out.x = a.x - b.x;
  out.y = a.y - b.y;
  return out;
};
