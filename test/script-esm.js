import WebGLplot, { WebglLine, ColorRGBA, WebglSquare } from "../dist/webglplot.esm.js";

const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const numX = canvas.width;

const color = new ColorRGBA(Math.random(), Math.random(), Math.random(), 1);

const line = new WebglLine(color, numX);

const wglp = new WebGLplot(canvas);

line.lineSpaceX(-1, 2 / numX);
wglp.addLine(line);

const sq = new WebglSquare(new ColorRGBA(0.5, 0.5, 0, 0.5));
sq.setSquare([-1, -1, -1, 0, 0, -1, 0, 0]);
wglp.addSurface(sq);

function newFrame() {
  update();
  wglp.update();
  requestAnimationFrame(newFrame);
}
requestAnimationFrame(newFrame);

function update() {
  const freq = 0.001;
  const amp = 0.5;
  const noise = 0.1;

  for (let i = 0; i < line.numPoints; i++) {
    const ySin = Math.sin(Math.PI * i * freq * Math.PI * 2);
    const yNoise = Math.random() - 0.5;
    line.setY(i, ySin * amp + yNoise * noise);
  }
}
