// --- Constants ---
const OFFSET_TRANSFORM = 0;
const OFFSET_COLOR = 16;
const OFFSET_INDICES = 32;
const OFFSET_THICKNESS = 48;
const BYTES_PER_FLOAT = 4;
const BYTES_PER_INT = 4;
const LINE_DATA_STRIDE = 64; // Stride for UBO LineData struct

// Geometric thresholds
const VERY_SHARP_TURN_DOT_THRESHOLD = 0.7; // For CPU-side sharp join detection
const COINCIDENT_POINT_EPSILON = 1e-6; // Points closer than this are considered coincident

// --- Types ---
type UniformLocationsMulti = {
  uPointsTex: WebGLUniformLocation | null;
  uTexWidth: WebGLUniformLocation | null;
  uTexHeight: WebGLUniformLocation | null;
  uGlobalScale: WebGLUniformLocation | null;
  uGlobalOffset: WebGLUniformLocation | null;
  uViewportSize: WebGLUniformLocation | null;
  uLogAxis: WebGLUniformLocation | null;
};

import type { LineConfig } from "./LineConfig";
import { FRAGMENT_SHADER_SOURCE, VERTEX_SHADER_SOURCE } from "./ShadersThick";
import { DebugLogger } from "./DebugLogger";
import {
  validateLineForLogAxes,
  calculateLogAwareBounds,
  calculateAutoScaleTransform,
  transformBoundsToLogSpace,
  reverseGlobalTransform,
  transformBoundsToLinearSpace,
  type DataBounds
} from "./LogAxisUtils";

