import { setupCanvasAndWebGL, WebglLineThick, clearCanvas, LineConfig } from "../src/webglplot";

const fpsElem = document.getElementById("fps");
const btClick = document.getElementById("btClick");
const inNum = document.getElementById("inNum");

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas element not found");
}

const gl = setupCanvasAndWebGL(canvas, {
  backgroundColor: [0, 0, 0, 1], // Black background
  antialias: true
});

const defaultMaxLines = 5;
const numX = 1000;

console.log("numX", numX);

let plotLine = new WebglLineThick(gl, defaultMaxLines);
let currentLines = defaultMaxLines;

let prevTime = new Date();

const array = new Float32Array(numX * 2);

function buildLines(numLines: number) {
  // Recreate plotter to ensure buffer capacity matches requested line count
  plotLine = new WebglLineThick(gl, numLines);
  currentLines = numLines;

  const configs: LineConfig[] = [];

  for (let i = 0; i < numLines; i++) {
    for (let j = 0; j < numX; j++) {
      const x = -1 + (2 * j) / numX;
      const y = Math.sin(j * 0.03) * 0.3 + i / numLines;

      array[j * 2] = x;
      array[j * 2 + 1] = y;
    }

    configs.push({
      points: new Float32Array(array),
      scale: [1, 1],
      offset: [0, 0],
      color: [Math.random(), Math.random(), Math.random(), 1],
      thickness: 10,
    });
  }

  plotLine.initLines(configs);

  // Reapply the third-line variation if we have enough lines
  if (numLines > 2) {
    const tempY = new Float32Array(numX);
    for (let i = 0; i < numX; i++) {
      tempY[i] = Math.cos(i * 0.06) * 0.2;
    }
    plotLine.updateLineY(2, tempY);
    plotLine.updateLineThickness(2, 5.0);
  }
}

buildLines(defaultMaxLines);

//plotLine.setLinesEnabled([0, 1, 2], false);

//plotLine.setGlobalTransform([1, 0.5], [0, -0.5]);

//const dataBounds = plotLine.autoScale();
//console.log("dataBounds", dataBounds);

let offset = 0;
let frame = 0;
let thickIndex = 0;

function newFrame() {
  clearCanvas(gl);

  offset = offset + 0.003;
  if (offset > 1) {
    offset = -1;
  }

  //const baseOffset = -1 + (2 * i) / (maxLines - 1);
  plotLine.setGlobalTransform([1, 1], [0, offset]);

  if (frame % 10 === 0) {
    plotLine.updateLineThickness(thickIndex, 3.0);
    plotLine.updateLineThickness(
      thickIndex - 1 >= 0 ? thickIndex - 1 : currentLines - 1,
      20.0
    );
    //console.log("tickIndex", tickIndex);
    thickIndex++;
    if (thickIndex == currentLines) {
      thickIndex = 0;
    }
  }

  plotLine.draw();

  const timeNow = new Date();
  if (timeNow.getTime() - prevTime.getTime() > 1000) {
    console.log(frame);
    fpsElem!.innerHTML = `Current fps: ${frame}`;
    frame = 0;
    prevTime = timeNow;
  } else {
    frame++;
  }

  requestAnimationFrame(newFrame);
}
requestAnimationFrame(newFrame);

btClick!.addEventListener("click", () => {
  const requested = parseInt((inNum as HTMLInputElement).value, 10);
  const numLines = Number.isFinite(requested) && requested > 0 ? requested : defaultMaxLines;

  const timeStart = performance.now();
  buildLines(numLines);
  thickIndex = 0;
  offset = 0;
  const elapsed = performance.now() - timeStart;

  console.log(`Rebuilt ${numLines} line(s) in ${elapsed.toFixed(2)} ms`);
  fpsElem!.innerHTML = "Current fps: --"; // Reset display immediately after rebuild
});
