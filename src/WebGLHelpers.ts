/**
 * WebGL Helper Functions
 * 
 * Pure utility functions for common WebGL operations that users can use
 * when managing their own WebGL2 context instead of using WebglPlot wrapper.
 */

export type WebGL2ContextOptions = {
  antialias?: boolean;
  transparent?: boolean;
  powerPerformance?: "default" | "high-performance" | "low-power";
  deSync?: boolean;
  preserveDrawing?: boolean;
};

/**
 * Set up canvas with proper pixel ratio scaling
 * @param canvas HTMLCanvasElement to configure
 * @param devicePixelRatio Optional device pixel ratio, defaults to window.devicePixelRatio || 1
 */
export function setupCanvas(canvas: HTMLCanvasElement, devicePixelRatio?: number): void {
  const dpr = devicePixelRatio ?? (window.devicePixelRatio || 1);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
}

/**
 * Create a WebGL2 rendering context with common options
 * @param canvas HTMLCanvasElement to get context from
 * @param options WebGL context creation options
 * @returns WebGL2RenderingContext
 * @throws Error if WebGL2 is not supported or context creation fails
 */
export function createWebGL2Context(
  canvas: HTMLCanvasElement, 
  options?: WebGL2ContextOptions
): WebGL2RenderingContext {
  const contextOptions: WebGLContextAttributes = {
    antialias: options?.antialias ?? true,
    alpha: options?.transparent ?? false,
    desynchronized: options?.deSync,
    powerPreference: options?.powerPerformance,
    preserveDrawingBuffer: options?.preserveDrawing,
  };

  const gl = canvas.getContext("webgl2", contextOptions) as WebGL2RenderingContext;
  
  if (!gl) {
    throw new Error("WebGL2 is not supported or context creation failed");
  }

  // Set the viewport to match canvas size
  gl.viewport(0, 0, canvas.width, canvas.height);
  
  // Enable alpha blending for transparency
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return gl;
}

/**
 * Parse CSS color string (rgba format) to WebGL color array
 * @param cssColor CSS color string in format "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1
 * @returns Array of [r, g, b, a] where all values are normalized to 0-1 range
 */
function parseCSSColor(cssColor: string): [number, number, number, number] {
  const rgbaMatch = cssColor.match(
    /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*([\d.]+))?\s*\)/
  );
  if (!rgbaMatch) {
    throw new Error(
      `Invalid CSS color format: ${cssColor}. Expected format: "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1`
    );
  }

  const r = Math.max(0, Math.min(255, parseFloat(rgbaMatch[1]))) / 255;
  const g = Math.max(0, Math.min(255, parseFloat(rgbaMatch[2]))) / 255;
  const b = Math.max(0, Math.min(255, parseFloat(rgbaMatch[3]))) / 255;
  const a = rgbaMatch[4]
    ? Math.max(0, Math.min(1, parseFloat(rgbaMatch[4])))
    : 1;

  return [r, g, b, a];
}

/**
 * Set the background clear color for WebGL context
 * @param gl WebGL2 rendering context
 * @param color Either:
 *   - CSS color string in format "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1
 *   - Array of [r, g, b, a] where all values are 0-1
 *   - Individual RGBA values (r, g, b, a)
 * @example
 * setBackgroundColor(gl, "rgba(25, 0, 100, 1)");
 * setBackgroundColor(gl, [0.1, 0, 0.4, 1]);
 * setBackgroundColor(gl, 0.1, 0, 0.4, 1);
 */
export function setBackgroundColor(
  gl: WebGL2RenderingContext,
  color: string | [number, number, number, number]
): void;
export function setBackgroundColor(
  gl: WebGL2RenderingContext,
  r: number,
  g: number,
  b: number,
  a: number
): void;
export function setBackgroundColor(
  gl: WebGL2RenderingContext,
  colorOrR: string | [number, number, number, number] | number,
  g?: number,
  b?: number,
  a?: number
): void {
  let bgColor: [number, number, number, number];

  if (typeof colorOrR === "string") {
    bgColor = parseCSSColor(colorOrR);
  } else if (Array.isArray(colorOrR)) {
    bgColor = colorOrR;
  } else if (
    typeof colorOrR === "number" &&
    g !== undefined &&
    b !== undefined &&
    a !== undefined
  ) {
    bgColor = [colorOrR, g, b, a];
  } else {
    throw new Error(
      "Invalid arguments. Use either CSS color string, color array, or individual RGBA values."
    );
  }

  gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
}

/**
 * Clear the canvas with the current clear color
 * @param gl WebGL2 rendering context
 * @param backgroundColor Optional background color to set before clearing
 */
export function clearCanvas(
  gl: WebGL2RenderingContext,
  backgroundColor?: string | [number, number, number, number]
): void {
  if (backgroundColor) {
    setBackgroundColor(gl, backgroundColor);
  }
  gl.clear(gl.COLOR_BUFFER_BIT);
}

/**
 * Update WebGL viewport when canvas size changes
 * @param gl WebGL2 rendering context
 * @param canvas HTMLCanvasElement to get dimensions from
 */
export function updateViewport(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement): void {
  gl.viewport(0, 0, canvas.width, canvas.height);
}

/**
 * Create a combined setup function that handles both canvas and WebGL context
 * @param canvas HTMLCanvasElement to set up
 * @param options Configuration options
 * @returns WebGL2RenderingContext ready for use
 */
export function setupCanvasAndWebGL(
  canvas: HTMLCanvasElement,
  options?: WebGL2ContextOptions & {
    devicePixelRatio?: number;
    backgroundColor?: string | [number, number, number, number];
  }
): WebGL2RenderingContext {
  // Set up canvas dimensions
  setupCanvas(canvas, options?.devicePixelRatio);
  
  // Create WebGL context
  const gl = createWebGL2Context(canvas, options);
  
  // Set background color if provided
  if (options?.backgroundColor) {
    setBackgroundColor(gl, options.backgroundColor);
  } else {
    // Default to black background
    setBackgroundColor(gl, [0, 0, 0, 1]);
  }
  
  return gl;
}

/**
 * Resize handler that updates both canvas and WebGL viewport
 * Useful for window resize events or responsive layouts
 * @param canvas HTMLCanvasElement to resize
 * @param gl WebGL2 rendering context
 * @param devicePixelRatio Optional device pixel ratio
 */
export function handleCanvasResize(
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext,
  devicePixelRatio?: number
): void {
  setupCanvas(canvas, devicePixelRatio);
  updateViewport(gl, canvas);
}