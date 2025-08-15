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

const maxLines = 5;
const numX = 1000;

console.log("numX", numX);

const plotLine = new WebglLineThick(gl, maxLines);

let prevTime = new Date();

const array = new Float32Array(numX * 2);

const arrays: LineConfig[] = [];

for (let i = 0; i < maxLines; i++) {
  for (let j = 0; j < numX; j++) {
    const x = -1 + (2 * j) / numX;
    const y = Math.sin(j * 0.03) * 0.3 + 0 + i / maxLines;

    array[j * 2] = x;
    array[j * 2 + 1] = y;
  }

  arrays.push({
    points: new Float32Array(array),
    scale: [1, 1],
    offset: [0, 0],
    color: [Math.random(), Math.random(), Math.random(), 1],
    thickness: 10,
  });
}

plotLine.initLines(arrays);

const tempY = new Float32Array(numX);
for (let i = 0; i < numX; i++) {
  tempY[i] = Math.cos(i * 0.06) * 0.2;
}
plotLine.updateLineY(2, tempY);

plotLine.updateLineThickness(2, 5.0);

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
      thickIndex - 1 >= 0 ? thickIndex - 1 : maxLines - 1,
      20.0
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