// Re-export DataBounds from shared utilities
export type { DataBounds } from "./LogAxisUtils";



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

  // Pre-allocated reusable buffers to avoid GC pressure
  private reusableFloat32Array4: Float32Array = new Float32Array(4);
  private reusableInt32Array1: Int32Array = new Int32Array(1);
  private globalTransformDirty: boolean = true;

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

  // Sharp turn detection cache (maps lineId -> sharpness flags array)
  private sharpTurnCache: Map<number, boolean[]> = new Map();
  private pointsHashCache: Map<number, string> = new Map(); // To detect when points change

  // Global Transform (using simple arrays)
  private globalScale: [number, number] = [1.0, 1.0];
  private globalOffset: [number, number] = [0.0, 0.0];

  // Log axis flags
  public logX: boolean = false;
  public logY: boolean = false;

  /**
   * Creates an instance of WebglLineThick.
   * @param gl WebGL2 rendering context.
   * @param maxLines Maximum number of lines this instance can handle.
   */
  constructor(gl: WebGL2RenderingContext, maxLines: number) {
    this.gl = gl;
    this.maxLines = Math.max(1, maxLines);

    // Use extracted shader source
    const vsSource = VERTEX_SHADER_SOURCE(this.maxLines);
    const fsSource = FRAGMENT_SHADER_SOURCE;

    // --- Create Main Program ---
    try {
      this.prog = createProgram(this.gl, vsSource, fsSource);
    } catch (error) {
      DebugLogger.error(`Error creating main GL program: ${error}`);
      this.prog = null;
      throw error; // Re-throw after logging
    }
    this.gl.useProgram(this.prog);

    // --- Get Main Uniform Locations & Check ---
    this.locations = {
      uPointsTex: this.gl.getUniformLocation(this.prog, "uPointsTex"),
      uTexWidth: this.gl.getUniformLocation(this.prog, "uTexWidth"),
      uTexHeight: this.gl.getUniformLocation(this.prog, "uTexHeight"),
      uGlobalScale: this.gl.getUniformLocation(this.prog, "uGlobalScale"),
      uGlobalOffset: this.gl.getUniformLocation(this.prog, "uGlobalOffset"),
      uViewportSize: this.gl.getUniformLocation(this.prog, "uViewportSize"),
      uLogAxis: this.gl.getUniformLocation(this.prog, "uLogAxis"),
    };
    if (!this.locations.uPointsTex)
      DebugLogger.warn("Main uniform 'uPointsTex' not found.");
    if (!this.locations.uTexWidth)
      DebugLogger.warn("Main uniform 'uTexWidth' not found.");
    if (!this.locations.uTexHeight)
      DebugLogger.warn("Main uniform 'uTexHeight' not found.");
    if (!this.locations.uGlobalScale)
      DebugLogger.warn("Main uniform 'uGlobalScale' not found.");
    if (!this.locations.uGlobalOffset)
      DebugLogger.warn("Main uniform 'uGlobalOffset' not found.");
    if (!this.locations.uViewportSize) DebugLogger.warn("Main uniform 'uViewportSize' not found.");

    // --- Bind Main UBO Block ---
    const blockName = "LineDataBlock";
    const blockIndex = this.gl.getUniformBlockIndex(this.prog, blockName);
    if (blockIndex === this.gl.INVALID_INDEX) {
      DebugLogger.warn(
        `Main program: Uniform block '${blockName}' not found or not active.`
      );
    } else {
      this.gl.uniformBlockBinding(
        this.prog,
        blockIndex,
        this.lineDataUBObindingPoint
      );
    }

    // --- Set Constant Main Uniforms ---
    if (this.locations.uPointsTex) this.gl.uniform1i(this.locations.uPointsTex, 0); // Texture unit 0

    // --- Create Main UBO, VBO, VAO, Points Texture & Check ---
    this.lineDataUBO = this.gl.createBuffer();
    if (!this.lineDataUBO) throw new Error("Failed to create UBO buffer.");

    this.pointsTexture = this.gl.createTexture();
    if (!this.pointsTexture)
      throw new Error("Failed to create points texture.");

    this.vertexBuffer = this.gl.createBuffer();
    if (!this.vertexBuffer) throw new Error("Failed to create vertex buffer.");

    this.vao = this.gl.createVertexArray();
    if (!this.vao) throw new Error("Failed to create vertex array object.");

    // --- Setup Main VAO & Check Attributes ---
    this.gl.bindVertexArray(this.vao);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    const stride = 6 * BYTES_PER_FLOAT; // New structure: lineId, pointIndex, isBevel, bevelNormalX, bevelNormalY, side

    // Setup all attributes using helper function
    this.setupVertexAttributes([
      { name: 'aLineId', size: 1, offset: 0 * BYTES_PER_FLOAT },
      { name: 'aIndex', size: 1, offset: 1 * BYTES_PER_FLOAT },
      { name: 'aIsBevel', size: 1, offset: 2 * BYTES_PER_FLOAT },
      { name: 'aBevelNormal', size: 2, offset: 3 * BYTES_PER_FLOAT },
      { name: 'aSide', size: 1, offset: 5 * BYTES_PER_FLOAT }
    ], stride);

    this.gl.bindVertexArray(null);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    // --- End Main Resource Creation ---

    // --- Initialize State ---
    this.lineEnabledStatus = new Array(this.maxLines).fill(false);
    this.lineOriginalNumPointsCache = new Array(this.maxLines).fill(0);
    this.lineStartIndexCache = new Array(this.maxLines).fill(0);
    this.setGlobalTransform(this.globalScale, this.globalOffset); // Set initial global transform uniforms

    this.gl.useProgram(null); // Unbind program initially

    // --- Enable Blending ---
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * Initializes or updates line data, including points texture, VBO, UBO,
   * and potentially GPU reduction resources.
   * @param lines An array of line objects to draw.
   */
  public initLines(lines: LineConfig[]): void {
    const gl = this.gl;
    if (!this.prog) {
      DebugLogger.error("Cannot initLines, main program not initialized.");
      return;
    }

    // --- Input Validation & Filtering ---
    if (lines.length > this.maxLines) {
      DebugLogger.warn(
        `initLines: Attempted to initialize with ${lines.length} lines, but maxLines is ${this.maxLines}. Truncating.`
      );
      lines = lines.slice(0, this.maxLines);
    }
    const validLinesData: {
      lineObj: LineConfig; // Changed from LineInitData
      startIndex: number;
      numPoints: number;
      enabled: boolean; // Added to store initial enabled state
    }[] = [];
    let currentStartIndex = 0;
    this.totalValidPoints = 0;
    this.lineOriginalNumPointsCache.fill(0);
    this.lineStartIndexCache.fill(0);
    this.lineEnabledStatus.fill(false);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Default value handling
      const scale = line.scale || [1, 1];
      const offset = line.offset || [0, 0];
      const thickness = line.thickness === undefined ? 1.0 : line.thickness;
      const enabled = line.enabled === undefined ? true : line.enabled;

      const numPts = line.points.length / 2;
      if (numPts >= 2) {
        const lineId = validLinesData.length; // This will be the internal ID for this line
        validLinesData.push({
          // Store a version of the line config with defaults applied for processing
          lineObj: { ...line, scale, offset, thickness, enabled },
          startIndex: currentStartIndex,
          numPoints: numPts,
          enabled: enabled, // Store initial enabled state
        });
        this.lineOriginalNumPointsCache[lineId] = numPts;
        this.lineStartIndexCache[lineId] = currentStartIndex;
        this.lineEnabledStatus[lineId] = enabled; // Initialize based on config
        currentStartIndex += numPts;
        this.totalValidPoints += numPts;
      } else {
        DebugLogger.warn(
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

      DebugLogger.warn(
        "initLines called with no valid lines. Renderer resources cleared/reset."
      );
      return;
    }

    // --- Prepare and Upload Points Texture Data ---
    const allPoints = new Float32Array(this.totalValidPoints * 2);
    let currentPointOffset = 0;
    for (const data of validLinesData) {
      // Use original points - log transformation now happens on GPU
      const transformedPoints = data.lineObj.points;
      allPoints.set(transformedPoints, currentPointOffset);
      currentPointOffset += transformedPoints.length;
    }

    const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.texWidth = Math.min(Math.max(1, this.totalValidPoints), maxTexSize);
    this.texHeight = Math.ceil(this.totalValidPoints / this.texWidth);
    if (this.texHeight > maxTexSize) {
      DebugLogger.error("Required texture height exceeds MAX_TEXTURE_SIZE!");
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
    const floatsPerVertex = 6; // New: lineId, pointIndex, isBevel, normalX, normalY, side

    // Helper functions for vector math
    const v2sub = (a: [number, number], b: [number, number]): [number, number] => [a[0] - b[0], a[1] - b[1]];
    const v2normalize = (a: [number, number]): [number, number] => {
      const len = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
      return len > COINCIDENT_POINT_EPSILON ? [a[0] / len, a[1] / len] : [0, 0];
    };

    // --- Sharp Join Detection & Vertex Count Calculation ---
    const pointSharpnessFlags = new Map<number, boolean[]>();
    let calculatedTotalVertices = 0;

    for (let lineId = 0; lineId < this.numLines; lineId++) {
      const lineData = validLinesData[lineId];
      const pointsArray = lineData.lineObj.points;
      const numPts = lineData.numPoints;

      // Use cached sharp turn detection
      const sharpnessForLine = this.computeSharpTurns(lineId, pointsArray, numPts);
      pointSharpnessFlags.set(lineId, sharpnessForLine);

      // Calculate vertices for this line (re-enabling bevels)
      for (let i = 0; i < numPts; i++) {
        if (i > 0 && i < numPts - 1 && sharpnessForLine[i]) {
          calculatedTotalVertices += 4; // Sharp interior point
        } else {
          calculatedTotalVertices += 2; // Start, end, or non-sharp interior
        }
      }
    }

    // Add vertices for degenerate quads between line strips
    if (this.numLines > 1) {
      calculatedTotalVertices += (this.numLines - 1) * 4; // 4 vertices for each degenerate quad
    }

    this.totalVertexCount = calculatedTotalVertices;

    const vertexData = new Float32Array(this.totalVertexCount * floatsPerVertex);
    let vOffset = 0;

    for (let lineId = 0; lineId < this.numLines; lineId++) {
      const lineInfo = validLinesData[lineId];
      const pointsArray = lineInfo.lineObj.points;
      const numPts = lineInfo.numPoints;
      const isSharpArray = pointSharpnessFlags.get(lineId) || [];

      for (let pointIdx = 0; pointIdx < numPts; pointIdx++) {
        const isSharp = isSharpArray[pointIdx];

        if (isSharp) { // Should only be true for interior points: 1 <= pointIdx < numPts - 1
          const pCurr: [number, number] = [pointsArray[pointIdx * 2], pointsArray[pointIdx * 2 + 1]];
          const pPrev: [number, number] = [pointsArray[(pointIdx - 1) * 2], pointsArray[(pointIdx - 1) * 2 + 1]];
          const pNext: [number, number] = [pointsArray[(pointIdx + 1) * 2], pointsArray[(pointIdx + 1) * 2 + 1]];

          const dir_in = v2normalize(v2sub(pCurr, pPrev));
          const dir_out = v2normalize(v2sub(pNext, pCurr));

          const n_in: [number, number] = [-dir_in[1], dir_in[0]];
          const n_out: [number, number] = [-dir_out[1], dir_out[0]];

          // Vertex 1: In-segment, Side -1
          vertexData[vOffset++] = lineId;
          vertexData[vOffset++] = pointIdx;
          vertexData[vOffset++] = 1.0; // isBevel = true
          vertexData[vOffset++] = n_in[0];
          vertexData[vOffset++] = n_in[1];
          vertexData[vOffset++] = -1.0; // Side

          // Vertex 2: In-segment, Side +1
          vertexData[vOffset++] = lineId;
          vertexData[vOffset++] = pointIdx;
          vertexData[vOffset++] = 1.0; // isBevel = true
          vertexData[vOffset++] = n_in[0];
          vertexData[vOffset++] = n_in[1];
          vertexData[vOffset++] = 1.0; // Side

          // Vertex 3: Out-segment, Side -1
          vertexData[vOffset++] = lineId;
          vertexData[vOffset++] = pointIdx;
          vertexData[vOffset++] = 1.0; // isBevel = true
          vertexData[vOffset++] = n_out[0];
          vertexData[vOffset++] = n_out[1];
          vertexData[vOffset++] = -1.0; // Side

          // Vertex 4: Out-segment, Side +1
          vertexData[vOffset++] = lineId;
          vertexData[vOffset++] = pointIdx;
          vertexData[vOffset++] = 1.0; // isBevel = true
          vertexData[vOffset++] = n_out[0];
          vertexData[vOffset++] = n_out[1];
          vertexData[vOffset++] = 1.0; // Side
        } else {
          // Non-sharp point (start, end, or non-sharp interior)
          // Vertex 1: Side -1
          vertexData[vOffset++] = lineId;
          vertexData[vOffset++] = pointIdx;
          vertexData[vOffset++] = 0.0; // isBevel = false
          vertexData[vOffset++] = 0.0; // bevelNormal idle X
          vertexData[vOffset++] = 0.0; // bevelNormal idle Y
          vertexData[vOffset++] = -1.0; // Side

          // Vertex 2: Side +1
          vertexData[vOffset++] = lineId;
          vertexData[vOffset++] = pointIdx;
          vertexData[vOffset++] = 0.0; // isBevel = false
          vertexData[vOffset++] = 0.0; // bevelNormal idle X
          vertexData[vOffset++] = 0.0; // bevelNormal idle Y
          vertexData[vOffset++] = 1.0;  // Side
        }
      }
      // Re-introduce degenerate triangles between distinct line arrays
      if (lineId < this.numLines - 1) {
        const lastPtIdxCurrentLine = this.lineOriginalNumPointsCache[lineId] - 1;
        // const nextLineId = lineId + 1; // Not directly used for vertex data, but for context
        const firstPtIdxNextLine = 0;

        // Vertex 1: Side B of current line's last point
        vertexData[vOffset++] = lineId;
        vertexData[vOffset++] = lastPtIdxCurrentLine;
        vertexData[vOffset++] = 0.0; // isBevel = false
        vertexData[vOffset++] = 0.0; // bevelNormal idle X
        vertexData[vOffset++] = 0.0; // bevelNormal idle Y
        vertexData[vOffset++] = 1.0;  // Side B

        // Vertex 2: Side B of current line's last point, AGAIN
        vertexData[vOffset++] = lineId;
        vertexData[vOffset++] = lastPtIdxCurrentLine;
        vertexData[vOffset++] = 0.0; // isBevel = false
        vertexData[vOffset++] = 0.0; // bevelNormal idle X
        vertexData[vOffset++] = 0.0; // bevelNormal idle Y
        vertexData[vOffset++] = 1.0;  // Side B

        // Vertex 3: Side A of next line's first point
        vertexData[vOffset++] = lineId + 1;
        vertexData[vOffset++] = firstPtIdxNextLine;
        vertexData[vOffset++] = 0.0; // isBevel = false
        vertexData[vOffset++] = 0.0; // bevelNormal idle X
        vertexData[vOffset++] = 0.0; // bevelNormal idle Y
        vertexData[vOffset++] = -1.0; // Side A

        // Vertex 4: Side A of next line's first point, AGAIN
        vertexData[vOffset++] = lineId + 1;
        vertexData[vOffset++] = firstPtIdxNextLine;
        vertexData[vOffset++] = 0.0; // isBevel = false
        vertexData[vOffset++] = 0.0; // bevelNormal idle X
        vertexData[vOffset++] = 0.0; // bevelNormal idle Y
        vertexData[vOffset++] = -1.0; // Side A
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
      const lineObj = data.lineObj; // This now has defaults applied for scale, offset, thickness
      const byteOffset = lineId * this.lineDataStride;

      // scale, offset, color, thickness are guaranteed by the logic above
      this.lineDataView.setFloat32(byteOffset + OFFSET_TRANSFORM + 0 * BYTES_PER_FLOAT, lineObj.scale![0], true);
      this.lineDataView.setFloat32(byteOffset + OFFSET_TRANSFORM + 1 * BYTES_PER_FLOAT, lineObj.scale![1], true);
      this.lineDataView.setFloat32(byteOffset + OFFSET_TRANSFORM + 2 * BYTES_PER_FLOAT, lineObj.offset![0], true);
      this.lineDataView.setFloat32(byteOffset + OFFSET_TRANSFORM + 3 * BYTES_PER_FLOAT, lineObj.offset![1], true);

      this.lineDataView.setFloat32(byteOffset + OFFSET_COLOR + 0 * BYTES_PER_FLOAT, lineObj.color[0], true);
      this.lineDataView.setFloat32(byteOffset + OFFSET_COLOR + 1 * BYTES_PER_FLOAT, lineObj.color[1], true);
      this.lineDataView.setFloat32(byteOffset + OFFSET_COLOR + 2 * BYTES_PER_FLOAT, lineObj.color[2], true);
      this.lineDataView.setFloat32(byteOffset + OFFSET_COLOR + 3 * BYTES_PER_FLOAT, lineObj.color[3], true);

      this.lineDataView.setInt32(byteOffset + OFFSET_INDICES + 0 * BYTES_PER_INT, data.startIndex, true);
      // Set numPoints in UBO to 0 if line.enabled is false
      this.lineDataView.setInt32(byteOffset + OFFSET_INDICES + 1 * BYTES_PER_INT, data.enabled ? data.numPoints : 0, true);
      this.lineDataView.setInt32(byteOffset + OFFSET_INDICES + 2 * BYTES_PER_INT, 0, true); // Unused
      this.lineDataView.setInt32(byteOffset + OFFSET_INDICES + 3 * BYTES_PER_INT, 0, true); // Unused

      this.lineDataView.setFloat32(byteOffset + OFFSET_THICKNESS, lineObj.thickness!, true);
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
    // Check if values actually changed to avoid redundant updates
    const changed = this.globalScale[0] !== scale[0] ||
      this.globalScale[1] !== scale[1] ||
      this.globalOffset[0] !== offset[0] ||
      this.globalOffset[1] !== offset[1];

    if (!changed) return;

    // Store internally
    this.globalScale[0] = scale[0];
    this.globalScale[1] = scale[1];
    this.globalOffset[0] = offset[0];
    this.globalOffset[1] = offset[1];
    this.globalTransformDirty = true;
  }

  /**
   * Get the data bounds of all enabled lines (for autoscaling purposes).
   * This returns the complete extent of all data and should be used with autoScale().
   * For preserving current coordinate space, use getDataBounds() instead.
   * @returns Object with minX, maxX, minY, maxY of all the data, or null if no valid data
   */
  public getAllDataBounds(): DataBounds | null {
    return this._computeBoundsCPU();
  }

  /**
   * Get the data bounds of the current coordinate space (viewport).
   * This preserves the current zoom/pan when transforming to log space.
   * Use this with transformToLogSpace() to maintain user's coordinate space.
   * @returns Object with minX, maxX, minY, maxY of the current view with coordinate space information, or null if invalid transform
   */
  public getDataBounds(): DataBounds | null {
    return reverseGlobalTransform(this.globalScale, this.globalOffset, this.logX, this.logY);
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

          // Use shared utility for validation
          const linePointsForValidation = new Float32Array(this.pointsData.buffer, startIndex * 8, numPoints * 2);
          const validation = validateLineForLogAxes(linePointsForValidation, this.logX, this.logY);
          if (!validation.isValid) {
            DebugLogger.log(`_computeBoundsCPU: Skipping line ${lineId} - only ${validation.validPointCount}/${validation.totalPoints} (${(validation.validRatio * 100).toFixed(1)}%) points valid for log axes`);
            continue;
          }

          foundEnabledData = true;

          // Use shared utility for bounds calculation
          const lineBounds = calculateLogAwareBounds(linePointsForValidation, this.logX, this.logY);
          if (lineBounds) {
            if (lineBounds.minX < minX) minX = lineBounds.minX;
            if (lineBounds.maxX > maxX) maxX = lineBounds.maxX;
            if (lineBounds.minY < minY) minY = lineBounds.minY;
            if (lineBounds.maxY > maxY) maxY = lineBounds.maxY;
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
      DebugLogger.warn("_computeBoundsCPU: Resulting bounds NaN/Infinity.");
      return null;
    }
    return {
      minX,
      maxX,
      minY,
      maxY,
      coordinateSpace: {
        x: this.logX ? "log" : "linear",
        y: this.logY ? "log" : "linear",
      },
    };
  }

  /**
   * Auto-scale to fit all enabled lines in the current coordinate space.
   *
   * **IMPORTANT**: This method operates within the current coordinate space (linear or log)
   * and does NOT change coordinate spaces. It calculates bounds appropriate for the current
   * axis configuration and applies the transform.
   *
   * **Use autoScale() when:**
   * - Want to fit all data in the current coordinate space
   * - Need simple auto-scaling without changing coordinate spaces
   * - Don't need to preserve current zoom/pan state
   *
   * **For coordinate space changes, use:**
   * - `transformToLogSpace()` - Switch to or operate in log space
   * - `transformToLinearSpace()` - Switch to or operate in linear space
   *
   * @returns DataBounds object with calculated bounds in current coordinate space, or null if no valid data
   *
   * @example
   * ```typescript
   * // Auto-scale in current coordinate space (doesn't change coordinate system)
   * plotter.autoScale(); // Works in linear, log, or mixed coordinate spaces
   * 
   * // To change coordinate spaces, use transform methods instead:
   * plotter.setLogAxis(false, true); // Enable log Y
   * const bounds = plotter.getAllDataBounds();
   * if (bounds) plotter.transformToLogSpace(bounds); // Proper coordinate space change
   * ```
   */
  public autoScale(): DataBounds | null {
    if (this.numLines === 0) {
      DebugLogger.warn("autoScale: No lines initialized.");
      return null;
    }

    let bounds: DataBounds | null = null;

    console.time("CPU Bounds Calculation");
    bounds = this._computeBoundsCPU();
    console.timeEnd("CPU Bounds Calculation");

    if (!bounds) {
      DebugLogger.warn(
        "autoScale: No valid data bounds found. Setting global transform to default."
      );
      this.setGlobalTransform([1.0, 1.0], [0.0, 0.0]);
      return null;
    }

    const { minX, maxX, minY, maxY } = bounds;
    const [scaleX, scaleY, offsetX, offsetY] = calculateAutoScaleTransform(bounds);

    DebugLogger.log(
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
   * Computes sharp turn detection for a line with caching and optimizations.
   * @param lineId Line identifier
   * @param pointsArray Points array for the line
   * @param numPts Number of points in the line
   * @returns Boolean array indicating sharp turns for each point
   */
  private computeSharpTurns(lineId: number, pointsArray: Float32Array, numPts: number): boolean[] {
    // Use a faster hash based on array length and first/last points for change detection
    const quickHash = `${numPts}_${pointsArray[0]}_${pointsArray[1]}_${pointsArray[numPts * 2 - 2]}_${pointsArray[numPts * 2 - 1]}`;

    // Check if we have cached results for this line and points haven't changed
    if (this.sharpTurnCache.has(lineId) && this.pointsHashCache.get(lineId) === quickHash) {
      return this.sharpTurnCache.get(lineId)!;
    }

    const sharpnessForLine: boolean[] = new Array(numPts).fill(false);

    if (numPts >= 3) { // Need at least 3 points for an interior point
      // Pre-calculate threshold for fewer comparisons
      const sharpThreshold = VERY_SHARP_TURN_DOT_THRESHOLD;

      for (let i = 1; i < numPts - 1; i++) {
        const p0x = pointsArray[(i - 1) * 2];
        const p0y = pointsArray[(i - 1) * 2 + 1];
        const p1x = pointsArray[i * 2];
        const p1y = pointsArray[i * 2 + 1];
        const p2x = pointsArray[(i + 1) * 2];
        const p2y = pointsArray[(i + 1) * 2 + 1];

        // Calculate direction vectors
        let d0x = p1x - p0x;
        let d0y = p1y - p0y;
        let d1x = p2x - p1x;
        let d1y = p2y - p1y;

        // Calculate squared lengths to avoid sqrt when possible
        const len_d0_sq = d0x * d0x + d0y * d0y;
        const len_d1_sq = d1x * d1x + d1y * d1y;

        // Skip normalization if either segment is too short
        if (len_d0_sq < COINCIDENT_POINT_EPSILON * COINCIDENT_POINT_EPSILON ||
          len_d1_sq < COINCIDENT_POINT_EPSILON * COINCIDENT_POINT_EPSILON) {
          continue;
        }

        // Normalize only when necessary
        const len_d0 = Math.sqrt(len_d0_sq);
        const len_d1 = Math.sqrt(len_d1_sq);
        d0x /= len_d0;
        d0y /= len_d0;
        d1x /= len_d1;
        d1y /= len_d1;

        const dotVal = d0x * d1x + d0y * d1y;
        if (dotVal < sharpThreshold) {
          sharpnessForLine[i] = true;
        }
      }
    }

    // Cache the results with the quick hash
    this.sharpTurnCache.set(lineId, sharpnessForLine);
    this.pointsHashCache.set(lineId, quickHash);

    return sharpnessForLine;
  }

  /**
   * Helper to setup vertex attributes with error handling.
   * @param attributes Array of attribute configurations
   * @param stride Vertex stride in bytes
   */
  private setupVertexAttributes(
    attributes: Array<{
      name: string;
      size: number;
      offset: number;
    }>,
    stride: number
  ): void {
    const gl = this.gl;

    for (const attr of attributes) {
      const location = gl.getAttribLocation(this.prog!, attr.name);
      if (location === -1) {
        DebugLogger.warn(`Attribute '${attr.name}' not found in main program.`);
      } else {
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(
          location,
          attr.size,
          gl.FLOAT,
          false,
          stride,
          attr.offset
        );
      }
    }
  }

  /**
   * Generic helper to update UBO data and sync with GPU buffer.
   * @param byteOffsets Array of byte offsets to update
   * @param dataViews Array of typed array views containing the data
   */
  private updateUBOData(byteOffsets: number[], dataViews: ArrayBufferView[]): void {
    const gl = this.gl;
    if (!this.lineDataUBO || byteOffsets.length !== dataViews.length) return;

    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lineDataUBO);
    for (let i = 0; i < byteOffsets.length; i++) {
      gl.bufferSubData(gl.UNIFORM_BUFFER, byteOffsets[i], dataViews[i]);
    }
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  /**
   * Updates the per-line transform (scale and offset) for multiple lines using UBO updates.
   */
  public updateLinesTransform(
    lineIds: number[],
    scale: [number, number],
    offset: [number, number]
  ): void {
    if (!this.lineDataUBO) {
      DebugLogger.warn("updateLinesTransform: UBO not available.");
      return;
    }

    const byteOffsets: number[] = [];
    const dataViews: Float32Array[] = [];

    for (const lineId of lineIds) {
      if (lineId < 0 || lineId >= this.numLines) {
        DebugLogger.warn(`updateLinesTransform: Invalid lineId ${lineId}.`);
        continue;
      }

      const byteOffset = lineId * this.lineDataStride + OFFSET_TRANSFORM;

      // Update the local data view
      this.lineDataView.setFloat32(byteOffset + 0 * BYTES_PER_FLOAT, scale[0], true);
      this.lineDataView.setFloat32(byteOffset + 1 * BYTES_PER_FLOAT, scale[1], true);
      this.lineDataView.setFloat32(byteOffset + 2 * BYTES_PER_FLOAT, offset[0], true);
      this.lineDataView.setFloat32(byteOffset + 3 * BYTES_PER_FLOAT, offset[1], true);

      // Create view for this transform data
      const transformView = new Float32Array(this.lineDataArrayBuffer, byteOffset, 4);
      byteOffsets.push(byteOffset);
      dataViews.push(transformView);
    }

    if (byteOffsets.length > 0) {
      this.updateUBOData(byteOffsets, dataViews);
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
      DebugLogger.warn(`updateLineColor: Invalid lineId ${lineId}`);
      return;
    }
    if (!this.lineDataUBO) {
      DebugLogger.warn("updateLineColor: UBO not available.");
      return;
    }

    const byteOffset = lineId * this.lineDataStride + OFFSET_COLOR;

    // Update the local data view
    this.lineDataView.setFloat32(byteOffset + 0 * BYTES_PER_FLOAT, color[0], true);
    this.lineDataView.setFloat32(byteOffset + 1 * BYTES_PER_FLOAT, color[1], true);
    this.lineDataView.setFloat32(byteOffset + 2 * BYTES_PER_FLOAT, color[2], true);
    this.lineDataView.setFloat32(byteOffset + 3 * BYTES_PER_FLOAT, color[3], true);

    // Use pre-allocated buffer and helper
    this.reusableFloat32Array4.set(color);
    this.updateUBOData([byteOffset], [this.reusableFloat32Array4]);
  }

  /**
   * Updates the thickness for a specific line.
   */
  public updateLineThickness(lineId: number, newThickness: number): void {
    if (lineId < 0 || lineId >= this.numLines) {
      DebugLogger.warn(`updateLineThickness: Invalid lineId ${lineId}`);
      return;
    }
    if (!this.lineDataUBO) {
      DebugLogger.warn("updateLineThickness: UBO not available.");
      return;
    }

    const byteOffset = lineId * this.lineDataStride + OFFSET_THICKNESS;
    this.lineDataView.setFloat32(byteOffset, newThickness, true);

    // Use pre-allocated buffer and helper
    this.reusableFloat32Array4[0] = newThickness;
    this.updateUBOData([byteOffset], [this.reusableFloat32Array4.subarray(0, 1)]);
  }

  /**
   * Enables or disables rendering of specific lines.
   */
  public setLinesEnabled(lineIds: number[], enabled: boolean): void {
    if (!this.lineDataUBO) {
      DebugLogger.warn("setLinesEnabled: UBO not available.");
      return;
    }
    const updatedIndices: { byteOffset: number; numPoints: number }[] = [];
    for (const lineId of lineIds) {
      if (lineId < 0 || lineId >= this.numLines) {
        DebugLogger.warn(`setLinesEnabled: Invalid lineId ${lineId}.`);
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
      const byteOffsets: number[] = [];
      const dataViews: Int32Array[] = [];

      for (const update of updatedIndices) {
        this.reusableInt32Array1[0] = update.numPoints;
        byteOffsets.push(update.byteOffset);
        dataViews.push(this.reusableInt32Array1.slice()); // Create a copy for this update
      }

      this.updateUBOData(byteOffsets, dataViews);
    }
  }

  /**
   * Enables or disables rendering of a single line.
   */
  public setLineEnabled(lineId: number, enabled: boolean): void {
    this.setLinesEnabled([lineId], enabled);
  }

  /**
   * Enable or disable logarithmic scaling for X and/or Y axes.
   * 
   * When enabled, coordinates are transformed using log₁₀ on the GPU in real-time.
   * Negative and zero values are automatically filtered out (moved off-screen).
   * 
   * **Important Notes:**
   * - Transformation happens on GPU for optimal performance
   * - No graph reinitialization required - changes apply immediately
   * - Auto-scaling will automatically account for log transformation
   * 
   * **Example Usage:**
   * ```typescript
   * // Enable log Y-axis for exponential data
   * thickPlotter.setLogAxis(false, true);
   * 
   * // Enable both axes for power-law data
   * thickPlotter.setLogAxis(true, true);
   * 
   * // Disable all log scaling
   * thickPlotter.setLogAxis(false, false);
   * ```
   * 
   * @param x Enable logarithmic base-10 scaling for X-axis
   * @param y Enable logarithmic base-10 scaling for Y-axis
   */
  public setLogAxis(x: boolean, y: boolean): void {
    this.logX = x;
    this.logY = y;
  }

  /**
   * Auto-scale the plotter to fit log-transformed data, using either actual data bounds
   * or converting existing transform-based viewport bounds to log space.
   * 
   * This function intelligently handles the transition from linear to log space by
   * using actual data bounds when provided, or falling back to transforming the 
   * current viewport bounds from linear to log space.
   * 
   * **Use Cases:**
   * - After toggling log axes to maintain current view
   * - For smooth transitions between linear and log representations  
   * - When you want to preserve user's current zoom/pan state
   * - For accurate scaling based on actual data bounds
   * 
   * **Example Usage:**
   * ```typescript
   * // Preserve current coordinate space (recommended for maintaining zoom/pan)
   * const bounds = thickPlotter.getDataBounds();
   * thickPlotter.transformToLogSpace(bounds);
   * 
   * // Alternative: same result, preserves current coordinate space
   * thickPlotter.transformToLogSpace();
   * ```
   * 
   * @param dataBounds Optional actual data bounds {minX, maxX, minY, maxY}. 
   *                   If provided, uses actual data bounds instead of transform-based bounds.
   * @returns True if smart scaling was applied, false if transformation not feasible
   */
  public transformToLogSpace(dataBounds?: DataBounds | null): boolean {
    // If no log axes are enabled, nothing to do
    if (!this.logX && !this.logY) {
      DebugLogger.log("transformToLogSpace: No log axes enabled, no scaling needed");
      return true;
    }

    let viewBounds: DataBounds;

    if (dataBounds) {
      // Use actual data bounds (recommended approach)
      viewBounds = dataBounds;
      DebugLogger.log(`transformToLogSpace: Using actual data bounds - X[${viewBounds.minX.toFixed(3)}, ${viewBounds.maxX.toFixed(3)}], Y[${viewBounds.minY.toFixed(3)}, ${viewBounds.maxY.toFixed(3)}]`);
    } else {
      // Fallback: Calculate bounds from current transform (legacy approach)
      viewBounds = reverseGlobalTransform(this.globalScale, this.globalOffset, this.logX, this.logY);
      DebugLogger.log(`transformToLogSpace: Using transform-based bounds - X[${viewBounds.minX.toFixed(3)}, ${viewBounds.maxX.toFixed(3)}], Y[${viewBounds.minY.toFixed(3)}, ${viewBounds.maxY.toFixed(3)}]`);
    }

    // Check if bounds need coordinate space conversion
    let linearBounds = viewBounds;

    // If bounds are in log space but we need linear bounds for transformation
    if (viewBounds.coordinateSpace) {
      const needsConversion = (this.logX && viewBounds.coordinateSpace.x === "log") ||
        (this.logY && viewBounds.coordinateSpace.y === "log");

      if (needsConversion) {
        DebugLogger.log(`transformToLogSpace: Converting bounds from coordinate space X:${viewBounds.coordinateSpace.x}, Y:${viewBounds.coordinateSpace.y} to linear`);
        linearBounds = transformBoundsToLinearSpace(
          viewBounds,
          viewBounds.coordinateSpace.x === "log",
          viewBounds.coordinateSpace.y === "log"
        );
        DebugLogger.log(`transformToLogSpace: Linear bounds - X[${linearBounds.minX.toFixed(3)}, ${linearBounds.maxX.toFixed(3)}], Y[${linearBounds.minY.toFixed(3)}, ${linearBounds.maxY.toFixed(3)}]`);
      }
    }

    // Transform linear bounds to log space
    const logBounds = transformBoundsToLogSpace(linearBounds, this.logX, this.logY);
    if (!logBounds) {
      DebugLogger.log("transformToLogSpace: Cannot transform bounds to log space");
      return false;
    }

    // Calculate and apply new transform
    const [scaleX, scaleY, offsetX, offsetY] = calculateAutoScaleTransform(logBounds);
    this.setGlobalTransform([scaleX, scaleY], [offsetX, offsetY]);

    DebugLogger.log(`transformToLogSpace: Applied new transform - Scale[${scaleX.toFixed(4)}, ${scaleY.toFixed(4)}], Offset[${offsetX.toFixed(4)}, ${offsetY.toFixed(4)}]`);
    return true;
  }

  /**
   * Transform data bounds to linear space and apply appropriate scaling.
   *
   * **ENHANCED**: This method automatically handles coordinate space conversion.
   * It detects the coordinate space of input bounds and converts as needed.
   *
   * **Typical usage patterns:**
   * - **Switching to linear axes**: `getDataBounds()` → `transformToLinearSpace()` (preserves view)
   * - **Zoom/pan in linear space**: `getDataBounds()` → `transformToLinearSpace()`
   * - **Initial linear setup**: `getAllDataBounds()` → `transformToLinearSpace()`
   *
   * @param dataBounds Optional data bounds with coordinate space information.
   *                   If not provided, will attempt to get bounds from current transform.
   * @returns True if linear space transformation was applied successfully,
   *          false if transformation not feasible
   *
   * @example
   * ```typescript
   * // Switching from log to linear axes while preserving view
   * const bounds = plotter.getDataBounds(); // Gets bounds with coordinate space info
   * plotter.setLogAxis(false, false); // Switch to linear axes
   * const success = plotter.transformToLinearSpace(bounds); // Preserves current view
   * 
   * // Works seamlessly from any coordinate mode
   * const currentBounds = plotter.getDataBounds(); 
   * plotter.transformToLinearSpace(currentBounds); // Always handles conversion correctly!
   * ```
   */
  public transformToLinearSpace(dataBounds?: DataBounds | null): boolean {
    let viewBounds: DataBounds;

    if (dataBounds) {
      // Use actual data bounds (recommended approach)
      viewBounds = dataBounds;
      DebugLogger.log(`transformToLinearSpace: Using actual data bounds - X[${viewBounds.minX.toFixed(3)}, ${viewBounds.maxX.toFixed(3)}], Y[${viewBounds.minY.toFixed(3)}, ${viewBounds.maxY.toFixed(3)}]`);
    } else {
      // Fallback: Calculate bounds from current transform
      viewBounds = reverseGlobalTransform(this.globalScale, this.globalOffset, this.logX, this.logY);
      DebugLogger.log(`transformToLinearSpace: Using transform-based bounds - X[${viewBounds.minX.toFixed(3)}, ${viewBounds.maxX.toFixed(3)}], Y[${viewBounds.minY.toFixed(3)}, ${viewBounds.maxY.toFixed(3)}]`);
    }

    // Check if bounds need coordinate space conversion
    let linearBounds = viewBounds;

    // If bounds are in log space, convert them to linear space first
    if (viewBounds.coordinateSpace) {
      const needsConversion = (viewBounds.coordinateSpace.x === "log") ||
        (viewBounds.coordinateSpace.y === "log");

      if (needsConversion) {
        DebugLogger.log(`transformToLinearSpace: Converting bounds from coordinate space X:${viewBounds.coordinateSpace.x}, Y:${viewBounds.coordinateSpace.y} to linear`);
        linearBounds = transformBoundsToLinearSpace(
          viewBounds,
          viewBounds.coordinateSpace.x === "log",
          viewBounds.coordinateSpace.y === "log"
        );
        DebugLogger.log(`transformToLinearSpace: Converted bounds - X[${linearBounds.minX.toFixed(3)}, ${linearBounds.maxX.toFixed(3)}], Y[${linearBounds.minY.toFixed(3)}, ${linearBounds.maxY.toFixed(3)}]`);
      }
    }

    // Ensure coordinate space is set to linear
    linearBounds.coordinateSpace = {
      x: "linear",
      y: "linear",
    };

    // Calculate and apply linear transform
    const [scaleX, scaleY, offsetX, offsetY] = calculateAutoScaleTransform(linearBounds);
    this.setGlobalTransform([scaleX, scaleY], [offsetX, offsetY]);

    DebugLogger.log(`transformToLinearSpace: Applied linear transform - Scale[${scaleX.toFixed(4)}, ${scaleY.toFixed(4)}], Offset[${offsetX.toFixed(4)}, ${offsetY.toFixed(4)}]`);
    return true;
  }

  /**
   * Updates only the Y coordinates of the points for a given line.
   */
  public updateLineY(lineId: number, newY: Float32Array): void {
    if (lineId < 0 || lineId >= this.numLines) {
      DebugLogger.warn(`updateLineY: Invalid lineId ${lineId}`);
      return;
    }
    if (!this.pointsTexture) {
      DebugLogger.warn("updateLineY: pointsTexture is null.");
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
        DebugLogger.error(
          `updateLineY: Index ${yDataIndex} OOB length ${this.pointsData.length}.`
        );
        return;
      }
    }
    // Update GPU texture - optimized batching
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pointsTexture);

    // For small updates, use a single texSubImage2D call when possible
    if (numPts <= this.texWidth) {
      const startRow = Math.floor(startIdx / this.texWidth);
      const startCol = startIdx % this.texWidth;

      // Check if the line segment fits entirely in one row
      if (startCol + numPts <= this.texWidth) {
        const offsetFloats = startIdx * 2;
        const lengthFloats = numPts * 2;
        const subDataView = new Float32Array(
          this.pointsData.buffer,
          this.pointsData.byteOffset + offsetFloats * BYTES_PER_FLOAT,
          lengthFloats
        );
        gl.texSubImage2D(gl.TEXTURE_2D, 0, startCol, startRow, numPts, 1, gl.RG, gl.FLOAT, subDataView);
      } else {
        // Fallback to row-by-row updates for lines that span rows
        this.updateTextureByRows(gl, startIdx, numPts);
      }
    } else {
      // For very long lines, update row by row
      this.updateTextureByRows(gl, startIdx, numPts);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /**
   * Helper method to update texture data row by row.
   * @param gl WebGL context
   * @param startIdx Starting global point index
   * @param numPts Number of points to update
   */
  private updateTextureByRows(gl: WebGL2RenderingContext, startIdx: number, numPts: number): void {
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
      const subDataView = new Float32Array(
        this.pointsData.buffer,
        this.pointsData.byteOffset + offsetFloats * BYTES_PER_FLOAT,
        lengthFloats
      );

      gl.texSubImage2D(gl.TEXTURE_2D, 0, col, row, numPointsInBlock, 1, gl.RG, gl.FLOAT, subDataView);
      currentGlobalIndex += numPointsInBlock;
    }
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

    // Update global transform uniforms only when dirty
    if (this.globalTransformDirty) {
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
      this.globalTransformDirty = false;
    }
    if (this.locations.uViewportSize) {
      gl.uniform2f(this.locations.uViewportSize, gl.canvas.width, gl.canvas.height);
    }

    // Set log axis uniforms - use local log axis properties
    if (this.locations.uLogAxis) {
      gl.uniform2f(
        this.locations.uLogAxis,
        this.logX ? 1.0 : 0.0,
        this.logY ? 1.0 : 0.0
      );
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
    DebugLogger.log("Cleaning up WebglLineThick resources...");

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

    // Clear caches
    this.sharpTurnCache.clear();
    this.pointsHashCache.clear();
    // Reset location caches
    this.locations = {
      uPointsTex: null,
      uTexWidth: null,
      uTexHeight: null,
      uGlobalScale: null,
      uGlobalOffset: null,
      uViewportSize: null,
      uLogAxis: null,
    };
    // Reset global transform state
    this.globalScale = [1.0, 1.0];
    this.globalOffset = [0.0, 0.0];

    DebugLogger.log("WebglLineThick resources cleaned up.");
  }

  /**
   * Gets the configuration for a specific line by reading from the UBO data view.
   * Note: This returns a partial LineConfig as not all original data might be stored or easily retrievable.
   * Specifically, 'points' are on the GPU texture and not returned here.
   * @param lineId The ID of the line.
   * @returns A Partial<LineConfig> object or undefined if not found or UBO not ready.
   */
  public getLineConfig(lineId: number): Partial<LineConfig> | undefined {
    if (lineId < 0 || lineId >= this.numLines) {
      DebugLogger.warn(`Invalid lineId ${lineId} for getLineConfig`);
      return undefined;
    }

    if (!this.lineDataView || this.lineDataArrayBuffer.byteLength === 0) {
      DebugLogger.warn("getLineConfig: Line data view or UBO not initialized.");
      return undefined;
    }

    const byteOffset = lineId * this.lineDataStride;

    // Ensure the offset is within bounds
    if (byteOffset + OFFSET_THICKNESS + BYTES_PER_FLOAT > this.lineDataView.byteLength) {
      DebugLogger.warn(`getLineConfig: lineId ${lineId} results in offset out of bounds for lineDataView.`);
      return undefined;
    }

    const config: Partial<LineConfig> = {};

    // Read transform: scale.x, scale.y, offset.x, offset.y
    config.scale = [
      this.lineDataView.getFloat32(byteOffset + OFFSET_TRANSFORM + 0 * BYTES_PER_FLOAT, true),
      this.lineDataView.getFloat32(byteOffset + OFFSET_TRANSFORM + 1 * BYTES_PER_FLOAT, true),
    ];
    config.offset = [
      this.lineDataView.getFloat32(byteOffset + OFFSET_TRANSFORM + 2 * BYTES_PER_FLOAT, true),
      this.lineDataView.getFloat32(byteOffset + OFFSET_TRANSFORM + 3 * BYTES_PER_FLOAT, true),
    ];

    // Read color: r, g, b, a
    config.color = [
      this.lineDataView.getFloat32(byteOffset + OFFSET_COLOR + 0 * BYTES_PER_FLOAT, true),
      this.lineDataView.getFloat32(byteOffset + OFFSET_COLOR + 1 * BYTES_PER_FLOAT, true),
      this.lineDataView.getFloat32(byteOffset + OFFSET_COLOR + 2 * BYTES_PER_FLOAT, true),
      this.lineDataView.getFloat32(byteOffset + OFFSET_COLOR + 3 * BYTES_PER_FLOAT, true),
    ];

    // Read thickness
    config.thickness = this.lineDataView.getFloat32(byteOffset + OFFSET_THICKNESS, true);

    // Read enabled status (derived from uLines[lineId].indices.y which is numPoints)
    // If numPoints is 0, it's disabled.
    const numPoints = this.lineDataView.getInt32(byteOffset + OFFSET_INDICES + 1 * BYTES_PER_INT, true);
    config.enabled = numPoints > 0;

    return config;
  }

  /**
   * Get the current global transform scale values.
   * @returns [scaleX, scaleY] array
   */
  public getGlobalScale(): [number, number] {
    return [this.globalScale[0], this.globalScale[1]];
  }

  /**
   * Get the current global transform offset values.
   * @returns [offsetX, offsetY] array
   */
  public getGlobalOffset(): [number, number] {
    return [this.globalOffset[0], this.globalOffset[1]];
  }
}
