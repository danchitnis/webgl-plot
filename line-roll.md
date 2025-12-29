# Line Roll

## Why v2 is faster (and when it matters)

The v2 line-roll approach is optimized for **streaming updates**: instead of re-uploading an entire line buffer every frame, it uploads only the **new points** you append.

In practice this means:

- v1-style update loops often do work proportional to $O(\text{lines} \times \text{bufferSize})$ per frame (full-buffer CPU touching + full `bufferSubData`).
- v2 line-roll does work proportional to $O(\text{lines} \times \text{pointsPerFrame})$ per frame (incremental `bufferSubData`, plus a small constant for wrap/bridge).

So v2’s biggest advantage shows up when you have **many lines** and/or a **large history buffer**, but you’re adding only a **small number of points per frame**.

## Minimal snippet (incremental streaming)

```ts
import { setupCanvasAndWebGL, WebglLineRoll, ColorRGBA } from "webgl-plot";

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement;
const gl = setupCanvasAndWebGL(canvas, {
  backgroundColor: [0, 0, 0, 1],
  antialias: false,
  powerPerformance: "high-performance",
});

const bufferSize = 8192;
const numLines = 200;
const pointsPerFrame = 1;

const roll = new WebglLineRoll(gl, bufferSize, numLines);
for (let i = 0; i < numLines; i++) {
  roll.setLineColor(new ColorRGBA(255, 255, 255, 1), i);
}

const payload: number[][] = Array.from({ length: numLines }, () =>
  Array(pointsPerFrame).fill(0)
);

function frame() {
  // Fill only the *new* samples for this frame.
  for (let i = 0; i < numLines; i++) {
    payload[i][0] = Math.sin(performance.now() * 0.002 + i * 0.1) * 0.6;
  }

  roll.addPoints(payload);
  gl.clear(gl.COLOR_BUFFER_BIT);
  roll.draw();

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```
