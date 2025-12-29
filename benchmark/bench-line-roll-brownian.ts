import { setupCanvasAndWebGL, clearCanvas, WebglLineRoll, ColorRGBA } from "@lib/webglplot";

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
const fpsElem = document.getElementById("fps");
const toggleBtn = document.getElementById("toggleRun") as HTMLButtonElement | null;
const applyBtn = document.getElementById("applyLines") as HTMLButtonElement | null;
const lineInput = document.getElementById("lineCount") as HTMLInputElement | null;

if (!canvas || !fpsElem || !toggleBtn || !applyBtn || !lineInput) {
  throw new Error("Required DOM elements are missing");
}

// Bind non-null, specific element types for use inside callbacks/closures.
const fpsEl: HTMLElement = fpsElem;
const toggleEl: HTMLButtonElement = toggleBtn;
const applyEl: HTMLButtonElement = applyBtn;
const lineEl: HTMLInputElement = lineInput;

const gl = setupCanvasAndWebGL(canvas, { backgroundColor: [0, 0, 0, 1] });
if (!gl) {
  throw new Error("Unable to initialize WebGL context");
}

const BUFFER_SIZE = 2048;
// Keep per-frame work minimal to match v1 throughput; can be raised if needed.
const POINTS_PER_FRAME = 1;
const STEP_SIZE = 0.025;
const CLAMP = 0.92;
const MIN_LINES = 1;
const MAX_LINES = 256;

let lineCount = clampLines(parseInt(lineEl.value || "8", 10));
lineEl.value = String(lineCount);

let roll = createRoll(lineCount);
let yState = new Float32Array(lineCount);
let payload = allocatePayload(lineCount);
let frameHandle = 0;
let running = false;
let resumeOnFocus = false;
let frameCounter = 0;
let lastFpsTick = performance.now();

function clampLines(raw: number) {
  if (!Number.isFinite(raw)) {
    return MIN_LINES;
  }
  return Math.min(MAX_LINES, Math.max(MIN_LINES, Math.round(raw)));
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return [r * 255, g * 255, b * 255];
}

function lineColor(lineIndex: number, total: number) {
  const hue = (lineIndex / Math.max(1, total)) % 1;
  const [r, g, b] = hslToRgb(hue, 0.65, 0.55);
  return new ColorRGBA(r, g, b, 1);
}

function createRoll(count: number) {
  const instance = new WebglLineRoll(gl, BUFFER_SIZE, count);
  for (let i = 0; i < count; i++) {
    instance.setLineColor(lineColor(i, count), i);
  }
  return instance;
}

function allocatePayload(count: number) {
  return Array.from({ length: count }, () => new Float32Array(POINTS_PER_FRAME));
}

function zeroPayload(rows: Float32Array[]) {
  rows.forEach((row) => row.fill(0));
}

function primeRoll() {
  zeroPayload(payload);
  roll.addPoints(payload);
  clearCanvas(gl);
  roll.draw();
}

primeRoll();
fpsEl.textContent = "FPS: paused";

function stepBrownian(): Float32Array[] {
  for (let line = 0; line < lineCount; line++) {
    const row = payload[line];
    let y = yState[line];
    for (let i = 0; i < POINTS_PER_FRAME; i++) {
      y += (Math.random() * 2 - 1) * STEP_SIZE;
      y = Math.max(-CLAMP, Math.min(CLAMP, y));
      row[i] = y;
    }
    yState[line] = y;
  }
  return payload;
}

function renderFrame() {
  const payload = stepBrownian();
  roll.addPoints(payload);
  clearCanvas(gl);
  roll.draw();

  frameCounter++;
  const now = performance.now();
  if (now - lastFpsTick >= 1000) {
    fpsEl.textContent = `FPS: ${frameCounter.toFixed(0)}`;
    frameCounter = 0;
    lastFpsTick = now;
  }
}

function loop() {
  if (!running) {
    return;
  }
  renderFrame();
  frameHandle = requestAnimationFrame(loop);
}

function start() {
  if (running) {
    return;
  }
  running = true;
  toggleEl.textContent = "Pause";
  frameHandle = requestAnimationFrame(loop);
}

function stop(updateLabel = true) {
  running = false;
  cancelAnimationFrame(frameHandle);
  if (updateLabel) {
    toggleEl.textContent = "Start";
    fpsEl.textContent = "FPS: paused";
  }
}

toggleEl.addEventListener("click", () => {
  if (running) {
    stop(true);
    resumeOnFocus = false;
  } else {
    resumeOnFocus = true;
    start();
  }
});

applyEl.addEventListener("click", () => {
  const requested = clampLines(parseInt(lineEl.value || `${lineCount}`, 10));
  lineEl.value = String(requested);

  const wasRunning = running;
  stop(false);

  lineCount = requested;
  roll = createRoll(lineCount);
  yState = new Float32Array(lineCount);
  payload = allocatePayload(lineCount);
  primeRoll();

  if (wasRunning || resumeOnFocus) {
    resumeOnFocus = true;
    start();
  } else {
    fpsEl.textContent = "FPS: paused";
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    resumeOnFocus = running || resumeOnFocus;
    stop(false);
  } else if (resumeOnFocus) {
    start();
  }
});
