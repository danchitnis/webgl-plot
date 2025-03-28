// --- Constants ---
const OFFSET_TRANSFORM = 0; // UBO Offset
const OFFSET_COLOR = 16; // UBO Offset
const OFFSET_INDICES = 32; // UBO Offset
const OFFSET_THICKNESS = 48; // UBO Offset
const BYTES_PER_FLOAT = 4;
const BYTES_PER_INT = 4;
const LINE_DATA_STRIDE = 64; // UBO Stride

// --- Types ---
type UniformLocationsFragment = {
  uPointsTex: WebGLUniformLocation | null;
  uTexWidth: WebGLUniformLocation | null;
  uTexHeight: WebGLUniformLocation | null;
  uGlobalScale: WebGLUniformLocation | null;
  uGlobalOffset: WebGLUniformLocation | null;
  uViewportSize: WebGLUniformLocation | null;
};

export type LineInitData = {
  points: Float32Array;
  scale: [number, number];
  offset: [number, number];
  color: [number, number, number, number];
  thickness: number; // <<< INTERPRETED AS PIXELS >>>
};

export type DataBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

// --- Helper Functions ---
function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader fail");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile fail: ${info}\nSource:\n${source}`);
  }
  return shader;
}
function createProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram();
  if (!prog) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    throw new Error("Program fail");
  }
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.detachShader(prog, vs);
  gl.detachShader(prog, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`Program link fail: ${info}`);
  }
  return prog;
}
// --- Constants ---
// ... (unchanged) ...

// --- Types ---
// ... (unchanged) ...

// --- Helper Functions ---
// ... (unchanged) ...

// --- Main Class ---
export class WebglLineThick {
  // ... (Properties unchanged) ...
  private gl: WebGL2RenderingContext;
  public prog: WebGLProgram | null;
  private maxLines: number;
  private pointsTexture: WebGLTexture | null;
  private vao: WebGLVertexArrayObject | null;
  private vertexBuffer: WebGLBuffer | null;
  private locations: UniformLocationsFragment;
  private lineDataUBO: WebGLBuffer | null;
  private lineDataUBObindingPoint: number = 0;
  private lineDataStride: number = LINE_DATA_STRIDE;
  private lineDataArrayBuffer!: ArrayBuffer;
  private lineDataView!: DataView;
  private totalVertexCount: number = 0;
  private numLines: number = 0;
  private totalValidPoints: number = 0;
  private pointsData: Float32Array = new Float32Array(0);
  private texWidth: number = 0;
  private texHeight: number = 0;
  private lineOriginalNumPointsCache: number[] = [];
  private lineStartIndexCache: number[] = [];
  private lineEnabledStatus: boolean[] = [];
  private globalScale: [number, number] = [1.0, 1.0];
  private globalOffset: [number, number] = [0.0, 0.0];

