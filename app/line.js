import {
  ColorRGBA,
  WebglPlot,
  WebglLinePlot,
  WebglAux,
  WebglLine,
} from "../dist/webglplot.esm.mjs";

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

aux.addLine(new WebglLine([-1, 0, 1, 0], new ColorRGBA(255, 255, 0, 1)));
aux.addLine(new WebglLine([0, -1, 0, 1], new ColorRGBA(255, 255, 0, 1)));

const lines = Array.from({ length: 3 }, (_, i) => new WebglLine());

lines.forEach((line, i) => {
  line.setColor(new ColorRGBA(255, 0, 0, 1));
  line.lineSpaceX(50);
});

console.log("😉", lines);

const plotLine = new WebglLinePlot(wglp, lines);

const newData = Array.from(
  { length: lines[0].getSize() },
  (_, j) => (j / lines[0].getSize()) * 2
).flatMap((x) => [x - 1, 0]);

console.log("😺", newData);

const phaseArray = Array.from({ length: lines[0].getSize() }, (_, i) => i / lines[0].getSize());
console.log("🎉", phaseArray);

console.log(plotLine.lineSizes);
console.log(plotLine.lineSizeAccum);

let frameIndex = 0;
let phase = 0;

console.log(plotLine.lines);

const render = () => {
  for (let i = 0; i < 3; i++) {
    const yOffset = (Math.random() - 0.5) * 1;
    for (let j = 1; j < newData.length; j += 2) {
      newData[j] =
        0.5 * Math.sin(10 * (j / newData.length) + phase + phaseArray[frameIndex]) + 0.2 * yOffset;
    }
    lines[i].setXYArray(newData);
    plotLine.updateLine(i);
    frameIndex = (frameIndex + 1) % lines.length;
  }
  phase += 0.01;

  wglp.clear();
  plotLine.draw();
  aux.draw();
  requestAnimationFrame(render);
};

requestAnimationFrame(render);
