import { setupCanvasAndWebGL, WebglLinePlot, clearCanvas, LineConfig } from "../src/webglplot";

const fpsElem = document.getElementById("fps");
const btClick = document.getElementById("btClick");
const inNum = document.getElementById("inNum");

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas element not found");
}

const gl = setupCanvasAndWebGL(canvas, {
  backgroundColor: [0, 0, 0, 1],
  antialias: true
});

const defaultMaxLines = 5;
const numX = 1000;

let plotLine = new WebglLinePlot(gl, defaultMaxLines);

const baseXY = new Float32Array(numX * 2);

function buildLines(numLines: number) {
  plotLine = new WebglLinePlot(gl, numLines);

  const configs: LineConfig[] = [];

  for (let i = 0; i < numLines; i++) {
    for (let j = 0; j < numX; j++) {
      const x = -1 + (2 * j) / numX;
      const y = Math.sin(j * 0.03 + i * 0.4) * 0.3 + i / numLines;

      baseXY[j * 2] = x;
      baseXY[j * 2 + 1] = y;
    }

    configs.push({
      points: new Float32Array(baseXY),
      scale: [1, 1],
      offset: [0, 0],
      color: [Math.random(), Math.random(), Math.random(), 1],
      thickness: 1,
    });
  }

  plotLine.initLines(configs);

  if (numLines > 2) {
    const tempY = new Float32Array(numX);
    for (let i = 0; i < numX; i++) {
      tempY[i] = Math.cos(i * 0.06) * 0.2;
    }
    plotLine.updateLineY(2, tempY);
  }
}

buildLines(defaultMaxLines);

let offset = 0;
let frame = 0;
let prevTime = new Date();

function newFrame() {
  clearCanvas(gl);

  offset = offset + 0.003;
  if (offset > 1) {
    offset = -1;
  }

  plotLine.setGlobalTransform([1, 1], [0, offset]);
  plotLine.draw();

  const timeNow = new Date();
  if (timeNow.getTime() - prevTime.getTime() > 1000) {
    if (fpsElem) {
      fpsElem.innerHTML = `Current fps: ${frame}`;
    }
    frame = 0;
    prevTime = timeNow;
  } else {
    frame++;
  }

  requestAnimationFrame(newFrame);
}
requestAnimationFrame(newFrame);

btClick?.addEventListener("click", () => {
  const requested = parseInt((inNum as HTMLInputElement).value, 10);
  const numLines = Number.isFinite(requested) && requested > 0 ? requested : defaultMaxLines;

  const timeStart = performance.now();
  buildLines(numLines);
  offset = 0;
  const elapsed = performance.now() - timeStart;

  console.log(`Rebuilt ${numLines} thin line(s) in ${elapsed.toFixed(2)} ms`);
  if (fpsElem) {
    fpsElem.innerHTML = "Current fps: --";
  }
});
