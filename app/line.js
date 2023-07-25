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

console.log("canvas.width", canvas.width, "canvas.height", canvas.height);

const wglp = new WebglPlot(canvas);
wglp.gScaleX = 1;
wglp.gScaleY = screenRatio;

const aux = new WebglAux(wglp);

aux.addLine(new WebglLine([-1, 0, 1, 0], new ColorRGBA(255, 255, 0, 1)));
aux.addLine(new WebglLine([0, -1, 0, 1], new ColorRGBA(255, 255, 0, 1)));

const lines = Array.from({ length: 300 }, (_, i) => new WebglLine());

lines.forEach((line, i) => {
  line.setColor(new ColorRGBA(255, 0, 0, 1));
  line.lineSpaceX(50);
});

const plotLine = new WebglLinePlot(wglp, lines);

const newYData = Array(lines[0].getSize()).fill(0);

const phaseArray = Array.from({ length: lines[0].getSize() }, (_, i) => i / lines[0].getSize());

let frameIndex = 0;
let phase = 0;

const render = () => {
  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < newYData.length; j++) {
      newYData[j] =
        (i / lines.length) * 2 -
        1 +
        ((j / newYData.length) * 2) / lines.length +
        ((window.performance.now() * 0.0001) % 0.1);
    }
    lines[i].setYs(newYData);
    plotLine.updateLine(i);
  }

  wglp.clear();
  plotLine.draw();
  //aux.draw();
  requestAnimationFrame(render);
};

requestAnimationFrame(render);
