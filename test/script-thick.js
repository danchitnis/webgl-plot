import { WebglPlot, WebglLine, ColorRGBA, WebglThickLine } from "../dist/webglplot.esm.js";

const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const numX = 100;

const color = new ColorRGBA(Math.random(), Math.random(), Math.random(), 1);

const lineThin = new WebglLine(color, numX);

const wglp = new WebglPlot(canvas);

lineThin.lineSpaceX(-1, 2 / numX);

wglp.addLine(lineThin);

const thickness = 0.01;

let lineThick = new WebglThickLine(color, numX, thickness);
lineThick.lineSpaceX(-1, 2 / numX);
wglp.addThickLine(lineThick);

function update() {
  const amp = 0.5;
  const noise = 0.01;
  const freq = 1 / numX;

  for (let i = 0; i < lineThin.numPoints; i++) {
    const yNoise = Math.random() - 0.5;
    const ySin = Math.sin(Math.PI * i * freq * Math.PI * 2);
    const yFinal = ySin * amp + yNoise * noise;
    lineThin.setY(i, yFinal);
    lineThick.setY(i, yFinal);
  }
}

function newFrame() {
  update();
  wglp.update();
  requestAnimationFrame(newFrame);
}
requestAnimationFrame(newFrame);
