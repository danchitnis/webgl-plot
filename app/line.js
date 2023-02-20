import { ColorRGBA, WebglPlot, WebglLine, WebglAux, WebglAuxLine } from "../dist/webglplot.esm.mjs";

const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

console.log("devicePixelRatio", devicePixelRatio);

const screenRatio = canvas.width / canvas.height;
console.log("screenRatio", screenRatio);

const wglp = new WebglPlot(canvas);
wglp.gScaleX = 1;
wglp.gScaleY = screenRatio;

const aux = new WebglAux(wglp);

aux.addLine(new WebglAuxLine([-1, 0, 1, 0], new ColorRGBA(255, 255, 0, 1)));
aux.addLine(new WebglAuxLine([0, -1, 0, 1], new ColorRGBA(255, 255, 0, 1)));

const lines = new WebglLine(wglp, [50, 50, 50]);

const newData = Array.from(
  { length: lines.lineSizes[0] },
  (_, j) => (j / lines.lineSizes[0]) * 2
).flatMap((x) => [x - 1, 0]);

const phaseArray = Array.from(
  { length: lines.lineSizes.length },
  (_, i) => i / lines.lineSizes.length
);

let frameIndex = 0;
let phase = 0;

const render = () => {
  for (let i = 0; i < 3; i++) {
    const yOffset = Math.random() - 0.5;
    for (let j = 1; j < newData.length; j += 2) {
      newData[j] =
        0.5 * Math.sin(10 * (j / newData.length) + phase + phaseArray[frameIndex]) + 0.2 * yOffset;
    }
    lines.setXYbuffer(newData, frameIndex);
    frameIndex = (frameIndex + 1) % lines.lineSizes.length;
    phase += 0.01;
  }

  wglp.clear();
  lines.draw();
  aux.draw();
  requestAnimationFrame(render);
};

requestAnimationFrame(render);