  constructor(wglp: { gl: WebGL2RenderingContext }, maxLines: number) {
    this.gl = wglp.gl;
    this.maxLines = Math.max(1, maxLines);
    console.log(
      `[ConstructorFS-Smooth] WebglLineThick with maxLines = ${this.maxLines}`
    );
    const gl = this.gl;

    // --- Vertex Shader (FS Approach - Explicit Segment - SMOOTH Interpolation) ---
    const vsSource = `#version 300 es
precision highp float;
precision highp int;
#define MAX_LINES ${this.maxLines}

// Uniforms
uniform sampler2D uPointsTex;
uniform int uTexWidth;
uniform int uTexHeight;
uniform vec2 uGlobalScale;
uniform vec2 uGlobalOffset;
uniform vec2 uViewportSize;

// UBO
struct LineData { vec4 transform; vec4 color; ivec4 indices; float thickness; float pad1,pad2,pad3; };
layout(std140) uniform LineDataBlock { LineData uLines[MAX_LINES]; };

// Attributes
in float aLineId;
in float aIndex;
in float aSide; // Float, 0.0 or 1.0

// Outputs to Fragment Shader
// <<< REMOVE FLAT - Use default smooth interpolation >>>
out vec2 vSegmentStartClip;
out vec2 vSegmentEndClip;
out float vHalfThicknessPixels; // Thickness interpolation is fine
flat out vec4 vColor;        // Keep color flat

// getPoint helper
vec2 getPoint(int globalPointIndex) {
int texX = globalPointIndex % uTexWidth; int texY = globalPointIndex / uTexWidth;
float u = (float(texX) + 0.5) / float(uTexWidth); float v = (float(texY) + 0.5) / float(uTexHeight);
return texture(uPointsTex, vec2(u, v)).xy;
}

// Project helper
vec2 projectPoint(vec2 pOrig, int lineId) {
  vec2 pLine = pOrig * uLines[lineId].transform.xy + uLines[lineId].transform.zw;
  return pLine * uGlobalScale + uGlobalOffset;
}

// --- Main VS ---
void main() {
  // --- Basic Setup & Data Fetching ---
  int lineId = int(aLineId); if (lineId >= MAX_LINES) { gl_Position=vec4(0.0); return; }
  int localIndex = int(aIndex); int globalStartIndex = uLines[lineId].indices.x; int numPoints = uLines[lineId].indices.y; if (numPoints <= 0 || localIndex < 0 || localIndex >= numPoints) { gl_Position=vec4(0.0); return; }
  vColor = uLines[lineId].color; float pixelThickness = uLines[lineId].thickness;

  // --- Calculate Point Positions ---
  int globalIndex = globalStartIndex + localIndex; vec2 pOrig = getPoint(globalIndex);
  vec2 pPrevOrig = (localIndex == 0) ? pOrig : getPoint(globalStartIndex + localIndex - 1);
  vec2 pNextOrig = (localIndex == numPoints - 1) ? pOrig : getPoint(globalStartIndex + localIndex + 1);
  vec2 pClip      = projectPoint(pOrig, lineId); vec2 pNextClip  = projectPoint(pNextOrig, lineId); vec2 pPrevClip  = projectPoint(pPrevOrig, lineId);

  // --- Determine & Pass Segment Endpoints (SMOOTH) ---
  if (localIndex == numPoints - 1) { vSegmentStartClip = pPrevClip; vSegmentEndClip = pClip; }
  else { vSegmentStartClip = pClip; vSegmentEndClip = pNextClip; }

  // --- Calculate Vertex Position for Bounding Geometry ---
  // (Using miter direction for better bounding box)
  vec2 p = pOrig * uLines[lineId].transform.xy + uLines[lineId].transform.zw;
  vec2 pNext = pNextOrig * uLines[lineId].transform.xy + uLines[lineId].transform.zw;
  vec2 pPrev = pPrevOrig * uLines[lineId].transform.xy + uLines[lineId].transform.zw;
  vec2 offsetNormalDirLocal;
  vec2 dirToNextLocal = pNext - p; vec2 dirFromPrevLocal = p - pPrev; float lenToNextLocal = length(dirToNextLocal); float lenFromPrevLocal = length(dirFromPrevLocal);
  bool isStart = (localIndex == 0); bool isEnd = (localIndex == numPoints - 1); const float EPSILON = 1e-5;
  bool prevCoincident = lenFromPrevLocal < EPSILON; bool nextCoincident = lenToNextLocal < EPSILON;
  if ((isStart || prevCoincident) && (isEnd || nextCoincident)) { offsetNormalDirLocal = vec2(0.0, 1.0); }
  else if (isStart || prevCoincident) { if (lenToNextLocal < EPSILON) { offsetNormalDirLocal = vec2(0.0, 1.0); } else { vec2 dir = normalize(dirToNextLocal); offsetNormalDirLocal = vec2(-dir.y, dir.x); } }
  else if (isEnd || nextCoincident) { if (lenFromPrevLocal < EPSILON) { offsetNormalDirLocal = vec2(0.0, 1.0); } else { vec2 dir = normalize(dirFromPrevLocal); offsetNormalDirLocal = vec2(-dir.y, dir.x); } }
  else { vec2 dir0 = normalize(dirFromPrevLocal); vec2 dir1 = normalize(dirToNextLocal); if (length(dir0) < EPSILON && length(dir1) < EPSILON) { offsetNormalDirLocal = vec2(0.0, 1.0); } else if (length(dir0) < EPSILON) { offsetNormalDirLocal = vec2(-dir1.y, dir1.x); } else if (length(dir1) < EPSILON) { offsetNormalDirLocal = vec2(-dir0.y, dir0.x); } else { vec2 n0 = vec2(-dir0.y, dir0.x); vec2 n1 = vec2(-dir1.y, dir1.x); float nDot = dot(n0, n1); if (nDot < -0.999) { offsetNormalDirLocal = n0; } else { vec2 miterVec = normalize(n0 + n1); if (length(miterVec) < EPSILON) { offsetNormalDirLocal = n0; } else { offsetNormalDirLocal = miterVec; } } } }
  float ndcApproxHalfThickness = (uViewportSize.y > 0.0) ? (pixelThickness * 0.5) / (uViewportSize.y * 0.5) : 0.0; float margin = 0.05; float offsetScale = ndcApproxHalfThickness + margin;
  float sideMultiplier = mix(-1.0, 1.0, aSide); vec2 offsetLocal = offsetNormalDirLocal * offsetScale * sideMultiplier;
  vec2 posLocal = p + offsetLocal; vec2 posFinal = posLocal * uGlobalScale + uGlobalOffset;
  gl_Position = vec4(posFinal, 0.0, 1.0);

  // --- Pass Thickness to Fragment Shader ---
  vHalfThicknessPixels = pixelThickness * 0.5;
}
`;

    // --- Fragment Shader (Screen-Space Distance - SMOOTH Inputs, Improved Distance Calc) ---
    const fsSource = `#version 300 es
precision highp float; // Use high precision

// Input from Vertex Shader
// <<< REMOVE FLAT - Use default smooth interpolation >>>
in vec2 vSegmentStartClip;
in vec2 vSegmentEndClip;
in float vHalfThicknessPixels; // Thickness interpolation is fine
flat in vec4 vColor;         // Keep color flat

// Uniforms
uniform vec2 uViewportSize;

out vec4 fragColor;

// --- Distance calculation (more robust) ---
// Calculates signed distance to infinite line and checks segment bounds
// Returns large distance if outside segment bounds.
float signedDistanceToLineSegment(vec2 pixelCoord, vec2 screenA, vec2 screenB) {
  vec2 segmentVector = screenB - screenA;
  vec2 pointVectorAP = pixelCoord - screenA; // Vector from A to Pixel
  vec2 pointVectorBP = pixelCoord - screenB; // Vector from B to Pixel

  float segmentLengthSq = dot(segmentVector, segmentVector);

  // Check for zero-length segment
  if (segmentLengthSq < 0.01) {
      return length(pointVectorAP); // Distance to point A
  }

  // Projection factor of pointVectorAP onto segmentVector
  float projectionFactor = dot(pointVectorAP, segmentVector) / segmentLengthSq;

  // Calculate distance to the infinite line defined by the segment
  // Uses the 2D cross product scaled by segment length: |cross(segmentVector, pointVectorAP)| / length(segmentVector)
  // cross(vec2(a,b), vec2(c,d)) = ad - bc
  float distanceToInfiniteLine = abs(segmentVector.x * pointVectorAP.y - segmentVector.y * pointVectorAP.x) / sqrt(segmentLengthSq);

  // Check if the projection falls within the segment (0 <= projectionFactor <= 1)
  // Also check distance from point B to handle floating point errors near ends
  float projectionFactorBP = dot(pointVectorBP, -segmentVector) / segmentLengthSq; // Project B->P onto B->A

  if (projectionFactor >= 0.0 && projectionFactorBP >= 0.0) {
  //if (projectionFactor >= 0.0 && projectionFactor <= 1.0) { // Alternative check
      // Projection is within the segment bounds
      return distanceToInfiniteLine;
  } else {
      // Projection is outside the segment, find distance to the closer endpoint
      float distToA = length(pointVectorAP);
      float distToB = length(pointVectorBP);
      // Return a value large enough to be discarded, but add line distance
      // This helps shape the end caps implicitly (though not perfectly round/square)
      return min(distToA, distToB) + distanceToInfiniteLine; // Or just return infinity: return 1.0e6;
  }
}


void main() {
  vec2 fragCoordPixels = gl_FragCoord.xy; // Screen pixels (origin bottom-left)

  // Convert interpolated segment endpoints from clip space [-1, 1] to screen pixels [0, W/H]
  vec2 segmentStartScreen = (vSegmentStartClip * 0.5 + 0.5) * uViewportSize;
  vec2 segmentEndScreen   = (vSegmentEndClip   * 0.5 + 0.5) * uViewportSize;

  // Calculate distance using the more robust method
  float distancePixels = signedDistanceToLineSegment(fragCoordPixels, segmentStartScreen, segmentEndScreen);

  // Calculate anti-aliased alpha
  float fadeWidth = 0.75;
  float alpha = 1.0 - smoothstep(vHalfThicknessPixels - fadeWidth, vHalfThicknessPixels + fadeWidth, distancePixels);

  if (alpha <= 0.0) { discard; }

  fragColor = vec4(vColor.rgb, vColor.a * alpha);
}
`;

    // --- Create Program & Get Locations ---
    try {
      this.prog = createProgram(gl, vsSource, fsSource);
    } catch (error) {
      console.error("[ConstructorFS-Smooth] Error creating GL program:", error);
      this.prog = null;
      throw error;
    }
    gl.useProgram(this.prog);
    this.locations = {
      /* Get locations */
      uPointsTex: gl.getUniformLocation(this.prog, "uPointsTex"),
      uTexWidth: gl.getUniformLocation(this.prog, "uTexWidth"),
      uTexHeight: gl.getUniformLocation(this.prog, "uTexHeight"),
      uGlobalScale: gl.getUniformLocation(this.prog, "uGlobalScale"),
      uGlobalOffset: gl.getUniformLocation(this.prog, "uGlobalOffset"),
      uViewportSize: gl.getUniformLocation(this.prog, "uViewportSize"),
      uAspectRatio: null,
    };
    if (!this.locations.uViewportSize) {
      console.error(
        "[ConstructorFS-Smooth] CRITICAL: Failed to get uViewportSize uniform location!"
      );
    }
    // ... other checks ...

    // --- Bind UBO Block ---
    const blockName = "LineDataBlock";
    const blockIndex = gl.getUniformBlockIndex(this.prog, blockName);
    if (blockIndex !== gl.INVALID_INDEX) {
      gl.uniformBlockBinding(
        this.prog,
        blockIndex,
        this.lineDataUBObindingPoint
      );
    } else {
      console.error("UBO block not found");
    }

    // --- Set Constant Uniforms ---
    if (this.locations.uPointsTex) {
      gl.uniform1i(this.locations.uPointsTex, 0);
    }

    // --- Create Resources ---
    this.lineDataUBO = gl.createBuffer();
    this.pointsTexture = gl.createTexture();
    this.vertexBuffer = gl.createBuffer();
    this.vao = gl.createVertexArray();
    if (
      !this.lineDataUBO ||
      !this.pointsTexture ||
      !this.vertexBuffer ||
      !this.vao
    )
      throw new Error("Resource creation failed");

    // --- Setup VAO (Float aSide 0/1) ---
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    const stride = 3 * BYTES_PER_FLOAT;
    const aLineIdLoc = gl.getAttribLocation(this.prog, "aLineId");
    if (aLineIdLoc !== -1) {
      gl.enableVertexAttribArray(aLineIdLoc);
      gl.vertexAttribPointer(aLineIdLoc, 1, gl.FLOAT, false, stride, 0);
    }
    const aIndexLoc = gl.getAttribLocation(this.prog, "aIndex");
    if (aIndexLoc !== -1) {
      gl.enableVertexAttribArray(aIndexLoc);
      gl.vertexAttribPointer(
        aIndexLoc,
        1,
        gl.FLOAT,
        false,
        stride,
        1 * BYTES_PER_FLOAT
      );
    }
    const aSideLoc = gl.getAttribLocation(this.prog, "aSide");
    if (aSideLoc !== -1) {
      gl.enableVertexAttribArray(aSideLoc);
      gl.vertexAttribPointer(
        aSideLoc,
        1,
        gl.FLOAT,
        false,
        stride,
        2 * BYTES_PER_FLOAT
      );
    } else {
      console.error("Attr 'aSide' NOT found!");
    }
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // --- Initialize UBO ---
    const uboSize = this.maxLines * this.lineDataStride;
    this.lineDataArrayBuffer = new ArrayBuffer(uboSize);
    this.lineDataView = new DataView(this.lineDataArrayBuffer);
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    gl.bufferData(gl.UNIFORM_BUFFER, uboSize, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    gl.bindBufferBase(
      gl.UNIFORM_BUFFER,
      this.lineDataUBObindingPoint,
      this.lineDataUBO
    );

    // --- Init State & GL Settings ---
    this.lineEnabledStatus = new Array(this.maxLines).fill(false);
    /*...*/ this.setGlobalTransform(this.globalScale, this.globalOffset);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(null);
    console.log("[ConstructorFS-Smooth] Setup complete.");
  }

  /** Initializes or updates line data. Uses Float aSide (0.0 or 1.0) in VBO. */
  public initLines(lines: LineInitData[]): void {
    /* ... Unchanged from previous working GPU version ... */
    console.log("[initLinesFS-Smooth] Starting...");
    const gl = this.gl;
    if (
      !this.prog ||
      !this.lineDataUBO ||
      !this.vertexBuffer ||
      !this.pointsTexture
    ) {
      return;
    }
    if (lines.length > this.maxLines) {
      lines = lines.slice(0, this.maxLines);
    }
    const validLinesData: {
      lineObj: LineInitData;
      startIndex: number;
      numPoints: number;
    }[] = [];
    let currentStartIndex = 0;
    this.totalValidPoints = 0;
    this.lineOriginalNumPointsCache.fill(0);
    this.lineStartIndexCache.fill(0);
    this.lineEnabledStatus.fill(false);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.points && line.points.length >= 4) {
        const numPts = line.points.length / 2;
        const lineId = validLinesData.length;
        validLinesData.push({
          lineObj: line,
          startIndex: currentStartIndex,
          numPoints: numPts,
        });
        this.lineOriginalNumPointsCache[lineId] = numPts;
        this.lineStartIndexCache[lineId] = currentStartIndex;
        this.lineEnabledStatus[lineId] = true;
        currentStartIndex += numPts;
        this.totalValidPoints += numPts;
      }
    }
    this.numLines = validLinesData.length;
    if (this.numLines === 0) {
      /* Clear resources... */ return;
    }
    const allPoints = new Float32Array(this.totalValidPoints * 2);
    let currentPointOffset = 0;
    for (const data of validLinesData) {
      allPoints.set(data.lineObj.points, currentPointOffset);
      currentPointOffset += data.lineObj.points.length;
    }
    const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.texWidth = Math.min(
      Math.max(1, Math.ceil(Math.sqrt(this.totalValidPoints))),
      maxTexSize
    );
    this.texHeight = Math.ceil(this.totalValidPoints / this.texWidth);
    if (this.texHeight > maxTexSize) {
      /* Clamp... */
    }
    const totalTexels = this.texWidth * this.texHeight;
    if (this.pointsData.length !== totalTexels * 2) {
      this.pointsData = new Float32Array(totalTexels * 2);
    } else {
      this.pointsData.fill(0);
    }
    this.pointsData.set(allPoints.slice(0, this.totalValidPoints * 2));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RG32F,
      this.texWidth,
      this.texHeight,
      0,
      gl.RG,
      gl.FLOAT,
      this.pointsData
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    const floatsPerVertex = 3;
    const bytesPerVertex = floatsPerVertex * BYTES_PER_FLOAT;
    const verticesPerPoint = 2;
    const degenerateVerticesPerJoin = 4;
    let calculatedTotalVertices = 0;
    for (let lineId = 0; lineId < this.numLines; lineId++) {
      calculatedTotalVertices +=
        this.lineOriginalNumPointsCache[lineId] * verticesPerPoint;
    }
    if (this.numLines > 1) {
      calculatedTotalVertices +=
        (this.numLines - 1) * degenerateVerticesPerJoin;
    }
    this.totalVertexCount = calculatedTotalVertices;
    const vertexData = new Float32Array(
      this.totalVertexCount * floatsPerVertex
    );
    let floatArrayIndex = 0;
    for (let lineId = 0; lineId < this.numLines; lineId++) {
      const numPts = this.lineOriginalNumPointsCache[lineId];
      for (let pointIdx = 0; pointIdx < numPts; pointIdx++) {
        vertexData[floatArrayIndex++] = lineId;
        vertexData[floatArrayIndex++] = pointIdx;
        vertexData[floatArrayIndex++] = 1.0;
        /* Side +1 */ vertexData[floatArrayIndex++] = lineId;
        vertexData[floatArrayIndex++] = pointIdx;
        vertexData[floatArrayIndex++] = 0.0; /* Side -1 */
      }
      if (lineId < this.numLines - 1) {
        const lastPtIdx = numPts - 1;
        const nextLineId = lineId + 1;
        const firstPtIdxNext = 0;
        vertexData[floatArrayIndex++] = lineId;
        vertexData[floatArrayIndex++] = lastPtIdx;
        vertexData[floatArrayIndex++] = 0.0;
        vertexData[floatArrayIndex++] = lineId;
        vertexData[floatArrayIndex++] = lastPtIdx;
        vertexData[floatArrayIndex++] = 0.0;
        vertexData[floatArrayIndex++] = nextLineId;
        vertexData[floatArrayIndex++] = firstPtIdxNext;
        vertexData[floatArrayIndex++] = 1.0;
        vertexData[floatArrayIndex++] = nextLineId;
        vertexData[floatArrayIndex++] = firstPtIdxNext;
        vertexData[floatArrayIndex++] = 1.0;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    const uboTotalSize = this.maxLines * this.lineDataStride;
    if (this.lineDataArrayBuffer.byteLength !== uboTotalSize) {
      console.error(
        `[initLinesFS-Smooth] FATAL: UBO ArrayBuffer size mismatch.`
      );
    }
    new Float32Array(this.lineDataArrayBuffer).fill(0);
    for (let lineId = 0; lineId < this.numLines; lineId++) {
      const data = validLinesData[lineId];
      const lineObj = data.lineObj;
      const byteOffset = lineId * this.lineDataStride;
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 0,
        lineObj.scale[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 4,
        lineObj.scale[1],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 8,
        lineObj.offset[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 12,
        lineObj.offset[1],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 0,
        lineObj.color[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 4,
        lineObj.color[1],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 8,
        lineObj.color[2],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 12,
        lineObj.color[3],
        true
      );
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 0,
        data.startIndex,
        true
      );
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 4,
        data.numPoints,
        true
      );
      this.lineDataView.setInt32(byteOffset + OFFSET_INDICES + 8, 0, true);
      this.lineDataView.setInt32(byteOffset + OFFSET_INDICES + 12, 0, true);
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_THICKNESS,
        lineObj.thickness,
        true
      );
    }
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.lineDataArrayBuffer);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    if (this.prog) {
      gl.useProgram(this.prog);
      if (this.locations.uTexWidth)
        gl.uniform1i(this.locations.uTexWidth, this.texWidth);
      if (this.locations.uTexHeight)
        gl.uniform1i(this.locations.uTexHeight, this.texHeight);
      gl.useProgram(null);
    }
    console.log(`[initLinesFS-Smooth] Complete.`);
  }

  /** Sets the global scale and offset uniforms. */
  public setGlobalTransform(
    scale: [number, number],
    offset: [number, number]
  ): void {
    this.globalScale[0] = scale[0];
    this.globalScale[1] = scale[1];
    this.globalOffset[0] = offset[0];
    this.globalOffset[1] = offset[1];
    console.log(
      `[setGlobalTransformFS] Scale: ${scale.join(",")}, Offset: ${offset.join(
        ","
      )}`
    );
    const gl = this.gl;
    if (
      this.prog &&
      this.locations.uGlobalScale &&
      this.locations.uGlobalOffset
    ) {
      gl.useProgram(this.prog);
      gl.uniform2f(this.locations.uGlobalScale, scale[0], scale[1]);
      gl.uniform2f(this.locations.uGlobalOffset, offset[0], offset[1]);
      gl.useProgram(null);
    }
  }

  // Aspect ratio state update method removed

  // --- Update Methods ---
  public updateLineColor(
    lineId: number,
    color: [number, number, number, number]
  ): void {
    /* ... UBO update ... */
  }
  public updateLineThickness(
    lineId: number,
    newThicknessInPixels: number
  ): void {
    /* ... UBO update ... */
  }
  public setLinesEnabled(lineIds: number[], enabled: boolean): void {
    /* ... UBO update ... */
  }
  public setLineEnabled(lineId: number, enabled: boolean): void {
    /* ... */
  }
  public updateLineY(lineId: number, newY: Float32Array): void {
    /* ... Texture update ... */
  }
  private _computeBoundsCPU(): DataBounds | null {
    /* ... Unchanged ... */
  }
  public autoScaleEnabledLines(): DataBounds | null {
    /* ... Unchanged ... */
  }

  /** Draws the lines using TRIANGLE_STRIP. */
  public draw(): void {
    const gl = this.gl;
    if (
      this.totalVertexCount === 0 ||
      !this.prog ||
      !this.vao ||
      !this.pointsTexture ||
      !this.lineDataUBO
    ) {
      return;
    }
    gl.useProgram(this.prog);
    if (this.locations.uGlobalScale)
      gl.uniform2f(
        this.locations.uGlobalScale,
        this.globalScale[0],
        this.globalScale[1]
      );
    if (this.locations.uGlobalOffset)
      gl.uniform2f(
        this.locations.uGlobalOffset,
        this.globalOffset[0],
        this.globalOffset[1]
      );
    if (this.locations.uViewportSize) {
      gl.uniform2f(
        this.locations.uViewportSize,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight
      );
    } else {
      console.warn("[drawFS-Smooth] Missing uViewportSize uniform location!");
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.totalVertexCount); // Draw lines
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);
  }

  /** Releases all WebGL resources. */
  public cleanup(): void {
    /* ... Unchanged ... */
  }
}

