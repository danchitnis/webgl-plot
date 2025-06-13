import { WebglPlot, WebglPlotConfig } from "./webglplot";

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

const vsSource = `
  attribute vec2 a_position;

  uniform vec2 u_polygon_scale;
  uniform vec2 u_polygon_offset;
  uniform vec2 u_global_scale;
  uniform vec2 u_global_offset;

  void main() {
    vec2 scaled_position = a_position * u_polygon_scale + u_polygon_offset;
    gl_Position = vec4(scaled_position * u_global_scale + u_global_offset, 0.0, 1.0);
  }
`;

const fsSource = `
  precision mediump float;
  uniform vec4 u_color;
  uniform float u_opacity;

  void main() {
    gl_FragColor = vec4(u_color.rgb, u_color.a * u_opacity);
  }
`;

interface ShaderLocations {
  a_position: number;
  u_polygon_scale: WebGLUniformLocation | null;
  u_polygon_offset: WebGLUniformLocation | null;
  u_global_scale: WebGLUniformLocation | null;
  u_global_offset: WebGLUniformLocation | null;
  u_color: WebGLUniformLocation | null;
  u_opacity: WebGLUniformLocation | null;
}

export class WbglPolygonPlot {
  private gl: WebGLRenderingContext;
  private wglp: WebglPlot;
  //private maxPolygons: number; // This seems redundant if we use polygonsConfig.length after init
  private prog: WebGLProgram | null;
  private locations: ShaderLocations;

  public polygonsConfig: PolygonConfig[] = [];
  public numPolygons = 0;
  private vertexBuffer: WebGLBuffer | null = null;
  private polygonStarts: number[] = [];
  private polygonLengths: number[] = [];
  private globalScale: [number, number] = [1, 1];
  private globalOffset: [number, number] = [0, 0];

  constructor(wglp: WebglPlot, maxPolygons: number) { // maxPolygons might be used for pre-allocation if desired, but current setup is dynamic
    this.gl = wglp.gl;
    this.wglp = wglp;
    //this.maxPolygons = maxPolygons;

    this.prog = this._createShaderProgram(vsSource, fsSource);

    if (!this.prog) {
      console.error("WbglPolygonPlot: Failed to create shader program.");
      // Consider how to handle this error, perhaps by disabling rendering for this plot.
    }

    this.locations = {
      a_position: this.gl.getAttribLocation(this.prog as WebGLProgram, "a_position"),
      u_polygon_scale: this.gl.getUniformLocation(this.prog as WebGLProgram, "u_polygon_scale"),
      u_polygon_offset: this.gl.getUniformLocation(this.prog as WebGLProgram, "u_polygon_offset"),
      u_global_scale: this.gl.getUniformLocation(this.prog as WebGLProgram, "u_global_scale"),
      u_global_offset: this.gl.getUniformLocation(this.prog as WebGLProgram, "u_global_offset"),
      u_color: this.gl.getUniformLocation(this.prog as WebGLProgram, "u_color"),
      u_opacity: this.gl.getUniformLocation(this.prog as WebGLProgram, "u_opacity"),
    };

    // Enable blending
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  public initPolygons(polygonsConfig: PolygonConfig[]): void {
    // Deep copy to avoid external modification issues and set defaults
    this.polygonsConfig = polygonsConfig.map(p => ({
      ...p,
      scale: p.scale || [1, 1],
      offset: p.offset || [0, 0],
      enabled: p.enabled === undefined ? true : p.enabled,
      isFilled: p.isFilled === undefined ? true : p.isFilled,
      isStroked: p.isStroked === undefined ? false : p.isStroked,
      strokeWeight: p.strokeWeight === undefined ? 1 : p.strokeWeight,
    }));
    this.numPolygons = this.polygonsConfig.length;

    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }
    this.polygonStarts = [];
    this.polygonLengths = [];

    if (this.numPolygons === 0) {
      // Consider also cleaning up shader program if no polygons?
      // Or keep it for future additions. For now, just return.
      return;
    }

    let totalVertices = 0;
    for (const polygon of this.polygonsConfig) {
      if (polygon.points.length % 2 !== 0) {
        console.warn("WbglPolygonPlot: Polygon points array length should be even (x,y pairs). Skipping polygon.");
        // Or handle this more gracefully, e.g. by marking polygon as invalid
        continue;
      }
      this.polygonStarts.push(totalVertices / 2); // Store vertex count, not byte offset
      const numPolygonVertices = polygon.points.length / 2;
      this.polygonLengths.push(numPolygonVertices);
      totalVertices += polygon.points.length;
    }

    if (totalVertices === 0 && this.numPolygons > 0) {
        console.warn("WbglPolygonPlot: No valid vertices found in polygon configurations.");
        this.numPolygons = 0; // Correct numPolygons if all were invalid
        return;
    }


    const allVertexData = new Float32Array(totalVertices);
    let offset = 0;
    for (const polygon of this.polygonsConfig) {
        // Only add valid polygons' data
        if (polygon.points.length > 0 && polygon.points.length % 2 === 0) {
            allVertexData.set(polygon.points, offset);
            offset += polygon.points.length;
        }
    }

    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, allVertexData, this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null); // Unbind

