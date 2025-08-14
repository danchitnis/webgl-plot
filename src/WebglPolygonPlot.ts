import { DebugLogger } from "./DebugLogger";

export interface PolygonConfig {
  fillColor: [number, number, number, number];
  strokeColor: [number, number, number, number];
  strokeWeight: number;
  isFilled: boolean;
  isStroked: boolean;
  points: Float32Array;
  scale?: [number, number];
  offset?: [number, number];
  enabled?: boolean;
}

const vsSource = `#version 300 es
  layout(location = 0) in vec2 a_position;

  uniform vec2 u_polygon_scale;
  uniform vec2 u_polygon_offset;
  uniform vec2 u_global_scale;
  uniform vec2 u_global_offset;

  void main() {
    vec2 scaled_position = a_position * u_polygon_scale + u_polygon_offset;
    gl_Position = vec4(scaled_position * u_global_scale + u_global_offset, 0.0, 1.0);
  }
`;

const vsStrokeSource = `#version 300 es
  layout(location = 0) in vec2 a_position;
  layout(location = 1) in vec2 a_normal;
  layout(location = 2) in float a_side;

  uniform vec2 u_polygon_scale;
  uniform vec2 u_polygon_offset;
  uniform vec2 u_global_scale;
  uniform vec2 u_global_offset;
  uniform vec2 u_viewport_size;
  uniform float u_stroke_weight;

  void main() {
    vec2 scaled_position = a_position * u_polygon_scale + u_polygon_offset;
    vec2 ndc_position = scaled_position * u_global_scale + u_global_offset;
    
    vec2 pixel_to_ndc = 2.0 / u_viewport_size;
    float stroke_radius_ndc = u_stroke_weight * 0.5;
    
    vec2 offset = a_normal * pixel_to_ndc * stroke_radius_ndc * a_side;
    
    gl_Position = vec4(ndc_position + offset, 0.0, 1.0);
  }
`;

const fsSource = `#version 300 es
  precision mediump float;
  uniform vec4 u_color;
  uniform float u_opacity;
  out vec4 outColor;

  void main() {
    outColor = vec4(u_color.rgb, u_color.a * u_opacity);
  }
`;

interface UniformLocations {
  u_polygon_scale: WebGLUniformLocation | null;
  u_polygon_offset: WebGLUniformLocation | null;
  u_global_scale: WebGLUniformLocation | null;
  u_global_offset: WebGLUniformLocation | null;
  u_color: WebGLUniformLocation | null;
  u_opacity: WebGLUniformLocation | null;
}

interface StrokeUniformLocations extends UniformLocations {
  u_viewport_size: WebGLUniformLocation | null;
  u_stroke_weight: WebGLUniformLocation | null;
}

interface CachedState {
  viewport: [number, number, number, number];
  globalScale: [number, number];
  globalOffset: [number, number];
  globalTransformDirty: boolean;
  viewportDirty: boolean;
}

export class WebglPolygonPlot {
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram | null;
  private strokeProg: WebGLProgram | null;
  private fillVAO: WebGLVertexArrayObject | null = null;
  private strokeVAO: WebGLVertexArrayObject | null = null;
  private uniformLocations: UniformLocations;
  private strokeUniformLocations: StrokeUniformLocations;

  public polygonsConfig: PolygonConfig[] = [];
  public numPolygons = 0;
  private vertexBuffer: WebGLBuffer | null = null;
  private strokeVertexBuffer: WebGLBuffer | null = null;
  private polygonStarts: number[] = [];
  private polygonLengths: number[] = [];
  private strokePolygonStarts: number[] = [];
  private strokePolygonLengths: number[] = [];
  private cachedState: CachedState;
  private tempArrays: {
    colorArray: Float32Array;
    opacityArray: Float32Array;
  };

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    
    // Initialize cached state
    const viewport = this.gl.getParameter(this.gl.VIEWPORT) as [number, number, number, number];
    this.cachedState = {
      viewport,
      globalScale: [1, 1],
      globalOffset: [0, 0],
      globalTransformDirty: true,
      viewportDirty: false
    };
    
