//import { ColorRGBA } from "./ColorRGBA";
import type { LineConfig } from "./LineConfig";
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
export type { LineConfig }; // Re-export LineConfig

export class WebglLinePlot {
  private gl: WebGL2RenderingContext;
  private maxLines: number;
  private linesConfig: LineConfig[] = [];
  private numLines = 0;
  private vertexBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null; // Or UBO for colors later
  public prog: WebGLProgram | null = null;
  private lineStarts: number[] = []; // To store the starting index of each line's vertices
  private lineLengths: number[] = []; // To store the number of vertices for each line
  private globalScale: [number, number] = [1, 1];
  private globalOffset: [number, number] = [0, 0];
  private locations: {
    a_position?: number;
    a_color?: number;
    u_line_scale?: WebGLUniformLocation | null;
    u_line_offset?: WebGLUniformLocation | null;
    u_global_scale?: WebGLUniformLocation | null;
    u_global_offset?: WebGLUniformLocation | null;
    u_opacity?: WebGLUniformLocation | null;
    u_log_axis?: WebGLUniformLocation | null;
  } = {};

  // Log axis flags
  public logX: boolean = false;
  public logY: boolean = false;

  constructor(gl: WebGL2RenderingContext, maxLines: number) {
    this.gl = gl;
    this.maxLines = maxLines;
    this.linesConfig = [];
    this.numLines = 0;
    this.vertexBuffer = null;
    this.colorBuffer = null;
    this.lineStarts = [];
    this.lineLengths = [];
    this.globalScale = [1, 1];
    this.globalOffset = [0, 0];

    this.prog = this._createShaderProgram();

    if (!this.prog) {
      DebugLogger.error("Failed to create shader program.");
      // Depending on desired error handling, you might throw an error here
      // throw new Error("Failed to create shader program");
      return;
    }

    this.locations = {
      a_position: gl.getAttribLocation(this.prog, "a_position"),
      a_color: gl.getAttribLocation(this.prog, "a_color"),
      u_line_scale: gl.getUniformLocation(this.prog, "u_line_scale"),
      u_line_offset: gl.getUniformLocation(this.prog, "u_line_offset"),
      u_global_scale: gl.getUniformLocation(this.prog, "u_global_scale"),
      u_global_offset: gl.getUniformLocation(this.prog, "u_global_offset"),
      u_opacity: gl.getUniformLocation(this.prog, "u_opacity"),
      u_log_axis: gl.getUniformLocation(this.prog, "u_log_axis"),
    };

    // Basic GL setup
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // It's good practice to unbind programs when not actively using them for a specific draw call
    // However, uniforms are set per program, so it might be bound again in draw()
    // For now, let's leave it unbound after initial setup.
    // gl.useProgram(this.prog);
    // gl.useProgram(null);
  }