    if (this.prog && this.locations.u_global_scale && this.locations.u_global_offset) {
      this.gl.useProgram(this.prog);
      this.gl.uniform2fv(this.locations.u_global_scale, this.globalScale);
      this.gl.uniform2fv(this.locations.u_global_offset, this.globalOffset);
      this.gl.useProgram(null);
    }
  }

  public cleanup(): void {
    if (this.prog) {
      this.gl.deleteProgram(this.prog);
      this.prog = null;
    }
    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }
    this.polygonsConfig = [];
    this.numPolygons = 0;
    this.polygonStarts = [];
    this.polygonLengths = [];
    // Reset global transforms? Or assume they might be reused?
    // this.globalScale = [1, 1];
    // this.globalOffset = [0, 0];
  }

  public updatePolygonPoints(polygonId: number, points: Float32Array): void {
    if (polygonId < 0 || polygonId >= this.numPolygons || !this.vertexBuffer) {
      console.warn("WbglPolygonPlot: Invalid polygonId or buffer not initialized for updatePolygonPoints.");
      return;
    }
    const polygon = this.polygonsConfig[polygonId];
    if (points.length !== polygon.points.length) {
      console.error("WbglPolygonPlot: New points array length must match the original for updatePolygonPoints. For resizing, re-initialize polygons.");
      return;
    }

    polygon.points = new Float32Array(points); // Update internal storage

    // Calculate byte offset for bufferSubData
    // polygonStarts stores the starting *vertex* index, not component index
    let byteOffset = 0;
    for (let i = 0; i < polygonId; i++) {
        byteOffset += this.polygonsConfig[i].points.length * Float32Array.BYTES_PER_ELEMENT;
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, byteOffset, polygon.points);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
  }

  public updatePolygonTransform(polygonId: number, scale: [number, number], offset: [number, number]): void {
    if (polygonId < 0 || polygonId >= this.numPolygons) {
      console.warn("WbglPolygonPlot: Invalid polygonId for updatePolygonTransform.");
      return;
    }
    this.polygonsConfig[polygonId].scale = scale;
    this.polygonsConfig[polygonId].offset = offset;
  }

  public updatePolygonStyle(
    polygonId: number,
    style: Partial<Pick<PolygonConfig, 'fillColor' | 'strokeColor' | 'strokeWeight' | 'isFilled' | 'isStroked'>>
  ): void {
    if (polygonId < 0 || polygonId >= this.numPolygons) {
      console.warn("WbglPolygonPlot: Invalid polygonId for updatePolygonStyle.");
      return;
    }
    // Use Object.assign to update only provided properties
    Object.assign(this.polygonsConfig[polygonId], style);
  }

  public setPolygonEnabled(polygonId: number, enabled: boolean): void {
    if (polygonId < 0 || polygonId >= this.numPolygons) {
      console.warn("WbglPolygonPlot: Invalid polygonId for setPolygonEnabled.");
      return;
    }
    this.polygonsConfig[polygonId].enabled = enabled;
  }

  public setGlobalTransform(scale: [number, number], offset: [number, number]): void {
    this.globalScale = scale;
    this.globalOffset = offset;
    if (this.prog && this.locations.u_global_scale && this.locations.u_global_offset) {
      this.gl.useProgram(this.prog);
      this.gl.uniform2fv(this.locations.u_global_scale, this.globalScale);
      this.gl.uniform2fv(this.locations.u_global_offset, this.globalOffset);
      this.gl.useProgram(null);
    }
  }

  public draw(): void {
    if (!this.prog || !this.vertexBuffer || this.numPolygons === 0 || !this.locations) {
      return;
    }

    const gl = this.gl;
    gl.useProgram(this.prog);

    // Set global uniforms (already set in setGlobalTransform, but good practice if they could change elsewhere)
    gl.uniform2fv(this.locations.u_global_scale, this.globalScale);
    gl.uniform2fv(this.locations.u_global_offset, this.globalOffset);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(
      this.locations.a_position, // attributeLocation
      2, // size (components per iteration)
      gl.FLOAT, // type
      false, // normalize
      0, // stride (0 = use size * sizeof(type))
      0  // offset (0 = start from the beginning of the buffer)
    );
    gl.enableVertexAttribArray(this.locations.a_position);

    for (let i = 0; i < this.numPolygons; i++) {
      const polygon = this.polygonsConfig[i];
      if (!polygon.enabled) {
        continue;
      }

      // Default scale and offset if not provided in config (should be handled by initPolygons)
      const scale = polygon.scale || [1,1];
      const offset = polygon.offset || [0,0];

      gl.uniform2fv(this.locations.u_polygon_scale, scale);
      gl.uniform2fv(this.locations.u_polygon_offset, offset);

      const startVertex = this.polygonStarts[i];
      const numVertices = this.polygonLengths[i];

      if (numVertices === 0) continue;


      if (polygon.isFilled) {
        gl.uniform4fv(this.locations.u_color, polygon.fillColor.slice(0,3).concat(1.0)); // Use full opacity for color
        gl.uniform1f(this.locations.u_opacity, polygon.fillColor[3]); // Separate opacity
        gl.drawArrays(gl.TRIANGLE_FAN, startVertex, numVertices);
      }

      if (polygon.isStroked && polygon.strokeWeight > 0) {
        gl.uniform4fv(this.locations.u_color, polygon.strokeColor.slice(0,3).concat(1.0));
        gl.uniform1f(this.locations.u_opacity, polygon.strokeColor[3]);
        gl.lineWidth(polygon.strokeWeight);
        gl.drawArrays(gl.LINE_LOOP, startVertex, numVertices);
      }
    }

    gl.disableVertexAttribArray(this.locations.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);
  }

  private _createShaderProgram(vsSource: string, fsSource: string): WebGLProgram | null {
    const gl = this.gl;

    const vertexShader = this._compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this._compileShader(gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const program = gl.createProgram();
    if (!program) {
      console.error("Failed to create shader program.");
      return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Shader program linking error:", gl.getProgramInfoLog(program));
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
      console.error("Failed to create shader.");
      return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const shaderType = type === gl.VERTEX_SHADER ? "Vertex" : "Fragment";
      console.error(`${shaderType} shader compilation error:`, gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  // Helper functions to create PolygonConfig objects for basic shapes

  public static createTriangle(config: {
    center: [number, number];
    radius: number; // Distance from center to each vertex
    rotation?: number; // In radians
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
      fillColor = [0.8, 0.8, 0.8, 0.5], // Default: semi-transparent grey
      strokeColor = [0, 0, 0, 1],       // Default: black
      strokeWeight = 1,
      isFilled = true,
      isStroked = false,
      scale,
      offset,
      enabled = true,
    } = config;

    const points = new Float32Array(3 * 2); // 3 vertices, 2 components each

    for (let i = 0; i < 3; i++) {
      const angle = rotation + (i * 2 * Math.PI) / 3; // Angle for each vertex
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
    size: number; // Side length
    rotation?: number; // In radians
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

    const points = new Float32Array(4 * 2); // 4 vertices, 2 components each
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
    segments?: number; // Number of segments to approximate the circle
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
        console.warn("WbglPolygonPlot.createCircle: segments must be 3 or more. Defaulting to 3.");
        // segments = 3; // Or throw error, depending on desired strictness
    }

    const points = new Float32Array(segments * 2);
    const angleStep = (2 * Math.PI) / segments;

    for (let i = 0; i < segments; i++) {
      const angle = i * angleStep; // No rotation parameter for circle, it's symmetrical
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
