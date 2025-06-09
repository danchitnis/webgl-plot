// --- Constants ---
const OFFSET_TRANSFORM = 0;
const OFFSET_COLOR = 16;
const OFFSET_INDICES = 32;
const OFFSET_THICKNESS = 48;
const BYTES_PER_FLOAT = 4;
const BYTES_PER_INT = 4;
const LINE_DATA_STRIDE = 64; // Stride for UBO LineData struct

// --- Types ---
type UniformLocationsMulti = {
  uPointsTex: WebGLUniformLocation | null;
  uTexWidth: WebGLUniformLocation | null;
  uTexHeight: WebGLUniformLocation | null;
  uGlobalScale: WebGLUniformLocation | null;
  uGlobalOffset: WebGLUniformLocation | null;
  uViewportSize: WebGLUniformLocation | null;
};

export type LineInitData = {
  points: Float32Array; // Original data space points [x1, y1, x2, y2, ...]
  scale: [number, number]; // Initial per-line scale (applied before global)
  offset: [number, number]; // Initial per-line offset (applied before global)
  color: [number, number, number, number]; // [r, g, b, a] 0-1
  thickness: number; // Thickness in screen pixels
};

// Type for returning bounds from autoScaleEnabledLines
export type DataBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

// --- Helper Functions ---

/**
 * Creates and compiles a shader.
 * @param gl The WebGL context.
 * @param type The shader type (VERTEX_SHADER or FRAGMENT_SHADER).
 * @param source The shader source code.
 * @returns The compiled shader.
 * @throws If shader creation or compilation fails.
 */
function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Could not create shader object.");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}\nSource:\n${source}`);
  }
  return shader;
}

/**
 * Creates and links a WebGL program from vertex and fragment shaders.
 * @param gl The WebGL context.
 * @param vsSource Vertex shader source code.
 * @param fsSource Fragment shader source code.
 * @returns The linked WebGL program.
 * @throws If program creation or linking fails.
 */
function createProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Could not create program object.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // Detach and delete shaders after linking (they are no longer needed)
  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }
  return program;
}

// --- Main Class ---
export class WebglLineThick {
  private gl: WebGL2RenderingContext;
  public prog: WebGLProgram | null;
  private maxLines: number;
  private pointsTexture: WebGLTexture | null;
  private vao: WebGLVertexArrayObject | null;
  private vertexBuffer: WebGLBuffer | null;
  private locations: UniformLocationsMulti;

  // UBO
  private lineDataUBO: WebGLBuffer | null;
  private lineDataUBObindingPoint: number = 0;
  private lineDataStride: number = LINE_DATA_STRIDE;
  private lineDataArrayBuffer: ArrayBuffer = new ArrayBuffer(0);
  private lineDataView: DataView = new DataView(this.lineDataArrayBuffer);

  // State
  private totalVertexCount: number = 0;
  private numLines: number = 0; // Number of lines *initialized*
  private totalValidPoints: number = 0; // Total points across all initialized lines

  // Points Data & Texture
  private pointsData: Float32Array = new Float32Array(0); // CPU copy for updates, CPU scaling
  private texWidth: number = 0;
  private texHeight: number = 0;
  private lineOriginalNumPointsCache: number[] = [];
  private lineStartIndexCache: number[] = [];
  private lineEnabledStatus: boolean[] = [];

  // Global Transform (using simple arrays)
  private globalScale: [number, number] = [1.0, 1.0];
  private globalOffset: [number, number] = [0.0, 0.0];