    // Pre-allocate temporary arrays for draw operations
    this.tempArrays = {
      colorArray: new Float32Array(4),
      opacityArray: new Float32Array(1)
    };

    this.prog = this._createShaderProgram(vsSource, fsSource);
    this.strokeProg = this._createShaderProgram(vsStrokeSource, fsSource);

    if (!this.prog) {
      throw new Error("WebglPolygonPlot: Failed to create fill shader program.");
    }

    if (!this.strokeProg) {
      throw new Error("WebglPolygonPlot: Failed to create stroke shader program.");
    }

    // Initialize uniform locations with unified helper
    this.uniformLocations = this._getUniformLocations(this.prog);
    this.strokeUniformLocations = {
      ...this._getUniformLocations(this.strokeProg),
      u_viewport_size: this.gl.getUniformLocation(this.strokeProg, "u_viewport_size"),
      u_stroke_weight: this.gl.getUniformLocation(this.strokeProg, "u_stroke_weight")
    };
    
    // Create VAOs for efficient vertex setup
    this.fillVAO = this.gl.createVertexArray();
    this.strokeVAO = this.gl.createVertexArray();
    
    if (!this.fillVAO || !this.strokeVAO) {
      throw new Error("WebglPolygonPlot: Failed to create vertex array objects.");
    }

