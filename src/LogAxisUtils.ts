import { DebugLogger } from "./DebugLogger";

export type DataBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  coordinateSpace: {
    x: "linear" | "log";
    y: "linear" | "log";
  };
};

const BOUNDS_CALCULATION_EPSILON = 1e-9;

/**
 * Validates if a line has sufficient positive data to be meaningful for log axis auto-scaling.
 * 
 * @param points Array of points in [x1,y1,x2,y2,...] format
 * @param logX Whether log X axis is enabled
 * @param logY Whether log Y axis is enabled
 * @returns Object with validation result and statistics
 */
export function validateLineForLogAxes(
  points: Float32Array, 
  logX: boolean, 
  logY: boolean
): { isValid: boolean; validPointCount: number; totalPoints: number; validRatio: number } {
  if (!logX && !logY) {
    const totalPoints = points.length / 2;
    return { isValid: true, validPointCount: totalPoints, totalPoints, validRatio: 1.0 };
  }

  let validPointCount = 0;
  const totalPoints = points.length / 2;

  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];

    const xValid = !logX || x > 0;
    const yValid = !logY || y > 0;

    if (xValid && yValid) {
      validPointCount++;
    }
  }

  const validRatio = validPointCount / totalPoints;
  const isValid = validPointCount >= 2 && validRatio >= 0.1;

  return { isValid, validPointCount, totalPoints, validRatio };
}

/**
 * Calculates data bounds from points array, filtering invalid values for log axes.
 * 
 * @param points Array of points in [x1,y1,x2,y2,...] format
 * @param logX Whether log X axis is enabled
 * @param logY Whether log Y axis is enabled
 * @returns DataBounds object or null if no valid points found
 */
export function calculateLogAwareBounds(
  points: Float32Array,
  logX: boolean,
  logY: boolean
): DataBounds | null {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let foundValidData = false;

  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];

    // Skip invalid values for log axes
    if (logX && x <= 0) continue;
    if (logY && y <= 0) continue;

    foundValidData = true;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  if (!foundValidData || !isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
    return null;
  }

  return { 
    minX, 
    maxX, 
    minY, 
    maxY,
    coordinateSpace: {
      x: logX ? "log" : "linear",
      y: logY ? "log" : "linear",
    },
  };
}

/**
 * Calculates global transform parameters to fit bounds into NDC space [-1, 1].
 * 
 * @param bounds Data bounds to fit
 * @returns Transform parameters [scaleX, scaleY, offsetX, offsetY]
 */
export function calculateAutoScaleTransform(bounds: DataBounds): [number, number, number, number] {
  const { minX, maxX, minY, maxY } = bounds;
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  const ndcWidth = 2.0;
  const ndcHeight = 2.0;

  let scaleX = 1.0;
  let scaleY = 1.0;
  let offsetX = 0.0;
  let offsetY = 0.0;

  // Calculate X scale and offset
  if (rangeX > BOUNDS_CALCULATION_EPSILON) {
    scaleX = ndcWidth / rangeX;
    const centerX = minX + rangeX / 2.0;
    offsetX = 0.0 - centerX * scaleX;
  } else {
    scaleX = 1.0;
    offsetX = 0.0 - minX * scaleX;
  }

  // Calculate Y scale and offset
  if (rangeY > BOUNDS_CALCULATION_EPSILON) {
    scaleY = ndcHeight / rangeY;
    const centerY = minY + rangeY / 2.0;
    offsetY = 0.0 - centerY * scaleY;
  } else {
    scaleY = 1.0;
    offsetY = 0.0 - minY * scaleY;
  }

  return [scaleX, scaleY, offsetX, offsetY];
}

/**
 * Transforms data bounds from linear space to log space.
 * 
 * **Usage**: Convert linear coordinate bounds to logarithmic coordinate bounds.
 * This is used when switching from linear to log axes or when preparing bounds
 * for log-space calculations.
 * 
 * @param bounds Linear space bounds (values in original data units)
 * @param logX Whether to transform X bounds to log₁₀ space
 * @param logY Whether to transform Y bounds to log₁₀ space
 * @returns Log space bounds (log₁₀ values) or null if transformation not possible
 * 
 * @example
 * ```typescript
 * const linearBounds = { minX: 1, maxX: 1000, minY: 0.1, maxY: 100 };
 * const logBounds = transformBoundsToLogSpace(linearBounds, true, true);
 * // Result: { minX: 0, maxX: 3, minY: -1, maxY: 2 }
 * ```
 */
