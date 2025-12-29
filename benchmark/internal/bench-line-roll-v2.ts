import { WebglLineRoll, ColorRGBA, setupCanvasAndWebGL } from "@lib/webglplot";

type FpsSnapshot = { instant: number; average: number };

declare global {
	interface Window {
		__getFps: () => FpsSnapshot;
	}
}

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
const fpsEl = document.getElementById("fps");

const fpsSnapshot = { instant: 0, average: 0 };
window.__getFps = () => fpsSnapshot;

if (!canvas) {
	throw new Error("Canvas element not found");
}

const params = new URLSearchParams(window.location.search);
const NUM_LINES = parseInt(params.get("lines") ?? "200", 10);
const POINTS_PER_FRAME = parseInt(params.get("points") ?? "1", 10);
const BUFFER_SIZE = parseInt(params.get("buffer") ?? "2048", 10);

const dpr = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;

const gl = setupCanvasAndWebGL(canvas, {
	backgroundColor: [0, 0, 0, 1],
	antialias: false,
	powerPerformance: "high-performance",
});

const roll = new WebglLineRoll(gl, BUFFER_SIZE, NUM_LINES);
const payload: Float32Array[] = Array.from(
	{ length: NUM_LINES },
	() => new Float32Array(POINTS_PER_FRAME)
);

for (let i = 0; i < NUM_LINES; i++) {
	roll.setLineColor(randomColor(), i);
}

let frameCount = 0;
let totalFrames = 0;
let lastTick = performance.now();
const start = lastTick;
let instFps = 0;

function randomColor() {
	return new ColorRGBA(Math.random() * 255, Math.random() * 255, Math.random() * 255, 1);
}

// Precompute per-line waveform table once (no RNG/trig in hot path).
const waveTable: Float32Array[] = Array.from(
	{ length: NUM_LINES },
	() => new Float32Array(BUFFER_SIZE)
);
for (let line = 0; line < NUM_LINES; line++) {
	const table = waveTable[line];
	const phase = line * 0.37;
	const step = (Math.PI * 16) / Math.max(1, table.length);
	for (let i = 0; i < table.length; i++) {
		table[i] = 0.65 * Math.sin(phase + i * step);
	}
}

let phaseAdvance = 0;

function fillFromTable(table: Float32Array, offset: number, out: Float32Array) {
	const n = out.length;
	const m = table.length;
	if (n === 0) return;

	// For tiny chunks (e.g. points=1), avoid creating subarray view objects.
	if (n <= 8) {
		for (let i = 0; i < n; i++) {
			out[i] = table[(offset + i) % m];
		}
		return;
	}

	// For larger chunks, bulk copy is significantly faster than JS loops.
	const end = offset + n;
	if (end <= m) {
		out.set(table.subarray(offset, end), 0);
	} else {
		const tailLen = m - offset;
		out.set(table.subarray(offset), 0);
		out.set(table.subarray(0, n - tailLen), tailLen);
	}
}

function step() {
	// Deterministic per-frame data feed (no RNG/trig): advances through the waveform table.
	for (let i = 0; i < NUM_LINES; i++) {
		fillFromTable(waveTable[i], phaseAdvance, payload[i]);
	}

	roll.addPoints(payload as unknown as number[][]);
	gl.clear(gl.COLOR_BUFFER_BIT);
	roll.draw();

	phaseAdvance = (phaseAdvance + POINTS_PER_FRAME) % BUFFER_SIZE;

	tickFps();
	requestAnimationFrame(step);
}

function tickFps() {
	const now = performance.now();
	frameCount++;
	totalFrames++;
	if (now - lastTick >= 1000) {
		instFps = (frameCount * 1000) / (now - lastTick);
		fpsSnapshot.instant = instFps;
		fpsSnapshot.average = (totalFrames * 1000) / (now - start);
		if (fpsEl) fpsEl.textContent = `FPS: ${instFps.toFixed(1)} | avg ${((totalFrames * 1000) / (now - start)).toFixed(1)}`;
		frameCount = 0;
		lastTick = now;
	}
}

function fallbackLoop() {
	tickFps();
	requestAnimationFrame(fallbackLoop);
}

try {
	requestAnimationFrame(step);
} catch (err) {
	console.error("v2 loop failed", err);
	requestAnimationFrame(fallbackLoop);
}
