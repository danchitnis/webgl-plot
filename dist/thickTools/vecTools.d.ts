/**
 * modified functions from:
 * https://github.com/stackgl/gl-vec2
 * See License2.md for more info
 */
export declare type Vec2 = {
    x: number;
    y: number;
};
export declare const scaleAndAdd: (a: Vec2, b: Vec2, scale: number) => Vec2;
export declare const normal: (dir: Vec2) => Vec2;
export declare const direction: (a: Vec2, b: Vec2) => Vec2;
/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
export declare const add: (a: Vec2, b: Vec2) => Vec2;
/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
export declare const dot: (a: Vec2, b: Vec2) => number;
/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
export declare const normalize: (a: Vec2) => Vec2;
/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
export declare const set: (x: number, y: number) => Vec2;
/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
export declare const subtract: (a: Vec2, b: Vec2) => Vec2;
//# sourceMappingURL=vecTools.d.ts.map