export function transformBoundsToLogSpace(
  bounds: DataBounds,
  logX: boolean,
  logY: boolean
): DataBounds | null {
  const { minX, maxX, minY, maxY } = bounds;

  // Check if transformation is possible
  if (logX && (minX <= 0 || maxX <= 0)) {
    DebugLogger.log("transformBoundsToLogSpace: Cannot transform X bounds - contains non-positive values");
    return null;
  }
  if (logY && (minY <= 0 || maxY <= 0)) {
    DebugLogger.log("transformBoundsToLogSpace: Cannot transform Y bounds - contains non-positive values");
    return null;
  }

  return {
    minX: logX ? Math.log10(minX) : minX,
    maxX: logX ? Math.log10(maxX) : maxX,
    minY: logY ? Math.log10(minY) : minY,
    maxY: logY ? Math.log10(maxY) : maxY,
    coordinateSpace: {
      x: logX ? "log" : bounds.coordinateSpace.x,
      y: logY ? "log" : bounds.coordinateSpace.y,
    },
  };
}

/**
 * Transforms data bounds from log space back to linear space.
 * 
 * **Usage**: Convert logarithmic coordinate bounds back to linear coordinate bounds.
 * This is the inverse operation of transformBoundsToLogSpace() and is used when
 * switching from log back to linear axes while preserving the current view.
 * 
 * @param bounds Log space bounds (log₁₀ values)
 * @param logX Whether X bounds are currently in log₁₀ space and need conversion
 * @param logY Whether Y bounds are currently in log₁₀ space and need conversion
 * @returns Linear space bounds (values in original data units)
 * 
 * @example
 * ```typescript
 * const logBounds = { minX: 0, maxX: 3, minY: -1, maxY: 2 };
 * const linearBounds = transformBoundsToLinearSpace(logBounds, true, true);
 * // Result: { minX: 1, maxX: 1000, minY: 0.1, maxY: 100 }
 * ```
 */
export function transformBoundsToLinearSpace(
  bounds: DataBounds,
  logX: boolean,
  logY: boolean
): DataBounds {
  const { minX, maxX, minY, maxY } = bounds;

  return {
    minX: logX ? Math.pow(10, minX) : minX,
    maxX: logX ? Math.pow(10, maxX) : maxX,
    minY: logY ? Math.pow(10, minY) : minY,
    maxY: logY ? Math.pow(10, maxY) : maxY,
    coordinateSpace: {
      x: logX ? "linear" : bounds.coordinateSpace.x,
      y: logY ? "linear" : bounds.coordinateSpace.y,
    },
  };
}

/**
 * Reverses a global transform to find the data space bounds that correspond to NDC [-1, 1].
 * 
 * @param globalScale Global scale [scaleX, scaleY]
 * @param globalOffset Global offset [offsetX, offsetY]
 * @param logX Whether X axis is in log space
 * @param logY Whether Y axis is in log space
 * @returns Data space bounds that map to NDC [-1, 1] with coordinate space information
 */
export function reverseGlobalTransform(
  globalScale: [number, number],
  globalOffset: [number, number],
  logX: boolean,
  logY: boolean
): DataBounds {
  const [scaleX, scaleY] = globalScale;
  const [offsetX, offsetY] = globalOffset;

  // Reverse the transform: data = (ndc - offset) / scale
  const minX = (-1 - offsetX) / scaleX;
  const maxX = (1 - offsetX) / scaleX;
  const minY = (-1 - offsetY) / scaleY;
  const maxY = (1 - offsetY) / scaleY;

  return { 
    minX, 
    maxX, 
    minY, 
    maxY,
    coordinateSpace: {
      x: logX ? "log" : "linear",
      y: logY ? "log" : "linear",
    },
  };
}