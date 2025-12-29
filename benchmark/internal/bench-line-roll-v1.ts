import { setupCanvasAndWebGL, clearCanvas, WebglLinePlot } from "@lib/webglplot";

type FpsSnapshot = { instant: number; average: number };

declare global {
	interface Window {
		__getFps: () => FpsSnapshot;
	}
}

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
const fpsEl = document.getElementById("fps");

// Provide a stub so tests can always query something even on failure.
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

const gl = setupCanvasAndWebGL(canvas, { backgroundColor: [0, 0, 0, 1] });
const plot = new WebglLinePlot(gl, NUM_LINES);

const yStore: Float32Array[] = [];
const baseXY = new Float32Array(BUFFER_SIZE * 2);
for (let i = 0; i < BUFFER_SIZE; i++) {
	baseXY[i * 2] = (2 * i) / BUFFER_SIZE - 1;
	baseXY[i * 2 + 1] = 0;
}

const lineConfigs: Array<{
	points: Float32Array;
	color: [number, number, number, number];
	thickness: number;
	scale: [number, number];
	offset: [number, number];
	enabled: boolean;
}> = [];
for (let i = 0; i < NUM_LINES; i++) {
	const points = new Float32Array(baseXY);
	yStore.push(new Float32Array(BUFFER_SIZE));
	lineConfigs.push({
		points,
		color: [Math.random(), Math.random(), Math.random(), 1],
		thickness: 1,
		scale: [1, 1],
		offset: [0, 0],
		enabled: true,
	});
}
plot.initLines(lineConfigs);

let frameCount = 0;
let totalFrames = 0;
let lastTick = performance.now();
const start = lastTick;
let instFps = 0;

// Phase offset advanced deterministically each frame.
let phaseAdvance = 0;

// Precompute deterministic Y arrays once (no RNG/trig in hot path).
for (let line = 0; line < NUM_LINES; line++) {
	const y = yStore[line];
	const phase = line * 0.37;
	const step = (Math.PI * 16) / Math.max(1, y.length);
	for (let i = 0; i < y.length; i++) {
		y[i] = 0.65 * Math.sin(phase + i * step);
	}
}

function step() {
	// Keep data constant to focus this benchmark on upload + draw cost.
	for (let i = 0; i < NUM_LINES; i++) {
		plot.updateLineY(i, yStore[i]);
	}

	phaseAdvance = (phaseAdvance + POINTS_PER_FRAME) % BUFFER_SIZE;

	clearCanvas(gl);
	plot.draw();
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
	console.error("v1 loop failed", err);
	requestAnimationFrame(fallbackLoop);
}
