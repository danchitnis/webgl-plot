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

const wglp = new WebglPlot(canvas);

const plotLine = new WebglLineThick(wglp, 1);

let prevTime = new Date();

const array: number[] = [0, 0, 10, 10, 20, 50, 20, -50, 30, 40, 30, 0];

const line: LineInitData = {
  points: new Float32Array(array.map((v) => v * 0.01)),
  scale: [1, 1],
  offset: [0, 0],
  color: [1, 0, 0, 1],
  thickness: 0.01,
};

plotLine.initLines([line]);

plotLine.autoScaleEnabledLines();

let frame = 0;

function newFrame() {
  wglp.clear();

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