    // Enable blending
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    
    // Set up resize observer for viewport changes
    this._setupViewportTracking();
  }

  public initPolygons(polygonsConfig: PolygonConfig[]): void {
    // Normalize configurations with defaults
    this.polygonsConfig = polygonsConfig.map(config => this._normalizePolygonConfig(config));
    this.numPolygons = this.polygonsConfig.length;

    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }
    if (this.strokeVertexBuffer) {
      this.gl.deleteBuffer(this.strokeVertexBuffer);
      this.strokeVertexBuffer = null;
    }
    this.polygonStarts = [];
    this.polygonLengths = [];
    this.strokePolygonStarts = [];
    this.strokePolygonLengths = [];

    if (this.numPolygons === 0) {
      return;
    }

    // Initialize fill vertices
    let totalVertices = 0;
    for (const polygon of this.polygonsConfig) {
      if (polygon.points.length % 2 !== 0) {
        DebugLogger.warn(
          "WebglPolygonPlot: Polygon points array length should be even (x,y pairs). Skipping polygon."
        );
        continue;
      }
      this.polygonStarts.push(totalVertices / 2);
      const numPolygonVertices = polygon.points.length / 2;
      this.polygonLengths.push(numPolygonVertices);
      totalVertices += polygon.points.length;
    }

    if (totalVertices === 0 && this.numPolygons > 0) {
      DebugLogger.warn(
        "WebglPolygonPlot: No valid vertices found in polygon configurations."
      );
      this.numPolygons = 0;
      return;
    }

    // Create fill vertex buffer
    const allVertexData = new Float32Array(totalVertices);
    let offset = 0;
    for (const polygon of this.polygonsConfig) {
      if (polygon.points.length > 0 && polygon.points.length % 2 === 0) {
        allVertexData.set(polygon.points, offset);
        offset += polygon.points.length;
      }
    }

    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      allVertexData,
      this.gl.STATIC_DRAW
    );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    // Initialize stroke vertices
    this._generateStrokeGeometry();

    // Set up fill VAO
    this._setupFillVAO();
    
    // Mark global transforms as dirty to ensure they're updated on next draw
    this.cachedState.globalTransformDirty = true;
  }

  public cleanup(): void {
    if (this.prog) {
      this.gl.deleteProgram(this.prog);
      this.prog = null;
    }
    if (this.strokeProg) {
      this.gl.deleteProgram(this.strokeProg);
      this.strokeProg = null;
    }
    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }
    if (this.strokeVertexBuffer) {
      this.gl.deleteBuffer(this.strokeVertexBuffer);
      this.strokeVertexBuffer = null;
    }
    if (this.fillVAO) {
      this.gl.deleteVertexArray(this.fillVAO);
      this.fillVAO = null;
    }
    if (this.strokeVAO) {
      this.gl.deleteVertexArray(this.strokeVAO);
      this.strokeVAO = null;
    }
    this.polygonsConfig = [];
    this.numPolygons = 0;
    this.polygonStarts = [];
    this.polygonLengths = [];
    this.strokePolygonStarts = [];
    this.strokePolygonLengths = [];
  }

  public updatePolygonPoints(polygonId: number, points: Float32Array): void {
    if (!this._validatePolygonId(polygonId, "updatePolygonPoints") || !this.vertexBuffer) {
      return;
    }
    const polygon = this.polygonsConfig[polygonId];
    if (points.length !== polygon.points.length) {
      DebugLogger.error(
        "WebglPolygonPlot: New points array length must match the original for updatePolygonPoints. For resizing, re-initialize polygons."
      );
      return;
    }

    polygon.points = new Float32Array(points);

    // Calculate byte offset for bufferSubData
    let byteOffset = 0;
    for (let i = 0; i < polygonId; i++) {
      byteOffset +=
        this.polygonsConfig[i].points.length * Float32Array.BYTES_PER_ELEMENT;
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, byteOffset, polygon.points);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    // Regenerate stroke geometry if needed (smart regeneration for single polygon)
    if (polygon.isStroked && polygon.strokeWeight! > 0) {
      this._regeneratePolygonStroke(polygonId);
    }
  }

  public updatePolygonTransform(
    polygonId: number,
    scale: [number, number],
    offset: [number, number]
  ): void {
    if (!this._validatePolygonId(polygonId, "updatePolygonTransform")) return;
    
    this.polygonsConfig[polygonId].scale = scale;
    this.polygonsConfig[polygonId].offset = offset;
  }

  public updatePolygonStyle(
    polygonId: number,
    style: Partial<
      Pick<
        PolygonConfig,
        "fillColor" | "strokeColor" | "strokeWeight" | "isFilled" | "isStroked"
      >
    >
  ): void {
    if (!this._validatePolygonId(polygonId, "updatePolygonStyle")) return;
    
    const needsStrokeRegeneration = style.isStroked !== undefined || 
                                   style.strokeWeight !== undefined;
    
    Object.assign(this.polygonsConfig[polygonId], style);
    
    if (needsStrokeRegeneration && (this.polygonsConfig[polygonId].isStroked || style.isStroked)) {
      this._regeneratePolygonStroke(polygonId);
    }
  }

  public setPolygonEnabled(polygonId: number, enabled: boolean): void {
    if (!this._validatePolygonId(polygonId, "setPolygonEnabled")) return;
    
    this.polygonsConfig[polygonId].enabled = enabled;
  }

  public setGlobalTransform(
    scale: [number, number],
    offset: [number, number]
  ): void {
    if (this.cachedState.globalScale[0] !== scale[0] || 
        this.cachedState.globalScale[1] !== scale[1] ||
        this.cachedState.globalOffset[0] !== offset[0] ||
        this.cachedState.globalOffset[1] !== offset[1]) {
      this.cachedState.globalScale = [...scale];
      this.cachedState.globalOffset = [...offset];
      this.cachedState.globalTransformDirty = true;
    }
  }

  public draw(): void {
    if (
      !this.prog ||
      !this.vertexBuffer ||
      this.numPolygons === 0 ||
      !this.fillVAO
    ) {
      return;
    }

    const gl = this.gl;
    
    // Update viewport if changed
    this._updateViewportIfChanged();

    // Draw filled polygons first
    gl.useProgram(this.prog);
    
    // Update global uniforms only if dirty
    if (this.cachedState.globalTransformDirty) {
      gl.uniform2fv(this.uniformLocations.u_global_scale, this.cachedState.globalScale);
      gl.uniform2fv(this.uniformLocations.u_global_offset, this.cachedState.globalOffset);
      this.cachedState.globalTransformDirty = false;
    }

    gl.bindVertexArray(this.fillVAO);

    for (let i = 0; i < this.numPolygons; i++) {
      const polygon = this.polygonsConfig[i];
      if (!polygon.enabled || !polygon.isFilled) {
        continue;
      }

      gl.uniform2fv(this.uniformLocations.u_polygon_scale, polygon.scale!);
      gl.uniform2fv(this.uniformLocations.u_polygon_offset, polygon.offset!);

      const startVertex = this.polygonStarts[i];
      const numVertices = this.polygonLengths[i];

      if (numVertices === 0) continue;

      // Use pre-allocated arrays to avoid garbage collection
      this.tempArrays.colorArray.set([polygon.fillColor[0], polygon.fillColor[1], polygon.fillColor[2], 1.0]);
      gl.uniform4fv(this.uniformLocations.u_color, this.tempArrays.colorArray);
      gl.uniform1f(this.uniformLocations.u_opacity, polygon.fillColor[3]);
      gl.drawArrays(gl.TRIANGLE_FAN, startVertex, numVertices);
    }

    gl.bindVertexArray(null);

    // Draw strokes with thick lines using triangles
    if (this.strokeProg && this.strokeVertexBuffer && this.strokeVAO) {
      gl.useProgram(this.strokeProg);
      
      // Use cached viewport size
      const viewportWidth = this.cachedState.viewport[2];
      const viewportHeight = this.cachedState.viewport[3];
      
      // Update global uniforms for stroke shader
      gl.uniform2fv(this.strokeUniformLocations.u_global_scale, this.cachedState.globalScale);
      gl.uniform2fv(this.strokeUniformLocations.u_global_offset, this.cachedState.globalOffset);
      gl.uniform2f(this.strokeUniformLocations.u_viewport_size, viewportWidth, viewportHeight);

      gl.bindVertexArray(this.strokeVAO);

      for (let i = 0; i < this.numPolygons; i++) {
        const polygon = this.polygonsConfig[i];
        if (!polygon.enabled || !polygon.isStroked || polygon.strokeWeight! <= 0) {
          continue;
        }

        gl.uniform2fv(this.strokeUniformLocations.u_polygon_scale, polygon.scale!);
        gl.uniform2fv(this.strokeUniformLocations.u_polygon_offset, polygon.offset!);
        gl.uniform1f(this.strokeUniformLocations.u_stroke_weight, polygon.strokeWeight!);

        // Use pre-allocated arrays to avoid garbage collection
        this.tempArrays.colorArray.set([polygon.strokeColor[0], polygon.strokeColor[1], polygon.strokeColor[2], 1.0]);
        gl.uniform4fv(this.strokeUniformLocations.u_color, this.tempArrays.colorArray);
        gl.uniform1f(this.strokeUniformLocations.u_opacity, polygon.strokeColor[3]);

        const startVertex = this.strokePolygonStarts[i];
        const numVertices = this.strokePolygonLengths[i];

        if (numVertices > 0) {
          gl.drawArrays(gl.TRIANGLE_STRIP, startVertex, numVertices);
        }
      }

      gl.bindVertexArray(null);
    }
    
    gl.useProgram(null);
  }

  private _getUniformLocations(program: WebGLProgram): UniformLocations {
    return {
      u_polygon_scale: this.gl.getUniformLocation(program, "u_polygon_scale"),
      u_polygon_offset: this.gl.getUniformLocation(program, "u_polygon_offset"),
      u_global_scale: this.gl.getUniformLocation(program, "u_global_scale"),
      u_global_offset: this.gl.getUniformLocation(program, "u_global_offset"),
      u_color: this.gl.getUniformLocation(program, "u_color"),
      u_opacity: this.gl.getUniformLocation(program, "u_opacity")
    };
  }

  private _setupViewportTracking(): void {
    // Cache initial viewport
    const viewport = this.gl.getParameter(this.gl.VIEWPORT) as [number, number, number, number];
    this.cachedState.viewport = viewport;
    this.cachedState.viewportDirty = false;
  }

  private _updateViewportIfChanged(): boolean {
    const currentViewport = this.gl.getParameter(this.gl.VIEWPORT) as [number, number, number, number];
    if (currentViewport[2] !== this.cachedState.viewport[2] || 
        currentViewport[3] !== this.cachedState.viewport[3]) {
      this.cachedState.viewport = currentViewport;
      this.cachedState.viewportDirty = true;
      return true;
    }
    return false;
  }

  private _normalizePolygonConfig(config: PolygonConfig): PolygonConfig {
    return {
      ...config,
      scale: config.scale || [1, 1],
      offset: config.offset || [0, 0],
      enabled: config.enabled === undefined ? true : config.enabled,
      isFilled: config.isFilled === undefined ? true : config.isFilled,
      isStroked: config.isStroked === undefined ? false : config.isStroked,
      strokeWeight: config.strokeWeight === undefined ? 1 : config.strokeWeight,
    };
  }

  private _validatePolygonId(polygonId: number, method: string): boolean {
    if (polygonId < 0 || polygonId >= this.numPolygons) {
      DebugLogger.warn(`WebglPolygonPlot: Invalid polygonId for ${method}.`);
      return false;
    }
    return true;
  }

  private _setupFillVAO(): void {
    if (!this.fillVAO || !this.vertexBuffer) return;
    
    this.gl.bindVertexArray(this.fillVAO);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    
    // Position attribute (location 0)
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(0);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.gl.bindVertexArray(null);
  }

  private _setupStrokeVAO(): void {
    if (!this.strokeVAO || !this.strokeVertexBuffer) return;
    
    this.gl.bindVertexArray(this.strokeVAO);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.strokeVertexBuffer);
    
    const FLOAT_SIZE = 4;
    const VERTEX_SIZE = 5 * FLOAT_SIZE; // 5 floats per vertex
    
    // Position attribute (location 0)
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, VERTEX_SIZE, 0);
    this.gl.enableVertexAttribArray(0);
    
    // Normal attribute (location 1)
    this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, VERTEX_SIZE, 2 * FLOAT_SIZE);
    this.gl.enableVertexAttribArray(1);
    
    // Side attribute (location 2)
    this.gl.vertexAttribPointer(2, 1, this.gl.FLOAT, false, VERTEX_SIZE, 4 * FLOAT_SIZE);
    this.gl.enableVertexAttribArray(2);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.gl.bindVertexArray(null);
  }

  private _regeneratePolygonStroke(polygonId: number): void {
    if (polygonId < 0 || polygonId >= this.numPolygons) return;
    
    const polygon = this.polygonsConfig[polygonId];
    if (!polygon.isStroked || polygon.strokeWeight! <= 0) {
      // Clear this polygon's stroke data
      this.strokePolygonLengths[polygonId] = 0;
      return;
    }
    
    const numVertices = polygon.points.length / 2;
    if (numVertices < 3) {
      this.strokePolygonLengths[polygonId] = 0;
      return;
    }
    
    // For now, fall back to full regeneration
    // TODO: Implement partial buffer updates for single polygons
    this._generateStrokeGeometry();
  }

  private _generateStrokeGeometry(): void {
    if (this.numPolygons === 0) return;

    let totalStrokeVertices = 0;
    for (let i = 0; i < this.numPolygons; i++) {
      const polygon = this.polygonsConfig[i];
      if (!polygon.isStroked || polygon.strokeWeight! <= 0) {
        this.strokePolygonStarts.push(0);
        this.strokePolygonLengths.push(0);
        continue;
      }

      const numVertices = polygon.points.length / 2;
      if (numVertices < 3) {
        this.strokePolygonStarts.push(0);
        this.strokePolygonLengths.push(0);
        continue;
      }

      this.strokePolygonStarts.push(totalStrokeVertices);
      // Each edge needs 4 vertices (2 triangles) for thick stroke
      const strokeVertices = numVertices * 4;
      this.strokePolygonLengths.push(strokeVertices);
      totalStrokeVertices += strokeVertices;
    }

    if (totalStrokeVertices === 0) return;

    // Each vertex has: position (2) + normal (2) + side (1) = 5 floats
    const strokeVertexData = new Float32Array(totalStrokeVertices * 5);
    let dataOffset = 0;

    for (let i = 0; i < this.numPolygons; i++) {
      const polygon = this.polygonsConfig[i];
      if (!polygon.isStroked || polygon.strokeWeight! <= 0) continue;

      const numVertices = polygon.points.length / 2;
      if (numVertices < 3) continue;

      // Generate stroke geometry for this polygon
      for (let j = 0; j < numVertices; j++) {
        const currentIdx = j;
        const nextIdx = (j + 1) % numVertices;

        // Current and next vertices
        const x1 = polygon.points[currentIdx * 2];
        const y1 = polygon.points[currentIdx * 2 + 1];
        const x2 = polygon.points[nextIdx * 2];
        const y2 = polygon.points[nextIdx * 2 + 1];

        // Calculate edge vector and normal
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) continue;

        // Normalized normal (perpendicular to edge)
        const nx = -dy / length;
        const ny = dx / length;

        // Create 4 vertices for this edge (triangle strip)
        // Inner vertices (side = -1)
        strokeVertexData[dataOffset++] = x1; // position x
        strokeVertexData[dataOffset++] = y1; // position y
        strokeVertexData[dataOffset++] = nx; // normal x
        strokeVertexData[dataOffset++] = ny; // normal y
        strokeVertexData[dataOffset++] = -1; // side

        strokeVertexData[dataOffset++] = x2; // position x
        strokeVertexData[dataOffset++] = y2; // position y
        strokeVertexData[dataOffset++] = nx; // normal x
        strokeVertexData[dataOffset++] = ny; // normal y
        strokeVertexData[dataOffset++] = -1; // side

        // Outer vertices (side = 1)
        strokeVertexData[dataOffset++] = x1; // position x
        strokeVertexData[dataOffset++] = y1; // position y
        strokeVertexData[dataOffset++] = nx; // normal x
        strokeVertexData[dataOffset++] = ny; // normal y
        strokeVertexData[dataOffset++] = 1; // side

        strokeVertexData[dataOffset++] = x2; // position x
        strokeVertexData[dataOffset++] = y2; // position y
        strokeVertexData[dataOffset++] = nx; // normal x
        strokeVertexData[dataOffset++] = ny; // normal y
        strokeVertexData[dataOffset++] = 1; // side
      }
    }

    this.strokeVertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.strokeVertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, strokeVertexData, this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    
    // Set up stroke VAO
    this._setupStrokeVAO();
  }

  private _createShaderProgram(
    vsSource: string,
    fsSource: string
  ): WebGLProgram | null {
    const gl = this.gl;

    const vertexShader = this._compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this._compileShader(gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const program = gl.createProgram();
    if (!program) {
      DebugLogger.error("Failed to create shader program.");
      return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      DebugLogger.error(
        `Shader program linking error: ${gl.getProgramInfoLog(program) || "Unknown error"}`
      );
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    // It's good practice to delete shaders after linking
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }

  private _compileShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) {
      DebugLogger.error("Failed to create shader.");
      return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const shaderType = type === gl.VERTEX_SHADER ? "Vertex" : "Fragment";
      DebugLogger.error(
        `${shaderType} shader compilation error: ${gl.getShaderInfoLog(shader) || "Unknown error"}`
      );
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  // Helper functions to create PolygonConfig objects for basic shapes

  public static createTriangle(config: {
    center: [number, number];
    radius: number;
    rotation?: number;
    fillColor?: [number, number, number, number];
    strokeColor?: [number, number, number, number];
    strokeWeight?: number;
    isFilled?: boolean;
    isStroked?: boolean;
    scale?: [number, number];
    offset?: [number, number];
    enabled?: boolean;
  }): PolygonConfig {
    const {
      center,
      radius,
      rotation = 0,
      fillColor = [0.8, 0.8, 0.8, 0.5],
      strokeColor = [0, 0, 0, 1],
      strokeWeight = 1,
      isFilled = true,
      isStroked = false,
      scale,
      offset,
      enabled = true,
    } = config;

    const points = new Float32Array(3 * 2);

    for (let i = 0; i < 3; i++) {
      const angle = rotation + (i * 2 * Math.PI) / 3;
      points[i * 2] = center[0] + radius * Math.cos(angle);
      points[i * 2 + 1] = center[1] + radius * Math.sin(angle);
    }

    return {
      points,
      fillColor,
      strokeColor,
      strokeWeight,
      isFilled,
      isStroked,
      scale,
      offset,
      enabled,
    };
  }

  public static createSquare(config: {
    center: [number, number];
    size: number;
    rotation?: number;
    fillColor?: [number, number, number, number];
    strokeColor?: [number, number, number, number];
    strokeWeight?: number;
    isFilled?: boolean;
    isStroked?: boolean;
    scale?: [number, number];
    offset?: [number, number];
    enabled?: boolean;
  }): PolygonConfig {
    const {
      center,
      size,
      rotation = 0,
      fillColor = [0.8, 0.8, 0.8, 0.5],
      strokeColor = [0, 0, 0, 1],
      strokeWeight = 1,
      isFilled = true,
      isStroked = false,
      scale,
      offset,
      enabled = true,
    } = config;

    const halfSize = size / 2;
    const initialPoints = [
      [-halfSize, -halfSize],
      [halfSize, -halfSize],
      [halfSize, halfSize],
      [-halfSize, halfSize],
    ];

    const points = new Float32Array(4 * 2);
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);

    for (let i = 0; i < 4; i++) {
      const [x, y] = initialPoints[i];
      // Rotate
      const rx = x * cosR - y * sinR;
      const ry = x * sinR + y * cosR;
      // Translate to center
      points[i * 2] = center[0] + rx;
      points[i * 2 + 1] = center[1] + ry;
    }

    return {
      points,
      fillColor,
      strokeColor,
      strokeWeight,
      isFilled,
      isStroked,
      scale,
      offset,
      enabled,
    };
  }

  public static createCircle(config: {
    center: [number, number];
    radius: number;
    segments?: number;
    fillColor?: [number, number, number, number];
    strokeColor?: [number, number, number, number];
    strokeWeight?: number;
    isFilled?: boolean;
    isStroked?: boolean;
    scale?: [number, number];
    offset?: [number, number];
    enabled?: boolean;
  }): PolygonConfig {
    const {
      center,
      radius,
      segments = 32,
      fillColor = [0.8, 0.8, 0.8, 0.5],
      strokeColor = [0, 0, 0, 1],
      strokeWeight = 1,
      isFilled = true,
      isStroked = false,
      scale,
      offset,
      enabled = true,
    } = config;

    if (segments < 3) {
      DebugLogger.warn(
        "WebglPolygonPlot.createCircle: segments must be 3 or more. Defaulting to 3."
      );
    }

    const points = new Float32Array(segments * 2);
    const angleStep = (2 * Math.PI) / segments;

    for (let i = 0; i < segments; i++) {
      const angle = i * angleStep;
      points[i * 2] = center[0] + radius * Math.cos(angle);
      points[i * 2 + 1] = center[1] + radius * Math.sin(angle);
    }

    return {
      points,
      fillColor,
      strokeColor,
      strokeWeight,
      isFilled,
      isStroked,
      scale,
      offset,
      enabled,
    };
  }
}