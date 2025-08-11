
/*****************
 * The shaders in the file are WebglLneThick.ts
 * They are used for rendering thick lines in WebGL.
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

// --- Main ---
void main() {
  int lineId = int(aLineId);
  int localIndex = int(aIndex); // This is the original point index passed from CPU

  // Access UBO for line properties
  int globalStartIndex = uLines[lineId].indices.x;
  int numPoints = uLines[lineId].indices.y; // Total points in the current line segment

  vColor = uLines[lineId].color; // Assign color to fragment shader

  // Early exit for disabled lines or if pointIndex is out of bounds for this line segment
  if (numPoints <= 0) { // localIndex check is implicitly handled by vertex generation on CPU
     gl_Position = vec4(0.0, 0.0, 0.0, 0.0); // Collapse
     //vColor = vec4(0.0); // Already set, or can be cleared if preferred
     return;
  }

  // Common variables needed for both paths
  vec2 lineScale = uLines[lineId].transform.xy;
  vec2 lineOffset = uLines[lineId].transform.zw;
  float desiredHalfPixelThickness = uLines[lineId].thickness * 0.5;

  // Retrieve the current point's original coordinates from texture
  // Note: aIndex (localIndex) directly maps to the point's position in the line's own array
  vec2 p_original = getPoint(globalStartIndex + localIndex);
  vec2 p_transformed = p_original * lineScale + lineOffset; // Apply per-line transform early

  vec2 finalOffsetVector; // This will hold (normal * scale * side)

  if (aIsBevel > 0.5) {
      // --- Path for CPU-generated Bevels ---
      // aBevelNormal is provided by CPU (N_in or N_out for the specific vertex of the bevel quad)
      if (length(aBevelNormal) < 0.0001) {
          finalOffsetVector = vec2(0.0, 0.0);
      } else {
          float bevelNormScreenSpaceLength = length(vec2(aBevelNormal.x * uViewportSize.x * 0.5, aBevelNormal.y * uViewportSize.y * 0.5));
          bevelNormScreenSpaceLength = max(bevelNormScreenSpaceLength, 0.001); // Avoid division by zero
          float bevelOffsetScaleNDC = desiredHalfPixelThickness / bevelNormScreenSpaceLength;
          finalOffsetVector = aBevelNormal * bevelOffsetScaleNDC * aSide;
      }
  } else {
      // --- Path for Shader-calculated Normals (Miters and Line Ends) ---
      vec2 pPrev_original = (localIndex == 0) ? p_original : getPoint(globalStartIndex + max(0, localIndex - 1));
      vec2 pNext_original = (localIndex == numPoints - 1) ? p_original : getPoint(globalStartIndex + min(numPoints - 1, localIndex + 1));

      // Apply per-line transform to neighbors for normal calculation
      vec2 pPrev_transformed = pPrev_original * lineScale + lineOffset;
      vec2 pNext_transformed = pNext_original * lineScale + lineOffset;

      vec2 offsetNormalDir; // To be calculated by miter/end logic
      float dotDirs = 1.0;  // Initialize for GENTLE_TURN, actual value for interior points

      // Define constants for miter logic
      const float GENTLE_TURN_DOT_THRESHOLD = 0.990;
      const float VERY_SHARP_TURN_DOT_THRESHOLD = 0.7; // Used for miter blunting

      bool isFirstPoint = (localIndex == 0);
      bool isLastPoint = (localIndex == numPoints - 1);
      bool prevCoincident = isFirstPoint || (length(p_transformed - pPrev_transformed) < 0.00001);
      bool nextCoincident = isLastPoint || (length(p_transformed - pNext_transformed) < 0.00001);

      if (prevCoincident && nextCoincident) {
          offsetNormalDir = vec2(0.0, 1.0); // Isolated or all points coincident
      } else if (prevCoincident) { // Start of a segment
          vec2 dirToNext = normalize(pNext_transformed - p_transformed);
          offsetNormalDir = vec2(-dirToNext.y, dirToNext.x);
      } else if (nextCoincident) { // End of a segment
          vec2 dirFromPrev = normalize(p_transformed - pPrev_transformed);
          offsetNormalDir = vec2(-dirFromPrev.y, dirFromPrev.x);
      } else { // Interior point (miter join)
          vec2 dirFromPrev = normalize(p_transformed - pPrev_transformed);
          vec2 dirToNext = normalize(pNext_transformed - p_transformed);

          dotDirs = dot(dirFromPrev, dirToNext); // Actual dot product for interior points

          vec2 n0 = vec2(-dirFromPrev.y, dirFromPrev.x);
          vec2 n1 = vec2(-dirToNext.y, dirToNext.x);

          if (dotDirs > GENTLE_TURN_DOT_THRESHOLD) {
              offsetNormalDir = n0;
          } else {
              vec2 miterSum = n0 + n1;

              // Apply scaling factor to miterSum
              // Assumes GENTLE_TURN_DOT_THRESHOLD and VERY_SHARP_TURN_DOT_THRESHOLD are accessible constants.
              // This logic applies if VERY_SHARP_TURN_DOT_THRESHOLD <= dotDirs <= GENTLE_TURN_DOT_THRESHOLD
              // (VERY_SHARP_TURN_DOT_THRESHOLD is -0.97, GENTLE_TURN_DOT_THRESHOLD is 0.990)
              float normalizedRange = (dotDirs - VERY_SHARP_TURN_DOT_THRESHOLD) / (GENTLE_TURN_DOT_THRESHOLD - VERY_SHARP_TURN_DOT_THRESHOLD);
              normalizedRange = clamp(normalizedRange, 0.0, 1.0);
              float scaleFactor = 0.6 + normalizedRange * 0.4; // Ranges 0.6 to 1.0
              miterSum *= scaleFactor;

              if (length(miterSum) < 0.0001) {
                  offsetNormalDir = n1;
              } else {
                  offsetNormalDir = normalize(miterSum);
              }
          }
      }

      // Calculate screen-space magnitude for the shader-calculated normal
      if (length(offsetNormalDir) < 0.0001 || uViewportSize.x < 0.001 || uViewportSize.y < 0.001) {
           finalOffsetVector = vec2(0.0,0.0);
      } else {
          float normScreenSpaceLength = length(vec2(offsetNormalDir.x * uViewportSize.x * 0.5, offsetNormalDir.y * uViewportSize.y * 0.5));
          normScreenSpaceLength = max(normScreenSpaceLength, 0.001); // Avoid division by zero
          float calculatedOffsetScaleNDC = desiredHalfPixelThickness / normScreenSpaceLength;
          finalOffsetVector = offsetNormalDir * calculatedOffsetScaleNDC * aSide;
      }
  }

  // Apply Global Transformation to the point first
  vec2 p_globally_transformed = p_transformed * uGlobalScale + uGlobalOffset;

  // Add the screen-space offset vector
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