  /**
   * Creates an instance of WebglLineThick.
   * @param wglp Context wrapper object.
   * @param maxLines Maximum number of lines this instance can handle.
   * @param useGpuReduction Optional: Set to true to attempt GPU-based min/max calculation. Defaults to true.
   */
  constructor(wglp: { gl: WebGL2RenderingContext }, maxLines: number) {
    this.gl = wglp.gl;
    this.maxLines = Math.max(1, maxLines);

    const gl = this.gl;

    // --- Main Vertex Shader (Added Global Transform) ---
    const vsSource = `#version 300 es
precision highp float;
precision highp int;
#define MAX_LINES ${this.maxLines}

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
  int localIndex = int(aIndex);

  // Access UBO
  int globalStartIndex = uLines[lineId].indices.x;
  int numPoints = uLines[lineId].indices.y;

  // Early exit for disabled/invalid points
  if (numPoints <= 0 || localIndex >= numPoints) {
     gl_Position = vec4(0.0, 0.0, 0.0, 0.0); // Collapse
     vColor = vec4(0.0);
     return;
  }

  // Get line specific data
  vec2 lineScale = uLines[lineId].transform.xy;
  vec2 lineOffset = uLines[lineId].transform.zw;
  float lineThickness = uLines[lineId].thickness;
  vColor = uLines[lineId].color;

  int globalIndex = globalStartIndex + localIndex;

  // Retrieve points (original data space)
  vec2 p = getPoint(globalIndex);
  vec2 pPrev = (localIndex == 0) ? p : getPoint(globalStartIndex + max(0, localIndex - 1));
  vec2 pNext = (localIndex == numPoints - 1) ? p : getPoint(globalStartIndex + min(numPoints - 1, localIndex + 1));

  // Apply per-line transformation
  p = p * lineScale + lineOffset;
  pPrev = pPrev * lineScale + lineOffset;
  pNext = pNext * lineScale + lineOffset;

  // --- Calculate Miter/Bevel Normal ---
  vec2 offsetNormalDir;

  // p, pPrev, pNext were already fetched and transformed before this block in the original shader.
  // We rely on those transformed versions: p, pPrev, pNext.

  float dotDirs = 1.0; // Initialize dotDirs

  // Define constants for miter logic
  const float GENTLE_TURN_DOT_THRESHOLD = 0.990;
  const float VERY_SHARP_TURN_DOT_THRESHOLD = -0.97;

  // Determine characteristics of the point p relative to its neighbors
  // (localIndex, numPoints, p, pPrev, pNext are available and transformed)
  bool isFirstPoint = (localIndex == 0);
  bool isLastPoint = (localIndex == numPoints - 1);

  // prevIsCoincident: Is p geometrically indistinct from the transformed pPrev?
  bool prevIsCoincident = isFirstPoint || (length(p - pPrev) < 0.00001);

  // nextIsCoincident: Is p geometrically indistinct from the transformed pNext?
  bool nextIsCoincident = isLastPoint || (length(p - pNext) < 0.00001);

  if (prevIsCoincident && nextIsCoincident) {
     // Case 1: p is isolated, or all points in the line are coincident at p's location.
     offsetNormalDir = vec2(0.0, 1.0);
  } else if (prevIsCoincident) {
     // Case 2: p is effectively the start of a segment p -> pNext.
     // pNext is distinct from p here (otherwise Case 1 would have matched).
     vec2 dirToSegment = normalize(pNext - p);
     offsetNormalDir = vec2(-dirToSegment.y, dirToSegment.x);
  } else if (nextIsCoincident) {
     // Case 3: p is effectively the end of a segment pPrev -> p.
     // pPrev is distinct from p here (otherwise Case 1 or 2 would have matched).
     vec2 dirFromSegment = normalize(p - pPrev);
     offsetNormalDir = vec2(-dirFromSegment.y, dirFromSegment.x);
  } else {
     // Case 4: p is an interior point with distinct pPrev and pNext. Miter join.
     vec2 dirFromPrevSegment = normalize(p - pPrev);
     vec2 dirToNextSegment = normalize(pNext - p);

     // n0 and n1 are calculated based on normalized segments.
     vec2 n0 = vec2(-dirFromPrevSegment.y, dirFromPrevSegment.x);
     vec2 n1 = vec2(-dirToNextSegment.y, dirToNextSegment.x);

     dotDirs = dot(dirFromPrevSegment, dirToNextSegment); // Assign to the pre-declared dotDirs
     // GENTLE_TURN_DOT_THRESHOLD is now defined above

     if (dotDirs > GENTLE_TURN_DOT_THRESHOLD) {
         // For gentle turns, use the normal of the incoming segment directly.
         // n0 is already normalize(vec2(-(p - pPrev).y, (p - pPrev).x)) via dirFromPrevSegment.
         offsetNormalDir = n0;
     } else {
         // Miter calculation for all other turns (sharp or moderately sharp)
         vec2 miterSum = n0 + n1;

         // The scaling logic based on VERY_SHARP_TURN_DOT_THRESHOLD has been removed.

         if (length(miterSum) < 0.0001) {
             offsetNormalDir = n1;
         } else {
             offsetNormalDir = normalize(miterSum);
         }
     }
  }
  // --- End of new miter/bevel logic ---

  // NEW MAGNITUDE CALCULATION (replaces old offsetScale logic):
  // uLines[lineId].thickness is now interpreted as desired screen pixels.
  float desiredHalfPixelThickness = uLines[lineId].thickness * 0.5;

  float newOffsetScaleNDC; // This will be the extrusion magnitude in NDC.

  // Safety checks for viewport size and normal vector length
  if (uViewportSize.x < 0.001 || uViewportSize.y < 0.001 || length(offsetNormalDir) < 0.0001) {
      newOffsetScaleNDC = 0.0; // Effectively zero thickness if viewport or normal is degenerate
  } else {
      // Calculate how much 1 unit of NDC in the direction of offsetNormalDir stretches in screen pixel space.
      // Projection: offsetNormalDir (NDC) -> screen space vector -> screen space length
      // (Viewport scale * 0.5 because NDC ranges from -1 to 1, so viewport covers 2 NDC units)
      float screenSpaceLengthOfUnitNDCOffset = length(vec2(offsetNormalDir.x * uViewportSize.x * 0.5, offsetNormalDir.y * uViewportSize.y * 0.5));

      // Clamping logic starts
      // VERY_SHARP_TURN_DOT_THRESHOLD should be -0.97, defined earlier in the shader
      if (dotDirs < VERY_SHARP_TURN_DOT_THRESHOLD) {
          float avgHalfViewport = (uViewportSize.x + uViewportSize.y) * 0.25;
          avgHalfViewport = max(avgHalfViewport, 1.0);

          float maxReasonableScreenSpaceLength = 2.0 * avgHalfViewport;

          if (screenSpaceLengthOfUnitNDCOffset > maxReasonableScreenSpaceLength) {
              screenSpaceLengthOfUnitNDCOffset = maxReasonableScreenSpaceLength;
          }
          screenSpaceLengthOfUnitNDCOffset = max(screenSpaceLengthOfUnitNDCOffset, 0.001);
      }
      // Clamping logic ends

      if (screenSpaceLengthOfUnitNDCOffset < 0.001) {
          newOffsetScaleNDC = 0.0; // Avoid division by zero
      } else {
          // Calculate the NDC scale needed to achieve the desired pixel half-thickness.
          newOffsetScaleNDC = desiredHalfPixelThickness / screenSpaceLengthOfUnitNDCOffset;
      }
  }

  // Calculate final vertex position *before* global transform, using the new NDC scale
  vec2 pos = p + offsetNormalDir * newOffsetScaleNDC * aSide;

  // Apply Global Transformation (this part remains the same)
  pos = pos * uGlobalScale + uGlobalOffset;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

    // --- Main Fragment Shader ---
    const fsSource = `#version 300 es
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

    // --- Create Main Program ---
    try {
      this.prog = createProgram(gl, vsSource, fsSource);
    } catch (error) {
      console.error("Error creating main GL program:", error);
      this.prog = null;
      throw error; // Re-throw after logging
    }
    gl.useProgram(this.prog);

    // --- Get Main Uniform Locations & Check ---
    this.locations = {
      uPointsTex: gl.getUniformLocation(this.prog, "uPointsTex"),
      uTexWidth: gl.getUniformLocation(this.prog, "uTexWidth"),
      uTexHeight: gl.getUniformLocation(this.prog, "uTexHeight"),
      uGlobalScale: gl.getUniformLocation(this.prog, "uGlobalScale"),
      uGlobalOffset: gl.getUniformLocation(this.prog, "uGlobalOffset"),
      uViewportSize: gl.getUniformLocation(this.prog, "uViewportSize"),
    };
    if (!this.locations.uPointsTex)
      console.warn("Main uniform 'uPointsTex' not found.");
    if (!this.locations.uTexWidth)
      console.warn("Main uniform 'uTexWidth' not found.");
    if (!this.locations.uTexHeight)
      console.warn("Main uniform 'uTexHeight' not found.");
    if (!this.locations.uGlobalScale)
      console.warn("Main uniform 'uGlobalScale' not found.");
    if (!this.locations.uGlobalOffset)
      console.warn("Main uniform 'uGlobalOffset' not found.");
    if (!this.locations.uViewportSize) console.warn("Main uniform 'uViewportSize' not found.");

    // --- Bind Main UBO Block ---
    const blockName = "LineDataBlock";
    const blockIndex = gl.getUniformBlockIndex(this.prog, blockName);
    if (blockIndex === gl.INVALID_INDEX) {
      console.warn(
        `Main program: Uniform block '${blockName}' not found or not active.`
      );
    } else {
      gl.uniformBlockBinding(
        this.prog,
        blockIndex,
        this.lineDataUBObindingPoint
      );
    }

    // --- Set Constant Main Uniforms ---
    if (this.locations.uPointsTex) gl.uniform1i(this.locations.uPointsTex, 0); // Texture unit 0

    // --- Create Main UBO, VBO, VAO, Points Texture & Check ---
    this.lineDataUBO = gl.createBuffer();
    if (!this.lineDataUBO) throw new Error("Failed to create UBO buffer.");

    this.pointsTexture = gl.createTexture();
    if (!this.pointsTexture)
      throw new Error("Failed to create points texture.");

    this.vertexBuffer = gl.createBuffer();
    if (!this.vertexBuffer) throw new Error("Failed to create vertex buffer.");

    this.vao = gl.createVertexArray();
    if (!this.vao) throw new Error("Failed to create vertex array object.");

    // --- Setup Main VAO & Check Attributes ---
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    const stride = 3 * BYTES_PER_FLOAT; // aLineId, aIndex, aSide
    const aLineIdLoc = gl.getAttribLocation(this.prog, "aLineId");
    const aIndexLoc = gl.getAttribLocation(this.prog, "aIndex");
    const aSideLoc = gl.getAttribLocation(this.prog, "aSide");

    if (aLineIdLoc === -1)
      console.warn("Attribute 'aLineId' not found in main program.");
    else {
      gl.enableVertexAttribArray(aLineIdLoc);
      gl.vertexAttribPointer(aLineIdLoc, 1, gl.FLOAT, false, stride, 0);
    }

    if (aIndexLoc === -1)
      console.warn("Attribute 'aIndex' not found in main program.");
    else {
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

    if (aSideLoc === -1)
      console.warn("Attribute 'aSide' not found in main program.");
    else {
      gl.enableVertexAttribArray(aSideLoc);
      gl.vertexAttribPointer(
        aSideLoc,
        1,
        gl.FLOAT,
        false,
        stride,
        2 * BYTES_PER_FLOAT
      );
    }

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // --- End Main Resource Creation ---

    // --- Initialize State ---
    this.lineEnabledStatus = new Array(this.maxLines).fill(false);
    this.lineOriginalNumPointsCache = new Array(this.maxLines).fill(0);
    this.lineStartIndexCache = new Array(this.maxLines).fill(0);
    this.setGlobalTransform(this.globalScale, this.globalOffset); // Set initial global transform uniforms

    gl.useProgram(null); // Unbind program initially

    // --- Enable Blending ---
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * Initializes or updates line data, including points texture, VBO, UBO,
   * and potentially GPU reduction resources.
   * @param lines An array of line objects to draw.
   */
  public initLines(lines: LineInitData[]): void {
    const gl = this.gl;
    if (!this.prog) {
      console.error("Cannot initLines, main program not initialized.");
      return;
    }

    // --- Input Validation & Filtering ---
    if (lines.length > this.maxLines) {
      console.warn(
        `initLines: Attempted to initialize with ${lines.length} lines, but maxLines is ${this.maxLines}. Truncating.`
      );
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
      const numPts = line.points.length / 2;
      if (numPts >= 2) {
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
      } else {
        console.warn(
          `initLines: Skipping line index ${i} with ${numPts} points.`
        );
      }
    }
    this.numLines = validLinesData.length;

    // --- Handle Case: No Valid Lines ---
    if (this.numLines === 0) {
      this.totalVertexCount = 0;
      this.totalValidPoints = 0;
      this.pointsData = new Float32Array(0);
      gl.activeTexture(gl.TEXTURE0);
      if (this.pointsTexture) {
        // Check if texture exists before binding/updating
        gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RG32F,
          1,
          1,
          0,
          gl.RG,
          gl.FLOAT,
          new Float32Array([0, 0])
        );
      }
      this.texWidth = 1;
      this.texHeight = 1;

      const uboTotalSize = this.maxLines * this.lineDataStride;
      if (this.lineDataArrayBuffer.byteLength !== uboTotalSize) {
        this.lineDataArrayBuffer = new ArrayBuffer(uboTotalSize);
        this.lineDataView = new DataView(this.lineDataArrayBuffer);
      } else {
        new Float32Array(this.lineDataArrayBuffer).fill(0);
      }
      if (this.lineDataUBO) {
        // Check if UBO exists
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
        gl.bufferData(
          gl.UNIFORM_BUFFER,
          this.lineDataArrayBuffer,
          gl.DYNAMIC_DRAW
        );
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        gl.bindBufferBase(
          gl.UNIFORM_BUFFER,
          this.lineDataUBObindingPoint,
          this.lineDataUBO
        );
      }
      if (this.vertexBuffer) {
        // Check if VBO exists
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, 0, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
      }
      gl.useProgram(this.prog);
      if (this.locations.uTexWidth)
        gl.uniform1i(this.locations.uTexWidth, this.texWidth);
      if (this.locations.uTexHeight)
        gl.uniform1i(this.locations.uTexHeight, this.texHeight);

      console.warn(
        "initLines called with no valid lines. Renderer resources cleared/reset."
      );
      return;
    }

    // --- Prepare and Upload Points Texture Data ---
    const allPoints = new Float32Array(this.totalValidPoints * 2);
    let currentPointOffset = 0;
    for (const data of validLinesData) {
      allPoints.set(data.lineObj.points, currentPointOffset);
      currentPointOffset += data.lineObj.points.length;
    }

    const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.texWidth = Math.min(Math.max(1, this.totalValidPoints), maxTexSize);
    this.texHeight = Math.ceil(this.totalValidPoints / this.texWidth);
    if (this.texHeight > maxTexSize) {
      console.error("Required texture height exceeds MAX_TEXTURE_SIZE!");
      this.texHeight = maxTexSize;
    }
    const totalTexels = this.texWidth * this.texHeight;

    if (this.pointsData.length < totalTexels * 2) {
      this.pointsData = new Float32Array(totalTexels * 2);
    } else {
      this.pointsData.fill(0, 0, totalTexels * 2);
    } // Use fill with range if reusing
    this.pointsData.set(allPoints);

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

    // --- Prepare Vertex Buffer Data (VBO) ---
    const floatsPerVertex = 3;
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
    let vOffset = 0;
    for (let lineId = 0; lineId < this.numLines; lineId++) {
      const numPts = this.lineOriginalNumPointsCache[lineId];
      for (let pointIdx = 0; pointIdx < numPts; pointIdx++) {
        vertexData[vOffset++] = lineId;
        vertexData[vOffset++] = pointIdx;
        vertexData[vOffset++] = 1.0;
        vertexData[vOffset++] = lineId;
        vertexData[vOffset++] = pointIdx;
        vertexData[vOffset++] = -1.0;
      }
      if (lineId < this.numLines - 1) {
        const lastPtIdx = numPts - 1;
        const nextLineId = lineId + 1;
        const firstPtIdxNext = 0;
        vertexData[vOffset++] = lineId;
        vertexData[vOffset++] = lastPtIdx;
        vertexData[vOffset++] = -1.0;
        vertexData[vOffset++] = lineId;
        vertexData[vOffset++] = lastPtIdx;
        vertexData[vOffset++] = -1.0;
        vertexData[vOffset++] = nextLineId;
        vertexData[vOffset++] = firstPtIdxNext;
        vertexData[vOffset++] = 1.0;
        vertexData[vOffset++] = nextLineId;
        vertexData[vOffset++] = firstPtIdxNext;
        vertexData[vOffset++] = 1.0;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // --- Prepare and Upload Uniform Buffer Object (UBO) Data ---
    const uboTotalSize = this.maxLines * this.lineDataStride;
    if (this.lineDataArrayBuffer.byteLength !== uboTotalSize) {
      this.lineDataArrayBuffer = new ArrayBuffer(uboTotalSize);
      this.lineDataView = new DataView(this.lineDataArrayBuffer);
    } else {
      new Float32Array(this.lineDataArrayBuffer).fill(0);
    }
    for (let lineId = 0; lineId < this.numLines; lineId++) {
      const data = validLinesData[lineId];
      const lineObj = data.lineObj;
      const byteOffset = lineId * this.lineDataStride;
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 0 * BYTES_PER_FLOAT,
        lineObj.scale[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 1 * BYTES_PER_FLOAT,
        lineObj.scale[1],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 2 * BYTES_PER_FLOAT,
        lineObj.offset[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_TRANSFORM + 3 * BYTES_PER_FLOAT,
        lineObj.offset[1],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 0 * BYTES_PER_FLOAT,
        lineObj.color[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 1 * BYTES_PER_FLOAT,
        lineObj.color[1],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 2 * BYTES_PER_FLOAT,
        lineObj.color[2],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_COLOR + 3 * BYTES_PER_FLOAT,
        lineObj.color[3],
        true
      );
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 0 * BYTES_PER_INT,
        data.startIndex,
        true
      );
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 1 * BYTES_PER_INT,
        data.numPoints,
        true
      ); // Start enabled
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 2 * BYTES_PER_INT,
        0,
        true
      );
      this.lineDataView.setInt32(
        byteOffset + OFFSET_INDICES + 3 * BYTES_PER_INT,
        0,
        true
      ); // Unused
      this.lineDataView.setFloat32(
        byteOffset + OFFSET_THICKNESS,
        lineObj.thickness,
        true
      );
    }
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    gl.bufferData(gl.UNIFORM_BUFFER, this.lineDataArrayBuffer, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    gl.bindBufferBase(
      gl.UNIFORM_BUFFER,
      this.lineDataUBObindingPoint,
      this.lineDataUBO
    );

    // --- Update Remaining Main Uniforms ---
    gl.useProgram(this.prog);
    if (this.locations.uTexWidth)
      gl.uniform1i(this.locations.uTexWidth, this.texWidth);
    if (this.locations.uTexHeight)
      gl.uniform1i(this.locations.uTexHeight, this.texHeight);
  }

  /**
   * Sets the global scale and offset applied AFTER per-line transforms.
   * @param scale Tuple `[scaleX, scaleY]`.
   * @param offset Tuple `[offsetX, offsetY]`.
   */
  public setGlobalTransform(
    scale: [number, number],
    offset: [number, number]
  ): void {
    // Store internally
    this.globalScale[0] = scale[0];
    this.globalScale[1] = scale[1];
    this.globalOffset[0] = offset[0];
    this.globalOffset[1] = offset[1];

    // Update GL uniforms
    const gl = this.gl;
    if (
      this.prog &&
      this.locations.uGlobalScale &&
      this.locations.uGlobalOffset
    ) {
      gl.useProgram(this.prog);
      gl.uniform2f(
        this.locations.uGlobalScale,
        this.globalScale[0],
        this.globalScale[1]
      );
      gl.uniform2f(
        this.locations.uGlobalOffset,
        this.globalOffset[0],
        this.globalOffset[1]
      );
      gl.useProgram(null);
    }
  }

  /**
   * Computes the min/max bounds of enabled lines using CPU iteration.
   * Internal method.
   * @returns DataBounds object or null if no enabled lines with points found.
   */
  private _computeBoundsCPU(): DataBounds | null {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let foundEnabledData = false;

    for (let lineId = 0; lineId < this.numLines; lineId++) {
      if (this.lineEnabledStatus[lineId]) {
        const startIndex = this.lineStartIndexCache[lineId];
        const numPoints = this.lineOriginalNumPointsCache[lineId];
        if (numPoints > 0) {
          foundEnabledData = true;
          const endPointIndex = startIndex + numPoints;
          for (let ptIdx = startIndex; ptIdx < endPointIndex; ptIdx++) {
            const dataIdx = ptIdx * 2;
            if (dataIdx + 1 < this.pointsData.length) {
              const x = this.pointsData[dataIdx];
              const y = this.pointsData[dataIdx + 1];
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            } else {
              console.error(
                `_computeBoundsCPU: Point index ${ptIdx} OOB length ${this.pointsData.length}.`
              );
              break;
            }
          }
        }
      }
    }

    if (!foundEnabledData) {
      return null;
    }
    if (
      !isFinite(minX) ||
      !isFinite(maxX) ||
      !isFinite(minY) ||
      !isFinite(maxY)
    ) {
      console.warn("_computeBoundsCPU: Resulting bounds NaN/Infinity.");
      return null;
    }
    return { minX, maxX, minY, maxY };
  }

  /**
   * Auto-scales enabled lines to fit NDC [-1, 1] by setting the GLOBAL transform,
   * scaling X and Y independently to fill the space.
   * @returns The computed data bounds {minX, maxX, minY, maxY} of the enabled lines,
   *          or null if no valid bounds could be determined.
   */
  public autoScaleEnabledLines(): DataBounds | null {
    if (this.numLines === 0) {
      console.warn("autoScaleEnabledLines: No lines initialized.");
      return null;
    }

    let bounds: DataBounds | null = null;

    console.time("CPU Bounds Calculation");
    bounds = this._computeBoundsCPU();
    console.timeEnd("CPU Bounds Calculation");

    if (!bounds) {
      console.warn(
        "autoScaleEnabledLines: No valid data bounds found. Setting global transform to default."
      );
      this.setGlobalTransform([1.0, 1.0], [0.0, 0.0]);
      return null;
    }

    let scaleX = 1.0,
      scaleY = 1.0,
      offsetX = 0.0,
      offsetY = 0.0;
    const { minX, maxX, minY, maxY } = bounds;
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const ndcWidth = 2.0,
      ndcHeight = 2.0;
    const epsilon = 1e-9;

    // Calculate X scale and offset
    if (rangeX > epsilon) {
      scaleX = ndcWidth / rangeX;
      const centerX = minX + rangeX / 2.0;
      offsetX = 0.0 - centerX * scaleX;
    } else {
      scaleX = 1.0;
      offsetX = 0.0 - minX * scaleX;
    }

    // Calculate Y scale and offset
    if (rangeY > epsilon) {
      scaleY = ndcHeight / rangeY;
      const centerY = minY + rangeY / 2.0;
      offsetY = 0.0 - centerY * scaleY;
    } else {
      scaleY = 1.0;
      offsetY = 0.0 - minY * scaleY;
    }

    console.log(
      `AutoScale Results: Bounds [${minX.toFixed(3)}, ${maxX.toFixed(
        3
      )}], [${minY.toFixed(3)}, ${maxY.toFixed(
        3
      )}] -> Global Scale: [${scaleX.toFixed(4)}, ${scaleY.toFixed(
        4
      )}], Offset: [${offsetX.toFixed(4)}, ${offsetY.toFixed(4)}]`
    );

    this.setGlobalTransform([scaleX, scaleY], [offsetX, offsetY]);

    return bounds;
  }

  /**
   * Updates the per-line transform (scale and offset) for multiple lines using UBO updates.
   */
  public updateLinesTransform(
    lineIds: number[],
    scale: [number, number],
    offset: [number, number]
  ): void {
    const gl = this.gl;
    if (!this.lineDataUBO) {
      console.warn("updateLinesTransform: UBO not available.");
      return;
    }
    const updatedOffsets: number[] = [];
    for (const lineId of lineIds) {
      if (lineId < 0 || lineId >= this.numLines) {
        console.warn(`updateLinesTransform: Invalid lineId ${lineId}.`);
        continue;
      }
      const byteOffset = lineId * this.lineDataStride + OFFSET_TRANSFORM;
      this.lineDataView.setFloat32(
        byteOffset + 0 * BYTES_PER_FLOAT,
        scale[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + 1 * BYTES_PER_FLOAT,
        scale[1],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + 2 * BYTES_PER_FLOAT,
        offset[0],
        true
      );
      this.lineDataView.setFloat32(
        byteOffset + 3 * BYTES_PER_FLOAT,
        offset[1],
        true
      );
      updatedOffsets.push(byteOffset);
    }
    if (updatedOffsets.length > 0) {
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
      for (const byteOffset of updatedOffsets) {
        const transformView = new Float32Array(
          this.lineDataArrayBuffer,
          byteOffset,
          4
        );
        gl.bufferSubData(gl.UNIFORM_BUFFER, byteOffset, transformView);
      }
      gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }
  }

  /**
   * Updates the per-line transform for a specific line.
   */
  public updateLineTransform(
    lineId: number,
    scale: [number, number],
    offset: [number, number]
  ): void {
    this.updateLinesTransform([lineId], scale, offset);
  }

  /**
   * Updates the color for a specific line.
   */
  public updateLineColor(
    lineId: number,
    color: [number, number, number, number]
  ): void {
    if (lineId < 0 || lineId >= this.numLines) {
      console.warn(`updateLineColor: Invalid lineId ${lineId}`);
      return;
    }
    const gl = this.gl;
    if (!this.lineDataUBO) {
      console.warn("updateLineColor: UBO not available.");
      return;
    }
    const byteOffset = lineId * this.lineDataStride + OFFSET_COLOR;
    this.lineDataView.setFloat32(
      byteOffset + 0 * BYTES_PER_FLOAT,
      color[0],
      true
    );
    this.lineDataView.setFloat32(
      byteOffset + 1 * BYTES_PER_FLOAT,
      color[1],
      true
    );
    this.lineDataView.setFloat32(
      byteOffset + 2 * BYTES_PER_FLOAT,
      color[2],
      true
    );
    this.lineDataView.setFloat32(
      byteOffset + 3 * BYTES_PER_FLOAT,
      color[3],
      true
    );
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    const colorView = new Float32Array(this.lineDataArrayBuffer, byteOffset, 4);
    gl.bufferSubData(gl.UNIFORM_BUFFER, byteOffset, colorView);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  /**
   * Updates the thickness for a specific line.
   */
  public updateLineThickness(lineId: number, newThickness: number): void {
    if (lineId < 0 || lineId >= this.numLines) {
      console.warn(`updateLineThickness: Invalid lineId ${lineId}`);
      return;
    }
    const gl = this.gl;
    if (!this.lineDataUBO) {
      console.warn("updateLineThickness: UBO not available.");
      return;
    }
    const byteOffset = lineId * this.lineDataStride + OFFSET_THICKNESS;
    this.lineDataView.setFloat32(byteOffset, newThickness, true);
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    const thicknessView = new Float32Array(
      this.lineDataArrayBuffer,
      byteOffset,
      1
    );
    gl.bufferSubData(gl.UNIFORM_BUFFER, byteOffset, thicknessView);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  /**
   * Enables or disables rendering of specific lines.
   */
  public setLinesEnabled(lineIds: number[], enabled: boolean): void {
    const gl = this.gl;
    if (!this.lineDataUBO) {
      console.warn("setLinesEnabled: UBO not available.");
      return;
    }
    const updatedIndices: { byteOffset: number; numPoints: number }[] = [];
    for (const lineId of lineIds) {
      if (lineId < 0 || lineId >= this.numLines) {
        console.warn(`setLinesEnabled: Invalid lineId ${lineId}.`);
        continue;
      }
      if (this.lineEnabledStatus[lineId] !== enabled) {
        this.lineEnabledStatus[lineId] = enabled;
        const numPointsToSet = enabled
          ? this.lineOriginalNumPointsCache[lineId]
          : 0;
        const byteOffset =
          lineId * this.lineDataStride + OFFSET_INDICES + 1 * BYTES_PER_INT;
        this.lineDataView.setInt32(byteOffset, numPointsToSet, true);
        updatedIndices.push({ byteOffset, numPoints: numPointsToSet });
      }
    }
    if (updatedIndices.length > 0) {
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
      for (const update of updatedIndices) {
        const int32View = new Int32Array([update.numPoints]);
        gl.bufferSubData(gl.UNIFORM_BUFFER, update.byteOffset, int32View);
      }
      gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }
  }

  /**
   * Enables or disables rendering of a single line.
   */
  public setLineEnabled(lineId: number, enabled: boolean): void {
    this.setLinesEnabled([lineId], enabled);
  }

  /**
   * Updates only the Y coordinates of the points for a given line.
   */
  public updateLineY(lineId: number, newY: Float32Array): void {
    if (lineId < 0 || lineId >= this.numLines) {
      console.warn(`updateLineY: Invalid lineId ${lineId}`);
      return;
    }
    if (!this.pointsTexture) {
      console.warn("updateLineY: pointsTexture is null.");
      return;
    }
    const numPts = this.lineOriginalNumPointsCache[lineId];
    if (newY.length !== numPts)
      throw new Error(
        `Line ${lineId}: Length mismatch for updateLineY. Expected ${numPts}, got ${newY.length}.`
      );
    if (numPts <= 0) return;
    const gl = this.gl;
    const startIdx = this.lineStartIndexCache[lineId];

    // Update CPU copy
    for (let i = 0; i < numPts; i++) {
      const yDataIndex = (startIdx + i) * 2 + 1;
      if (yDataIndex < this.pointsData.length)
        this.pointsData[yDataIndex] = newY[i];
      else {
        console.error(
          `updateLineY: Index ${yDataIndex} OOB length ${this.pointsData.length}.`
        );
        return;
      }
    }
    // Update GPU texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    let currentGlobalIndex = startIdx;
    const endGlobalIndex = startIdx + numPts;
    while (currentGlobalIndex < endGlobalIndex) {
      const row = Math.floor(currentGlobalIndex / this.texWidth);
      const col = currentGlobalIndex % this.texWidth;
      const remainingInRow = this.texWidth - col;
      const remainingInLineSegment = endGlobalIndex - currentGlobalIndex;
      const numPointsInBlock = Math.min(remainingInRow, remainingInLineSegment);
      if (numPointsInBlock <= 0) break;
      const offsetFloats = currentGlobalIndex * 2;
      const lengthFloats = numPointsInBlock * 2;
      const byteOffset =
        this.pointsData.byteOffset + offsetFloats * BYTES_PER_FLOAT;
      const byteLength = lengthFloats * BYTES_PER_FLOAT;
      if (byteOffset + byteLength > this.pointsData.buffer.byteLength) {
        console.error(`updateLineY: View OOB buffer.`);
        break;
      }
      const subDataView = new Float32Array(
        this.pointsData.buffer,
        byteOffset,
        lengthFloats
      );
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        col,
        row,
        numPointsInBlock,
        1,
        gl.RG,
        gl.FLOAT,
        subDataView
      );
      currentGlobalIndex += numPointsInBlock;
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /**
   * Draws the lines managed by this instance.
   */
  public draw(): void {
    const gl = this.gl;
    if (
      this.totalVertexCount === 0 ||
      !this.prog ||
      !this.vao ||
      !this.pointsTexture ||
      !this.lineDataUBO
    ) {
      return; // Don't draw if not ready or no vertices
    }

    gl.useProgram(this.prog);

    // Ensure latest global transform is set in uniforms
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
      gl.uniform2f(this.locations.uViewportSize, gl.canvas.width, gl.canvas.height);
    }

    // Bind resources
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);
    gl.bindBufferBase(
      gl.UNIFORM_BUFFER,
      this.lineDataUBObindingPoint,
      this.lineDataUBO
    );
    gl.bindVertexArray(this.vao);

    // Draw command
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.totalVertexCount);

    // Unbind resources
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, this.lineDataUBObindingPoint, null);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    gl.useProgram(null);
  }

  /**
   * Releases all WebGL resources allocated by this instance.
   */
  public cleanup(): void {
    const gl = this.gl;
    console.log("Cleaning up WebglLineThick resources...");

    // Main rendering resources
    if (this.prog) {
      gl.deleteProgram(this.prog);
      this.prog = null;
    }
    if (this.pointsTexture) {
      gl.deleteTexture(this.pointsTexture);
      this.pointsTexture = null;
    }
    if (this.vertexBuffer) {
      gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }
    if (this.lineDataUBO) {
      gl.deleteBuffer(this.lineDataUBO);
      this.lineDataUBO = null;
    }
    if (this.vao) {
      gl.deleteVertexArray(this.vao);
      this.vao = null;
    }

    // Reset internal state and CPU-side data
    this.pointsData = new Float32Array(0);
    this.lineDataArrayBuffer = new ArrayBuffer(0);
    this.lineDataView = new DataView(this.lineDataArrayBuffer);
    this.numLines = 0;
    this.totalVertexCount = 0;
    this.totalValidPoints = 0;
    this.lineOriginalNumPointsCache = [];
    this.lineStartIndexCache = [];
    this.lineEnabledStatus = [];
    // Reset location caches
    this.locations = {
      uPointsTex: null,
      uTexWidth: null,
      uTexHeight: null,
      uGlobalScale: null,
      uGlobalOffset: null,
      uViewportSize: null,
    };
    // Reset global transform state
    this.globalScale = [1.0, 1.0];
    this.globalOffset = [0.0, 0.0];

    console.log("WebglLineThick resources cleaned up.");
  }
}
