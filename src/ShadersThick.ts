
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

// --- Helper: Calculate Consistent Thickness Offset ---
vec2 calculateThicknessOffset(vec2 normalDir, float desiredHalfPixelThickness, float side) {
  if (length(normalDir) < 0.0001 || uViewportSize.x < 0.001 || uViewportSize.y < 0.001) {
    return vec2(0.0, 0.0);
  }
  
  // Use consistent scaling to maintain uniform thickness across all orientations
  float avgViewportScale = (uViewportSize.x + uViewportSize.y) * 0.25; // Average of half-viewport sizes
  float normLength = length(normalDir);
  normLength = max(normLength, 0.001); // Avoid division by zero
  float offsetScaleNDC = desiredHalfPixelThickness / (normLength * avgViewportScale);
  return normalDir * offsetScaleNDC * side;
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
  vec2 p_transformed = p_original * lineScale + lineOffset; // Apply per-line transform early

  vec2 finalOffsetVector; // This will hold (normal * scale * side)

  if (aIsBevel > 0.5) {
      // --- Path for CPU-generated Bevels ---
      // aBevelNormal is provided by CPU (N_in or N_out for the specific vertex of the bevel quad)
      finalOffsetVector = calculateThicknessOffset(aBevelNormal, desiredHalfPixelThickness, aSide);
  } else {
      // --- Path for Shader-calculated Normals (Miters and Line Ends) ---
      vec2 pPrev_original = (localIndex == 0) ? p_original : getPoint(globalStartIndex + max(0, localIndex - 1));
      vec2 pNext_original = (localIndex == numPoints - 1) ? p_original : getPoint(globalStartIndex + min(numPoints - 1, localIndex + 1));

      // Apply per-line transform to neighbors for normal calculation
      vec2 pPrev_transformed = pPrev_original * lineScale + lineOffset;
      vec2 pNext_transformed = pNext_original * lineScale + lineOffset;

      vec2 offsetNormalDir; // To be calculated by miter/end logic

      bool isFirstPoint = (localIndex == 0);
      bool isLastPoint = (localIndex == numPoints - 1);
      
      // Simplified logic with fewer branches
      if (isFirstPoint && isLastPoint) {
          // Single point case (should not happen with numPoints >= 2)
          offsetNormalDir = vec2(0.0, 1.0);
      } else if (isFirstPoint) {
          // Start of line - use next point direction
          vec2 dirToNext = pNext_transformed - p_transformed;
          if (length(dirToNext) > 0.00001) {
              dirToNext = normalize(dirToNext);
              offsetNormalDir = vec2(-dirToNext.y, dirToNext.x);
          } else {
              offsetNormalDir = vec2(0.0, 1.0);
          }
      } else if (isLastPoint) {
          // End of line - use previous point direction  
          vec2 dirFromPrev = p_transformed - pPrev_transformed;
          if (length(dirFromPrev) > 0.00001) {
              dirFromPrev = normalize(dirFromPrev);
              offsetNormalDir = vec2(-dirFromPrev.y, dirFromPrev.x);
          } else {
              offsetNormalDir = vec2(0.0, 1.0);
          }
      } else {
          // Interior point - use simplified miter
          vec2 dirFromPrev = p_transformed - pPrev_transformed;
          vec2 dirToNext = pNext_transformed - p_transformed;
          
          float lenPrev = length(dirFromPrev);
          float lenNext = length(dirToNext);
          
          if (lenPrev > 0.00001 && lenNext > 0.00001) {
              dirFromPrev /= lenPrev;
              dirToNext /= lenNext;
              
              vec2 n0 = vec2(-dirFromPrev.y, dirFromPrev.x);
              vec2 n1 = vec2(-dirToNext.y, dirToNext.x);
              vec2 miterSum = n0 + n1;
              
              if (length(miterSum) > 0.00001) {
                  offsetNormalDir = normalize(miterSum);
              } else {
                  offsetNormalDir = n0; // Fallback to first normal
              }
          } else {
              offsetNormalDir = vec2(0.0, 1.0); // Fallback
          }
      }

      // Calculate final offset using unified thickness calculation
      finalOffsetVector = calculateThicknessOffset(offsetNormalDir, desiredHalfPixelThickness, aSide);
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