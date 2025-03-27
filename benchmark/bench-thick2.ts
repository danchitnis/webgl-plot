import { LineInitData } from "../src/WbglLineThick.ts";
import { WebglPlot, WebglLineThick } from "../src/webglplot.ts";

const fpsElem = document.getElementById("fps");
const btClick = document.getElementById("btClick");
const inNum = document.getElementById("inNum");

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas element not found");
}

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

//const numX = canvas.width;

const maxLines = 5;

const numX = 1000;

console.log("numX", numX);

const wglp = new WebglPlot(canvas);

const plotLine = new WebglLineThick(wglp, maxLines);

let prevTime = new Date();

const array = new Float32Array(numX * 2);

const arrays: LineInitData[] = [];

for (let i = 0; i < maxLines; i++) {
  for (let j = 0; j < numX; j++) {
    const x = -1 + (2 * j) / numX;
    const y = Math.sin(j * 0.03) * 0.3 + 0;

    array[j * 2] = x;
    array[j * 2 + 1] = y;
  }

  arrays.push({
    points: new Float32Array(array),
    scale: [1, 1],
    offset: [0, 0],
    color: [Math.random(), Math.random(), Math.random(), 1],
    thickness: 0.01,
  });
}

plotLine.initLines(arrays);

const tempY = new Float32Array(numX);
for (let i = 0; i < numX; i++) {
  tempY[i] = Math.cos(i * 0.06) * 0.2 + 0;
}
plotLine.updateLineY(2, tempY);

plotLine.updateLineThickness(2, 0.05);

plotLine.setLinesEnabled([0, 1, 2], false);
plotLine.autoScaleEnabledLines();

let offset = 0;
let frame = 0;
let thickIndex = 0;

function newFrame() {
  wglp.clear();

  offset = offset + 0.003;
  if (offset > 1) {
    offset = -1;
  }

  for (let i = 0; i < maxLines; i++) {
    const baseOffset = -1 + (2 * i) / (maxLines - 1);
    //plotLine.updateLineTransform(i, [1, 1], [0, baseOffset + offset]);
  }

  if (frame % 10 === 0) {
    plotLine.updateLineThickness(thickIndex, 0.03);
    plotLine.updateLineThickness(
      thickIndex - 1 >= 0 ? thickIndex - 1 : maxLines - 1,
      0.01
    );
    //console.log("tickIndex", tickIndex);
    thickIndex++;
    if (thickIndex == maxLines) {
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
  const numLine = (inNum as HTMLInputElement).value;
  const timeStart = new Date();
  const timeEnd = new Date();
  console.log(
    `Created ${numLine} in ${
      timeEnd.getTime() - timeStart.getTime()
    } milliseconds`
  );
});
