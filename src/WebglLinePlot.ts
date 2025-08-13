//import { ColorRGBA } from "./ColorRGBA";
import type { WebglPlot } from "./webglplot";
import type { LineConfig } from "./LineConfig";
import { DebugLogger } from "./DebugLogger";
export type { LineConfig }; // Re-export LineConfig

export class WebglLinePlot {
  private wglp: WebglPlot;
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

  constructor(wglp: WebglPlot, maxLines: number) {
    this.wglp = wglp;
    this.gl = wglp.gl;
    const gl = this.gl;
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

  public updateLineThickness(lineId: number, thickness: number): void {
    if (lineId < 0 || lineId >= this.numLines) {
      DebugLogger.warn(`Invalid lineId ${lineId} for updateLineThickness`);
      return;
    }
    this.linesConfig[lineId].thickness = thickness;
  }

  public setLineEnabled(lineId: number, enabled: boolean): void {
    if (lineId < 0 || lineId >= this.numLines) {
      DebugLogger.warn(`Invalid lineId ${lineId} for setLineEnabled`);
      return;
    }
    this.linesConfig[lineId].enabled = enabled;
  }

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

  public autoScaleEnabledLines(): void {
    if (this.numLines === 0) {
      DebugLogger.warn("No lines to auto-scale.");
      return;
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
      
      // Pre-check: if log axes are enabled, verify this line has enough positive values
      // to be meaningful for auto-scaling
      if (this.wglp.logX || this.wglp.logY) {
        let validPointCount = 0;
        const totalPoints = points.length / 2;
        
        for (let j = 0; j < points.length; j += 2) {
          const x = points[j];
          const y = points[j + 1];
          
          // Check if this point would be visible on log axes
          const xValid = !this.wglp.logX || x > 0;
          const yValid = !this.wglp.logY || y > 0;
          
          if (xValid && yValid) {
            validPointCount++;
          }
        }
        
        // Skip lines that have less than 10% positive values or fewer than 2 valid points
        // This prevents lines with mostly negative data from affecting auto-scaling
        const validRatio = validPointCount / totalPoints;
        if (validPointCount < 2 || validRatio < 0.1) {
          DebugLogger.log(`autoScaleEnabledLines: Skipping line ${i} - only ${validPointCount}/${totalPoints} (${(validRatio*100).toFixed(1)}%) points valid for log axes`);
          continue;
        }
      }
      
      foundEnabledData = true;

      for (let j = 0; j < points.length; j += 2) {
        let x = points[j];
        let y = points[j + 1];
        
        // Apply log transformation if enabled (same as GPU)
        if (this.wglp.logX) {
          if (x > 0) {
            x = Math.log10(x);
          } else {
            continue; // Skip negative/zero values for log X axis
          }
        }
        if (this.wglp.logY) {
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
      return;
    }

    let newGlobalScaleX = 1.0;
    let newGlobalScaleY = 1.0;
    let newGlobalOffsetX = 0.0;
    let newGlobalOffsetY = 0.0;

    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const ndcWidth = 2.0; // NDC coordinates from -1 to 1
    const ndcHeight = 2.0;
    const epsilon = 1e-9; // To avoid division by zero or very small numbers

    if (rangeX > epsilon) {
      newGlobalScaleX = ndcWidth / rangeX;
      const centerX = minX + rangeX / 2.0;
      newGlobalOffsetX = 0.0 - centerX * newGlobalScaleX;
    } else {
      // Single point or all points have same X. Center it.
      newGlobalScaleX = 1.0; // Default zoom
      newGlobalOffsetX = 0.0 - minX * newGlobalScaleX;
    }

    if (rangeY > epsilon) {
      newGlobalScaleY = ndcHeight / rangeY;
      const centerY = minY + rangeY / 2.0;
      newGlobalOffsetY = 0.0 - centerY * newGlobalScaleY;
    } else {
      // Single point or all points have same Y. Center it.
      newGlobalScaleY = 1.0; // Default zoom
      newGlobalOffsetY = 0.0 - minY * newGlobalScaleY;
    }

    this.setGlobalTransform(
      [newGlobalScaleX, newGlobalScaleY],
      [newGlobalOffsetX, newGlobalOffsetY]
    );
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
    
    // Set log axis uniforms
    gl.uniform2f(
      this.locations.u_log_axis,
      this.wglp.logX ? 1.0 : 0.0,
      this.wglp.logY ? 1.0 : 0.0
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
}