  private _createShaderProgram(): WebGLProgram | null {
    const gl = this.gl;

    const vsSource = `#version 300 es
      layout(location = 0) in vec2 a_position; // Assuming location 0 for position
      layout(location = 1) in vec3 a_color;    // Assuming location 1 for color

      uniform vec2 u_line_scale;
      uniform vec2 u_line_offset;
      uniform vec2 u_global_scale;
      uniform vec2 u_global_offset;
      uniform vec2 u_log_axis; // x: logX enabled (1.0/0.0), y: logY enabled (1.0/0.0)

      out vec3 v_color;

      void main() {
        vec2 pos = a_position;
        
        // Apply logarithmic transformation if enabled
        if (u_log_axis.x > 0.5) {
          if (pos.x > 0.0) {
            pos.x = log(pos.x) / log(10.0); // log10
          } else {
            pos.x = -1000.0; // Move negative/zero values far off-screen
          }
        }
        if (u_log_axis.y > 0.5) {
          if (pos.y > 0.0) {
            pos.y = log(pos.y) / log(10.0); // log10
          } else {
            pos.y = -1000.0; // Move negative/zero values far off-screen
          }
        }
        
        gl_Position = vec4((pos * u_line_scale + u_line_offset) * u_global_scale + u_global_offset, 0.0, 1.0);
        v_color = a_color;
      }
    `;

    const fsSource = `#version 300 es
      precision mediump float;
      in vec3 v_color;
      uniform float u_opacity;
      out vec4 outColor;

      void main() {
        outColor = vec4(v_color, u_opacity);
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
      DebugLogger.error("Unable to create vertex shader");
      return null;
    }
    gl.shaderSource(vertexShader, vsSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      DebugLogger.error(
        `Error compiling vertex shader: ${gl.getShaderInfoLog(vertexShader) || "Unknown error"}`
      );
      gl.deleteShader(vertexShader);
      return null;
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
      DebugLogger.error("Unable to create fragment shader");
      gl.deleteShader(vertexShader); // Clean up vertex shader
      return null;
    }
    gl.shaderSource(fragmentShader, fsSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      DebugLogger.error(
        `Error compiling fragment shader: ${gl.getShaderInfoLog(fragmentShader) || "Unknown error"}`
      );
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    const program = gl.createProgram();
    if (!program) {
      DebugLogger.error("Unable to create shader program");
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      DebugLogger.error(
        `Error linking shader program: ${gl.getProgramInfoLog(program) || "Unknown error"}`
      );
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    // It's good practice to detach and delete shaders after linking
    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }

  public initLines(linesConfig: LineConfig[]): void {
    const gl = this.gl;

    // 1. Store Configurations & Reset State
    if (linesConfig.length > this.maxLines) {
      DebugLogger.warn(
        `Number of lines (${linesConfig.length}) exceeds maxLines (${this.maxLines}). Slicing.`
      );
      this.linesConfig = linesConfig
        .slice(0, this.maxLines)
        .map((lc) => ({ ...lc }));
    } else {
      this.linesConfig = linesConfig.map((lc) => ({ ...lc })); // Create copies
    }

    this.numLines = this.linesConfig.length;
    this.lineStarts = [];
    this.lineLengths = [];

    if (this.vertexBuffer) {
      gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }
    if (this.colorBuffer) {
      gl.deleteBuffer(this.colorBuffer);
      this.colorBuffer = null;
    }

    // 2. Handle No Lines Case
    if (this.numLines === 0) {
      return;
    }

    // 3. Prepare Vertex and Color Data
    let totalVertices = 0;
    for (const line of this.linesConfig) {
      // Ensure defaults for optional properties
      line.scale = line.scale || [1, 1];
      line.offset = line.offset || [0, 0];
      if (line.enabled === undefined) line.enabled = true;
      if (line.thickness === undefined) line.thickness = 1.0; // Default thickness

      const numPoints = line.points.length / 2;
      this.lineStarts.push(totalVertices);
      this.lineLengths.push(numPoints);
      totalVertices += numPoints;
    }

    const allVertexData = new Float32Array(totalVertices * 2);
    const allColorData = new Float32Array(totalVertices * 3); // 3 components: R, G, B

    let vertexOffset = 0;
    let colorOffset = 0;
    for (let i = 0; i < this.numLines; i++) {
      const line = this.linesConfig[i];

      // Use original points - log transformation now happens on GPU
      allVertexData.set(line.points, vertexOffset);

      for (let j = 0; j < this.lineLengths[i]; j++) {
        allColorData[colorOffset++] = line.color[0]; // R
        allColorData[colorOffset++] = line.color[1]; // G
        allColorData[colorOffset++] = line.color[2]; // B
      }
      vertexOffset += line.points.length;
    }

    // 4. Create and Populate WebGL Buffers
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, allVertexData, gl.STATIC_DRAW);

    this.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, allColorData, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null); // Unbind

    // 5. Set Initial Global Uniforms
    if (
      this.prog &&
      this.locations.u_global_scale &&
      this.locations.u_global_offset
    ) {
      gl.useProgram(this.prog);
      gl.uniform2f(
        this.locations.u_global_scale,
        this.globalScale[0],
        this.globalScale[1]
      );
      gl.uniform2f(
        this.locations.u_global_offset,
        this.globalOffset[0],
        this.globalOffset[1]
      );
      gl.useProgram(null);
    }
  }

  public cleanup(): void {
    const gl = this.gl;
    if (this.prog) {
      gl.deleteProgram(this.prog);
      this.prog = null;
    }
    if (this.vertexBuffer) {
      gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }
    if (this.colorBuffer) {
      gl.deleteBuffer(this.colorBuffer);
      this.colorBuffer = null;
    }
    this.linesConfig = [];
    this.numLines = 0;
    this.lineStarts = [];
    this.lineLengths = [];
  }

  public updateLinePoints(lineId: number, points: Float32Array): void {
    if (lineId < 0 || lineId >= this.numLines) {
      DebugLogger.warn(`Invalid lineId ${lineId} for updateLinePoints`);
      return;
    }
    if (!this.vertexBuffer) {
      DebugLogger.warn("Vertex buffer not initialized for updateLinePoints");
      return;
    }

    const currentLineConfig = this.linesConfig[lineId];
    const numPointsInLine = this.lineLengths[lineId];

    if (points.length / 2 !== numPointsInLine) {
      DebugLogger.warn(
        `Number of points in provided data (${points.length / 2}) ` +
        `does not match existing points in line ${lineId} (${numPointsInLine}). ` +
        `Cannot change number of points with this method.`
      );
      return;
    }

    currentLineConfig.points = points;

    const startVertexIndex = this.lineStarts[lineId];
    const byteOffset = startVertexIndex * 2 * Float32Array.BYTES_PER_ELEMENT; // 2 floats (x,y) per vertex

    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, byteOffset, points);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  public updateLineY(lineId: number, newY: Float32Array): void {
    if (lineId < 0 || lineId >= this.numLines) {
      DebugLogger.warn(`Invalid lineId ${lineId} for updateLineY`);
      return;
    }
    if (!this.vertexBuffer) {
      DebugLogger.warn("Vertex buffer not initialized for updateLineY");
      return;
    }

    const currentLineConfig = this.linesConfig[lineId];
    const numPointsInLine = this.lineLengths[lineId];

    if (newY.length !== numPointsInLine) {
      DebugLogger.warn(
        `Length of newY array (${newY.length}) does not match ` +
        `number of points in line ${lineId} (${numPointsInLine}).`
      );
      return;
    }

    // Update Y coordinates in the current points array (no log transformation - handled on GPU)
    for (let i = 0; i < numPointsInLine; i++) {
      currentLineConfig.points[i * 2 + 1] = newY[i];
    }

    const startVertexIndex = this.lineStarts[lineId];
    const byteOffset = startVertexIndex * 2 * Float32Array.BYTES_PER_ELEMENT;

    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, byteOffset, currentLineConfig.points);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  public updateLineColor(
    lineId: number,
    color: [number, number, number, number]
  ): void {
    if (lineId < 0 || lineId >= this.numLines) {
      DebugLogger.warn(`Invalid lineId ${lineId} for updateLineColor`);
      return;
    }
    if (!this.colorBuffer) {
      DebugLogger.warn("Color buffer not initialized for updateLineColor");
      return;
    }

    this.linesConfig[lineId].color = color;

    const startPointIndex = this.lineStarts[lineId];
    const numPoints = this.lineLengths[lineId];
    const colorDataForLine = new Float32Array(numPoints * 3);
    let currentOffset = 0;
    for (let i = 0; i < numPoints; i++) {
      colorDataForLine[currentOffset++] = color[0]; // R
      colorDataForLine[currentOffset++] = color[1]; // G
      colorDataForLine[currentOffset++] = color[2]; // B
    }

    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      startPointIndex * 3 * Float32Array.BYTES_PER_ELEMENT,
      colorDataForLine
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  public updateLineTransform(
    lineId: number,
    scale: [number, number],
    offset: [number, number]
  ): void {
    if (lineId < 0 || lineId >= this.numLines) {
      DebugLogger.warn(`Invalid lineId ${lineId} for updateLineTransform`);
      return;
    }
    this.linesConfig[lineId].scale = scale;
    this.linesConfig[lineId].offset = offset;
  }

  /**
   * Update the thickness for a specific line.
   * @param lineId ID of the line to update
   * @param thickness New thickness value for the line
   */
  public updateLineThickness(lineId: number, thickness: number): void {
    if (lineId < 0 || lineId >= this.numLines) {
      DebugLogger.warn(`Invalid lineId ${lineId} for updateLineThickness`);
      return;
    }
    this.linesConfig[lineId].thickness = thickness;
  }

  /**
   * Enable or disable rendering for a specific line.
   * @param lineId ID of the line to enable/disable
   * @param enabled True to enable rendering, false to disable
   */
  public setLineEnabled(lineId: number, enabled: boolean): void {
    if (lineId < 0 || lineId >= this.numLines) {
      DebugLogger.warn(`Invalid lineId ${lineId} for setLineEnabled`);
      return;
    }
    this.linesConfig[lineId].enabled = enabled;
  }

  /**
   * Enable or disable rendering for multiple lines at once.
   * @param lineIds Array of line IDs to enable/disable
   * @param enabled True to enable rendering, false to disable
   */
  public setMultipleLinesEnabled(lineIds: number[], enabled: boolean): void {
    for (const lineId of lineIds) {
      if (lineId >= 0 && lineId < this.numLines) {
        this.linesConfig[lineId].enabled = enabled;
      } else {
        DebugLogger.warn(`Invalid lineId ${lineId} in setMultipleLinesEnabled`);
      }
    }
  }

  /**
   * Update transform parameters for multiple lines at once.
   * @param lineIds Array of line IDs to update
   * @param scale Scale factors [scaleX, scaleY]
   * @param offset Offset values [offsetX, offsetY]
   */
  public updateMultipleLinesTransform(
    lineIds: number[],
    scale: [number, number],
    offset: [number, number]
  ): void {
    for (const lineId of lineIds) {
      if (lineId >= 0 && lineId < this.numLines) {
        this.linesConfig[lineId].scale = [scale[0], scale[1]];
        this.linesConfig[lineId].offset = [offset[0], offset[1]];
      } else {
        DebugLogger.warn(`Invalid lineId ${lineId} in updateMultipleLinesTransform`);
      }
    }
  }

  /**
   * Set the global transformation matrix for the plot.
   * @param scale Global scale factors [scaleX, scaleY] 
   * @param offset Global offset values [offsetX, offsetY]
   */
  public setGlobalTransform(
    scale: [number, number],
    offset: [number, number]
  ): void {
    this.globalScale = scale;
    this.globalOffset = offset;

    if (
      this.prog &&
      this.locations.u_global_scale &&
      this.locations.u_global_offset
    ) {
      this.gl.useProgram(this.prog);
      this.gl.uniform2f(
        this.locations.u_global_scale,
        this.globalScale[0],
        this.globalScale[1]
      );
      this.gl.uniform2f(
        this.locations.u_global_offset,
        this.globalOffset[0],
        this.globalOffset[1]
      );
      this.gl.useProgram(null);
    }
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
   * thinPlotter.setLogAxis(false, true);
   * 
   * // Enable both axes for power-law data
   * thinPlotter.setLogAxis(true, true);
   * 
   * // Disable all log scaling
   * thinPlotter.setLogAxis(false, false);
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
   * const bounds = thinPlotter.getDataBounds();
   * thinPlotter.transformToLogSpace(bounds);
   * 
   * // Alternative: same result, preserves current coordinate space
   * thinPlotter.transformToLogSpace();
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
   * Get the data bounds of all enabled lines (for autoscaling purposes).
   * This returns the complete extent of all data and should be used with autoScale().
   * For preserving current coordinate space, use getDataBounds() instead.
   * @returns Object with minX, maxX, minY, maxY of all the data, or null if no valid data
   */
  public getAllDataBounds(): DataBounds | null {
    if (this.numLines === 0) {
      return null;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let foundEnabledData = false;

    for (let i = 0; i < this.numLines; i++) {
      const line = this.linesConfig[i];

      if (!line.enabled || line.points.length === 0) {
        continue;
      }

      const points = line.points;

      // Use shared utility for validation
      const validation = validateLineForLogAxes(points, this.logX, this.logY);
      if (!validation.isValid) {
        DebugLogger.log(`getAllDataBounds: Skipping line ${i} - only ${validation.validPointCount}/${validation.totalPoints} (${(validation.validRatio * 100).toFixed(1)}%) points valid for log axes`);
        continue;
      }

      foundEnabledData = true;

      // Use shared utility for bounds calculation
      const lineBounds = calculateLogAwareBounds(points, this.logX, this.logY);
      if (lineBounds) {
        if (lineBounds.minX < minX) minX = lineBounds.minX;
        if (lineBounds.maxX > maxX) maxX = lineBounds.maxX;
        if (lineBounds.minY < minY) minY = lineBounds.minY;
        if (lineBounds.maxY > maxY) maxY = lineBounds.maxY;
      }
    }

    if (
      !foundEnabledData ||
      !isFinite(minX) ||
      !isFinite(maxX) ||
      !isFinite(minY) ||
      !isFinite(maxY)
    ) {
      return null;
    }

    return {
      minX,
      maxX,
      minY,
      maxY,
      coordinateSpace: {
        x: this.logX ? "log" as const : "linear" as const,
        y: this.logY ? "log" as const : "linear" as const,
      },
    };
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
      DebugLogger.warn("No lines to auto-scale.");
      return null;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let foundEnabledData = false;

    for (let i = 0; i < this.numLines; i++) {
      const line = this.linesConfig[i];
      const scale = line.scale!; // Assured by initLines
      const offset = line.offset!; // Assured by initLines

      if (!line.enabled || line.points.length === 0) {
        continue;
      }

      const points = line.points;

      // Use shared utility for validation
      const validation = validateLineForLogAxes(points, this.logX, this.logY);
      if (!validation.isValid) {
        DebugLogger.log(`autoScale: Skipping line ${i} - only ${validation.validPointCount}/${validation.totalPoints} (${(validation.validRatio * 100).toFixed(1)}%) points valid for log axes`);
        continue;
      }

      foundEnabledData = true;

      for (let j = 0; j < points.length; j += 2) {
        let x = points[j];
        let y = points[j + 1];

        // Apply log transformation if enabled (same as GPU)
        if (this.logX) {
          if (x > 0) {
            x = Math.log10(x);
          } else {
            continue; // Skip negative/zero values for log X axis
          }
        }
        if (this.logY) {
          if (y > 0) {
            y = Math.log10(y);
          } else {
            continue; // Skip negative/zero values for log Y axis
          }
        }

        // Apply line transforms
        x = x * scale[0] + offset[0];
        y = y * scale[1] + offset[1];

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    if (
      !foundEnabledData ||
      !isFinite(minX) ||
      !isFinite(maxX) ||
      !isFinite(minY) ||
      !isFinite(maxY)
    ) {
      DebugLogger.warn(
        "No data available for scaling or bounds are invalid. Resetting global transform."
      );
      this.setGlobalTransform([1, 1], [0, 0]);
      return null;
    }

    const bounds = {
      minX,
      maxX,
      minY,
      maxY,
      coordinateSpace: {
        x: this.logX ? "log" as const : "linear" as const,
        y: this.logY ? "log" as const : "linear" as const,
      },
    };
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

  public draw = () => {
    if (
      !this.prog ||
      !this.vertexBuffer ||
      !this.colorBuffer ||
      this.numLines === 0 ||
      !this.locations ||
      this.locations.a_position === undefined || // Ensure locations are actually numbers
      this.locations.a_color === undefined ||
      !this.locations.u_global_scale ||
      !this.locations.u_global_offset ||
      !this.locations.u_line_scale ||
      !this.locations.u_line_offset ||
      !this.locations.u_opacity ||
      !this.locations.u_log_axis
    ) {
      return;
    }

    const gl = this.gl;
    gl.useProgram(this.prog);

    // Set Global Uniforms
    gl.uniform2f(
      this.locations.u_global_scale,
      this.globalScale[0],
      this.globalScale[1]
    );
    gl.uniform2f(
      this.locations.u_global_offset,
      this.globalOffset[0],
      this.globalOffset[1]
    );

    // Set log axis uniforms - use local log axis properties
    gl.uniform2f(
      this.locations.u_log_axis,
      this.logX ? 1.0 : 0.0,
      this.logY ? 1.0 : 0.0
    );

    // Bind Vertex Buffer and Set Attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(this.locations.a_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.locations.a_position);

    // Bind Color Buffer and Set Attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.vertexAttribPointer(this.locations.a_color, 3, gl.FLOAT, false, 0, 0); // 3 components: R,G,B
    gl.enableVertexAttribArray(this.locations.a_color);

    // Draw Each Line
    for (let i = 0; i < this.numLines; i++) {
      const line = this.linesConfig[i];
      if (!line.enabled) {
        continue;
      }

      // Set line-specific uniforms

      gl.uniform2f(this.locations.u_line_scale, line.scale![0], line.scale![1]);

      // Use non-null assertion since line.offset is guaranteed to be initialized in initLines
      gl.uniform2f(
        this.locations.u_line_offset,
        line.offset![0],
        line.offset![1]
      );
      gl.uniform1f(this.locations.u_opacity, line.color[3]); // Alpha for opacity

      gl.lineWidth(line.thickness!); // thickness is guaranteed by initLines
      gl.drawArrays(gl.LINE_STRIP, this.lineStarts[i], this.lineLengths[i]);
    }

    // Cleanup After Drawing
    gl.disableVertexAttribArray(this.locations.a_position);
    gl.disableVertexAttribArray(this.locations.a_color);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);
  };

  /**
   * Gets the configuration for a specific line.
   * @param lineId The ID of the line.
   * @returns The LineConfig object or undefined if not found.
   */
  public getLineConfig(lineId: number): LineConfig | undefined {
    if (lineId < 0 || lineId >= this.numLines) {
      DebugLogger.warn(`Invalid lineId ${lineId} for getLineConfig`);
      return undefined;
    }
    return this.linesConfig[lineId];
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
