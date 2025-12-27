
/*****************
 * The shaders in the file are WebglLneThick.ts
 * They are used for rendering thick lines in WebGL.
 * 
 * ZOOM THICKNESS ISSUE NOTES:
 * - Problem: Line thickness changes during zoom operations (X-only zoom especially problematic)
 * - Root cause: Thickness offset calculations need to be independent of global scale transforms
 * - Current approach: Calculate thickness in screen space after considering global scale impact on normals
 * - Key insight: Transform normals by global scale, then apply constant screen-space thickness
 * - Apply thickness offset AFTER global transform to maintain constant pixel thickness
 * 
 * Changes made:
 * 1. calculateThicknessOffset() now takes globalScale parameter
 * 2. Normal vectors are transformed by globalScale before thickness calculation
 * 3. Thickness offset applied after global transform (not before)
 * 4. This ensures visual thickness remains constant regardless of zoom level
 ******************/

// --- Shader Source Code ---
export const VERTEX_SHADER_SOURCE = (maxLines: number) => `#version 300 es
precision highp float;
precision highp int;
#define MAX_LINES ${maxLines}

// --- Uniforms ---
uniform sampler2D uPointsTex;
uniform int uTexWidth;
uniform int uTexHeight;
uniform vec2 uGlobalScale;  // Global Scale
uniform vec2 uGlobalOffset; // Global Offset
uniform vec2 uViewportSize;
uniform vec2 uLogAxis;      // x: logX enabled (1.0/0.0), y: logY enabled (1.0/0.0)

// --- UBO ---
struct LineData {
  vec4 transform; // scale.x, scale.y, offset.x, offset.y
  vec4 color;     // r, g, b, a
  ivec4 indices;  // start index, number of points (0=disabled), unused, unused
  float thickness;
};
layout(std140) uniform LineDataBlock {
  LineData uLines[MAX_LINES];
};

// --- Attributes ---
in float aLineId;
in float aIndex;
in float aIsBevel;
in vec2 aBevelNormal;
in float aSide;

// --- Outputs ---
flat out vec4 vColor;

// --- Helper: Get Point ---
vec2 getPoint(int globalPointIndex) {
  int texX = globalPointIndex % uTexWidth;
  int texY = globalPointIndex / uTexWidth;
  float u = (float(texX) + 0.5) / float(uTexWidth);
  float v = (float(texY) + 0.5) / float(uTexHeight);
  return texture(uPointsTex, vec2(u, v)).xy;
}

// --- Helpers: screen/clip conversions and normals ---
vec2 clipToPixel(vec2 deltaClip) {
  // clip coordinates are -1..1; converting a delta to pixel space needs half viewport scale
  return deltaClip * vec2(0.5 * uViewportSize.x, 0.5 * uViewportSize.y);
}

vec2 pixelToClip(vec2 deltaPixels) {
  return deltaPixels * vec2(2.0 / uViewportSize.x, 2.0 / uViewportSize.y);
}

vec2 screenNormalFromDir(vec2 dirClip) {
  // Convert direction to pixel space before computing a perpendicular so aspect ratio and zoom are respected
  vec2 dirPixels = clipToPixel(dirClip);
  float len = length(dirPixels);
  if (len < 0.0001) {
    return vec2(0.0, 0.0);
  }
  return vec2(-dirPixels.y, dirPixels.x) / len;
}

vec2 thicknessOffsetFromNormal(vec2 normalPixels, float desiredHalfPixelThickness, float side) {
  if (desiredHalfPixelThickness < 0.0001 || length(normalPixels) < 0.0001 || uViewportSize.x < 0.001 || uViewportSize.y < 0.001) {
    return vec2(0.0, 0.0);
  }
  return pixelToClip(normalPixels * (desiredHalfPixelThickness * side));
}

// --- Main ---
void main() {
  int lineId = int(aLineId);
  int localIndex = int(aIndex); // This is the original point index passed from CPU

  // Access UBO for line properties
  int globalStartIndex = uLines[lineId].indices.x;
  int numPoints = uLines[lineId].indices.y; // Total points in the current line segment

  vColor = uLines[lineId].color; // Assign color to fragment shader

  // Early exit for disabled lines
  if (numPoints <= 0) {
     gl_Position = vec4(-2.0, -2.0, 0.0, 1.0); // Move off-screen
     return;
  }

  // Common variables needed for both paths
  vec2 lineScale = uLines[lineId].transform.xy;
  vec2 lineOffset = uLines[lineId].transform.zw;
  float desiredHalfPixelThickness = uLines[lineId].thickness * 0.5;

  // Retrieve the current point's original coordinates from texture
  // Note: aIndex (localIndex) directly maps to the point's position in the line's own array
  vec2 p_original = getPoint(globalStartIndex + localIndex);
  
  // Apply logarithmic transformation if enabled
  vec2 p_log = p_original;
  if (uLogAxis.x > 0.5) {
    if (p_log.x > 0.0) {
      p_log.x = log(p_log.x) / log(10.0); // log10
    } else {
      p_log.x = -1000.0; // Move negative/zero values far off-screen
    }
  }
  if (uLogAxis.y > 0.5) {
    if (p_log.y > 0.0) {
      p_log.y = log(p_log.y) / log(10.0); // log10
    } else {
      p_log.y = -1000.0; // Move negative/zero values far off-screen
    }
  }
  
  vec2 p_transformed = p_log * lineScale + lineOffset; // Apply per-line transform after log
  vec2 p_globally_transformed = p_transformed * uGlobalScale + uGlobalOffset;

  // Precompute neighbor points (with log + transforms) for consistent normal calculation
  vec2 pPrev_original = (localIndex == 0) ? p_original : getPoint(globalStartIndex + max(0, localIndex - 1));
  vec2 pNext_original = (localIndex == numPoints - 1) ? p_original : getPoint(globalStartIndex + min(numPoints - 1, localIndex + 1));

  vec2 pPrev_log = pPrev_original;
  if (uLogAxis.x > 0.5) {
    if (pPrev_log.x > 0.0) {
      pPrev_log.x = log(pPrev_log.x) / log(10.0);
    } else {
      pPrev_log.x = -1000.0;
    }
  }
  if (uLogAxis.y > 0.5) {
    if (pPrev_log.y > 0.0) {
      pPrev_log.y = log(pPrev_log.y) / log(10.0);
    } else {
      pPrev_log.y = -1000.0;
    }
  }

  vec2 pNext_log = pNext_original;
  if (uLogAxis.x > 0.5) {
    if (pNext_log.x > 0.0) {
      pNext_log.x = log(pNext_log.x) / log(10.0);
    } else {
      pNext_log.x = -1000.0;
    }
  }
  if (uLogAxis.y > 0.5) {
    if (pNext_log.y > 0.0) {
      pNext_log.y = log(pNext_log.y) / log(10.0);
    } else {
      pNext_log.y = -1000.0;
    }
  }

  vec2 pPrev_transformed = pPrev_log * lineScale + lineOffset;
  vec2 pNext_transformed = pNext_log * lineScale + lineOffset;
  vec2 pPrev_globally = pPrev_transformed * uGlobalScale + uGlobalOffset;
  vec2 pNext_globally = pNext_transformed * uGlobalScale + uGlobalOffset;

  vec2 dirFromPrev = p_globally_transformed - pPrev_globally;
  vec2 dirToNext = pNext_globally - p_globally_transformed;

  vec2 finalOffsetVector; // This will hold (normal * scale * side)

  if (aIsBevel > 0.5) {
        // --- Path for CPU-generated Bevels ---
        // Build screen-space normals for incoming and outgoing segments
        vec2 normalPrevScreen = screenNormalFromDir(dirFromPrev);
        vec2 normalNextScreen = screenNormalFromDir(dirToNext);

        // Match the provided bevel normal to the correct segment (incoming or outgoing)
        vec2 normalPrevData = vec2(0.0);
        vec2 normalNextData = vec2(0.0);

        vec2 dirPrevData = p_original - pPrev_original;
        float lenPrevData = length(dirPrevData);
        if (lenPrevData > 0.000001) {
          normalPrevData = vec2(-dirPrevData.y, dirPrevData.x) / lenPrevData;
        }

        vec2 dirNextData = pNext_original - p_original;
        float lenNextData = length(dirNextData);
        if (lenNextData > 0.000001) {
          normalNextData = vec2(-dirNextData.y, dirNextData.x) / lenNextData;
        }

        float matchPrev = dot(normalPrevData, aBevelNormal);
        float matchNext = dot(normalNextData, aBevelNormal);
        vec2 bevelNormalPixels = (matchPrev >= matchNext) ? normalPrevScreen : normalNextScreen;

        finalOffsetVector = thicknessOffsetFromNormal(bevelNormalPixels, desiredHalfPixelThickness, aSide);
  } else {
      // --- Path for Shader-calculated Normals (Miters and Line Ends) ---
      vec2 offsetNormalDir; // To be calculated by miter/end logic

      bool isFirstPoint = (localIndex == 0);
      bool isLastPoint = (localIndex == numPoints - 1);
      
      // Simplified logic with fewer branches
      if (isFirstPoint && isLastPoint) {
          // Single point case (should not happen with numPoints >= 2)
          offsetNormalDir = vec2(0.0, 1.0);
      } else if (isFirstPoint) {
          // Start of line - use next point direction
            offsetNormalDir = screenNormalFromDir(dirToNext);
      } else if (isLastPoint) {
            // End of line - use previous point direction  
            offsetNormalDir = screenNormalFromDir(dirFromPrev);
      } else {
          // Interior point - use simplified miter
            vec2 n0 = screenNormalFromDir(dirFromPrev);
            vec2 n1 = screenNormalFromDir(dirToNext);
            vec2 miterSum = n0 + n1;
            if (length(miterSum) > 0.00001) {
              offsetNormalDir = normalize(miterSum);
            } else {
              offsetNormalDir = n0; // Fallback to first normal
            }
      }

      // Calculate final offset using unified thickness calculation
          finalOffsetVector = thicknessOffsetFromNormal(offsetNormalDir, desiredHalfPixelThickness, aSide);
  }

  // Then apply screen-space thickness offset (calculated to be independent of zoom)
  vec2 finalPos = p_globally_transformed + finalOffsetVector;

  gl_Position = vec4(finalPos, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision mediump float;
flat in vec4 vColor; // Use 'flat' for no interpolation
out vec4 fragColor;
void main() {
  // Optional: Discard fully transparent fragments early
  if (vColor.a == 0.0) {
    discard;
  }
  fragColor = vColor;
}
`;