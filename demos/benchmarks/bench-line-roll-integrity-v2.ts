import { WebglLineRoll, ColorRGBA, setupCanvasAndWebGL } from "@lib/webglplot";

declare global {
	interface Window {
		__analyzeLine: () => {
			width: number;
			height: number;
			r2: number;
			slope: number;
			intercept: number;
			sampleCount: number;
		};
		__getFrameCount: () => number;
		__getWaveStats: () => { min: number; max: number };
		__debugVertexStats: () => { minY: number; maxY: number; firstYs: number[] };
	}
}

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Canvas element not found");

// Small canvas keeps analysis fast and stable.
canvas.style.width = "640px";
canvas.style.height = "240px";

const dpr = window.devicePixelRatio || 1;
canvas.width = Math.floor(640 * dpr);
canvas.height = Math.floor(240 * dpr);

const gl = setupCanvasAndWebGL(canvas, {
	backgroundColor: [1, 1, 1, 1],
	antialias: false,
	powerPerformance: "high-performance",
	preserveDrawing: true,
});

// Stress wrap/bridge frequently.
const BUFFER_SIZE = 512;
const POINTS_PER_FRAME = 128;
const NUM_LINES = 1;

const roll = new WebglLineRoll(gl, BUFFER_SIZE, NUM_LINES);
roll.setLineColor(new ColorRGBA(0, 0, 0, 1), 0);

const payload = [new Float32Array(POINTS_PER_FRAME)];
let t = 0;
let frameCount = 0;
window.__getFrameCount = () => frameCount;
let lastWaveMin = 0;
let lastWaveMax = 0;
window.__getWaveStats = () => ({ min: lastWaveMin, max: lastWaveMax });

function fillWave(out: Float32Array) {
	// Multiple oscillations across the x-range so any straight chord is obvious.
	// Keep it smooth and deterministic.
	const omega = Math.PI * 10; // 5 full cycles over 2 units ([-1, 1])
	for (let i = 0; i < out.length; i++) {
		const phase = t + i * 0.03;
		out[i] = 0.65 * Math.sin(omega * phase);
	}
	let mn = out[0];
	let mx = out[0];
	for (let i = 1; i < out.length; i++) {
		const v = out[i];
		if (v < mn) mn = v;
		if (v > mx) mx = v;
	}
	lastWaveMin = mn;
	lastWaveMax = mx;
	t += out.length * 0.03;
}

function frame() {
	frameCount++;
	fillWave(payload[0]);
	roll.addPoints(payload);
	gl.clear(gl.COLOR_BUFFER_BIT);
	roll.draw();
	requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Debug: read back a small portion of the vertex buffer to confirm Y values are actually getting uploaded.
window.__debugVertexStats = () => {
	const bfsize = BUFFER_SIZE + 2;
	const floatsToRead = Math.min(200, bfsize * 2);
	const tmp = new Float32Array(floatsToRead);

	const vb = (roll as unknown as { vertexBuffer?: WebGLBuffer }).vertexBuffer;
	if (!vb) {
		return { minY: 0, maxY: 0, firstYs: [] };
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vb);
	gl.getBufferSubData(gl.ARRAY_BUFFER, 0, tmp);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	let minY = Number.POSITIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;
	const firstYs: number[] = [];
	for (let i = 0; i < tmp.length / 2; i++) {
		const y = tmp[i * 2 + 1];
		if (i < 10) firstYs.push(y);
		if (y < minY) minY = y;
		if (y > maxY) maxY = y;
	}
	if (!Number.isFinite(minY)) minY = 0;
	if (!Number.isFinite(maxY)) maxY = 0;
	return { minY, maxY, firstYs };
};

function computeRegressionXY(xs: number[], ys: number[]) {
	const n = ys.length;
	let sumX = 0;
	let sumY = 0;
	let sumXX = 0;
	let sumXY = 0;

	for (let i = 0; i < n; i++) {
		const x = xs[i];
		const y = ys[i];
		sumX += x;
		sumY += y;
		sumXX += x * x;
		sumXY += x * y;
	}

	const denom = n * sumXX - sumX * sumX;
	const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
	const intercept = (sumY - slope * sumX) / n;

	let ssTot = 0;
	let ssRes = 0;
	const meanY = sumY / n;
	for (let i = 0; i < n; i++) {
		const y = ys[i];
		const yHat = slope * xs[i] + intercept;
		const dy = y - meanY;
		ssTot += dy * dy;
		const dr = y - yHat;
		ssRes += dr * dr;
	}

	const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
	return { r2, slope, intercept, meanY };
}

window.__analyzeLine = () => {
	const width = gl.drawingBufferWidth;
	const height = gl.drawingBufferHeight;

	const pixels = new Uint8Array(width * height * 4);
	gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

	// Diagnostic: sample a few pixels for background luminance.
	const midIdx = ((Math.floor(height / 2) * width) + Math.floor(width / 2)) * 4;
	const bgLumMid = pixels[midIdx] + pixels[midIdx + 1] + pixels[midIdx + 2];
	const cornerIdx = ((height - 1) * width + 0) * 4;
	const bgLumCorner = pixels[cornerIdx] + pixels[cornerIdx + 1] + pixels[cornerIdx + 2];
	const clearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE) as Float32Array;

	// For each x column, find the average y of all "dark" pixels.
	// This avoids accidentally locking onto a single pixel (e.g., noise) and is more stable.
	const xs: number[] = [];
	const ys: number[] = [];
	let darkPixelCount = 0;

	for (let x = 0; x < width; x++) {
		let sumY = 0;
		let count = 0;

		for (let y = 0; y < height; y++) {
			const idx = (y * width + x) * 4;
			const r = pixels[idx];
			const g = pixels[idx + 1];
			const b = pixels[idx + 2];
			// Simple luminance; white background => 255.
			const lum = r + g + b;
			if (lum < 255 * 3 - 40) {
				sumY += y;
				count++;
				darkPixelCount++;
			}
		}

		if (count > 0) {
			xs.push(x);
			ys.push(sumY / count);
		}
	}

	const { r2, slope, intercept, meanY } = computeRegressionXY(xs, ys);
	let varY = 0;
	for (let i = 0; i < ys.length; i++) {
		const d = ys[i] - meanY;
		varY += d * d;
	}
	varY /= Math.max(1, ys.length);
	return {
		width,
		height,
		r2,
		slope,
		intercept,
		sampleCount: ys.length,
		varY,
		bgLumMid,
		bgLumCorner,
		clearColor: [clearColor[0], clearColor[1], clearColor[2], clearColor[3]] as [number, number, number, number],
		darkPixelCount,
	};
};
