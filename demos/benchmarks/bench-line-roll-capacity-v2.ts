import { WebglLineRoll, ColorRGBA, setupCanvasAndWebGL } from "@lib/webglplot";

type FpsSnapshot = { instant: number; average: number };

declare global {
	interface Window {
		__getFps: () => FpsSnapshot;
		__resetFps: () => void;
		__getWebGLInfo: () => Record<string, unknown>;
	}
}

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
const fpsEl = document.getElementById("fps");
const metaEl = document.getElementById("meta");

if (!canvas) throw new Error("Canvas element not found");

const params = new URLSearchParams(window.location.search);
const NUM_LINES = parseInt(params.get("lines") ?? "200", 10);
const POINTS_PER_FRAME = parseInt(params.get("points") ?? "1", 10);
const BUFFER_SIZE = parseInt(params.get("buffer") ?? "2048", 10);

// Fixed drawing buffer size for stable measurements.
const dpr = window.devicePixelRatio || 1;
canvas.width = Math.floor(800 * dpr);
canvas.height = Math.floor(450 * dpr);

const gl = setupCanvasAndWebGL(canvas, {
	backgroundColor: [0, 0, 0, 1],
	antialias: false,
	powerPerformance: "high-performance",
});

type WebGLDebugRendererInfoExt = {
	UNMASKED_VENDOR_WEBGL: number;
	UNMASKED_RENDERER_WEBGL: number;
};

function getWebGLInfo() {
	const info: Record<string, unknown> = {
		userAgent: navigator.userAgent,
		devicePixelRatio: window.devicePixelRatio,
		contextAttributes: gl.getContextAttributes(),
		version: gl.getParameter(gl.VERSION),
		shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
		vendor: gl.getParameter(gl.VENDOR),
		renderer: gl.getParameter(gl.RENDERER),
	};

	const dbg = gl.getExtension("WEBGL_debug_renderer_info") as WebGLDebugRendererInfoExt | null;
	if (dbg) {
		info.unmaskedVendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
		info.unmaskedRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
	}

	info.hasMultiDraw = !!gl.getExtension("WEBGL_multi_draw");
	return info;
}

window.__getWebGLInfo = getWebGLInfo;

if (metaEl) {
	metaEl.textContent = `lines=${NUM_LINES} points=${POINTS_PER_FRAME} buffer=${BUFFER_SIZE}`;
}

const roll = new WebglLineRoll(gl, BUFFER_SIZE, NUM_LINES);

for (let i = 0; i < NUM_LINES; i++) {
	// Fixed color to avoid per-line random overhead.
	roll.setLineColor(new ColorRGBA(255, 255, 255, 1), i);
}

// Precompute waveform table per line once.
const waveTable: Float32Array[] = Array.from({ length: NUM_LINES }, () => new Float32Array(BUFFER_SIZE));
for (let line = 0; line < NUM_LINES; line++) {
	const table = waveTable[line];
	const phase = line * 0.37;
	const step = (Math.PI * 16) / Math.max(1, table.length);
	for (let i = 0; i < table.length; i++) {
		table[i] = 0.65 * Math.sin(phase + i * step);
	}
}

// Payload buffers reused every frame.
const payload: Float32Array[] = Array.from({ length: NUM_LINES }, () => new Float32Array(POINTS_PER_FRAME));
let phaseAdvance = 0;

function fillFromTable(table: Float32Array, offset: number, out: Float32Array) {
	const n = out.length;
	const m = table.length;
	if (n === 0) return;

	if (n <= 8) {
		for (let i = 0; i < n; i++) {
			out[i] = table[(offset + i) % m];
		}
		return;
	}

	const end = offset + n;
	if (end <= m) {
		out.set(table.subarray(offset, end), 0);
	} else {
		const tailLen = m - offset;
		out.set(table.subarray(offset), 0);
		out.set(table.subarray(0, n - tailLen), tailLen);
	}
}

const fpsSnapshot: FpsSnapshot = { instant: 0, average: 0 };
window.__getFps = () => fpsSnapshot;

let frameCount = 0;
let totalFrames = 0;
let lastTick = performance.now();
let start = lastTick;

window.__resetFps = () => {
	frameCount = 0;
	totalFrames = 0;
	lastTick = performance.now();
	start = lastTick;
	fpsSnapshot.instant = 0;
	fpsSnapshot.average = 0;
};

function tickFps() {
	const now = performance.now();
	frameCount++;
	totalFrames++;
	if (now - lastTick >= 1000) {
		const instFps = (frameCount * 1000) / (now - lastTick);
		fpsSnapshot.instant = instFps;
		fpsSnapshot.average = (totalFrames * 1000) / (now - start);
		if (fpsEl) {
			fpsEl.textContent = `FPS: ${instFps.toFixed(1)} | avg ${fpsSnapshot.average.toFixed(1)}`;
		}
		frameCount = 0;
		lastTick = now;
	}
}

function step() {
	for (let i = 0; i < NUM_LINES; i++) {
		fillFromTable(waveTable[i], phaseAdvance, payload[i]);
	}

	roll.addPoints(payload);
	gl.clear(gl.COLOR_BUFFER_BIT);
	roll.draw();

	phaseAdvance = (phaseAdvance + POINTS_PER_FRAME) % BUFFER_SIZE;
	tickFps();
	requestAnimationFrame(step);
}

requestAnimationFrame(step);