// --- Example Usage ---
async function main() {
  console.log("Starting main (Fragment Shader - SMOOTH Interpolation)..."); // Update log
  const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found.");
    return;
  }
  if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    /* fallback size */
  }
  const gl = canvas.getContext("webgl2", { antialias: true });
  if (!gl) {
    console.error("WebGL2 context creation failed.");
    return;
  }
  let lineRenderer: WebglLineThick | null = null;
  let resizeObserver: ResizeObserver | null = null;
  function resizeCanvas() {
    console.log("resizeCanvas called...");
    if (!gl || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.round(canvas.clientWidth * dpr);
    const displayHeight = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      console.log(
        `>>> Canvas resized to: ${canvas.width}x${canvas.height}`
      ); /* Viewport uniform updated in draw */
    }
  }
  try {
    resizeCanvas();
    const MAX_LINES_ALLOWED = 10;
    console.log(
      "Creating WebglLineThick instance (Fragment Shader - SMOOTH)..."
    );
    lineRenderer = new WebglLineThick({ gl }, MAX_LINES_ALLOWED);
    console.log("WebglLineThick instance created.");
    const testPointsRaw = [0, 0, 10, 10, 20, 50, 20, -50, 30, 40, 30, 0];
    const scaleFactor = 1 / 100.0;
    const testPointsScaled = new Float32Array(
      testPointsRaw.map((p) => p * scaleFactor)
    );
    const linesToInit: LineInitData[] = [
      {
        points: testPointsScaled,
        scale: [1, 1],
        offset: [0, 0],
        color: [1, 1, 0, 1],
        thickness: 4.0 /* PIXELS */,
      },
    ];
    console.log("Calling initLines...");
    lineRenderer.initLines(linesToInit);
    console.log("initLines finished.");
    console.log("Setting global transform [1,1], [0,0]");
    lineRenderer.setGlobalTransform([1, 1], [0, 0]);
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    console.log("ResizeObserver attached.");
    let frameCount = 0;
    function animate(time: number) {
      frameCount++;
      if (!lineRenderer || !gl) return;
      gl.clearColor(0.1, 0.1, 0.1, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      lineRenderer.draw();
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.error(`WebGL Error: ${error} (frame: ${frameCount})`);
      }
      requestAnimationFrame(animate);
    }
    console.log("Starting animation loop...");
    requestAnimationFrame(animate);
  } catch (error) {
    console.error("Error during setup or animation:", error);
  }
  window.addEventListener("beforeunload", () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    lineRenderer?.cleanup();
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () =>
    main().catch(console.error)
  );
} else {
  main().catch(console.error);
}
