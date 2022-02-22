import { WebglPlot, WebglLine, ColorRGBA } from "../dist/webglplot.esm.js";
import { PolyLine } from "../dist/thick.js";
import { scaleAndAdd } from "../dist/vecTools.js";

const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const numX = 1000;

const color = new ColorRGBA(Math.random(), Math.random(), Math.random(), 1);

const lineThin = new WebglLine(color, numX);

const wglp = new WebglPlot(canvas);

lineThin.lineSpaceX(-1, 2 / numX);

wglp.addLine(lineThin);

/*let line = [
  { x: -0.8, y: 0.8 },
  { x: 0.5, y: 0.8 },
  { x: 0.0, y: 0.0 },
  { x: -0.4, y: 0.0 },
];*/
let lineThick = [];

const thick = 0.01;
const halfThick = thick / 2;

let triPoints = [];

function update() {
  const amp = 0.5;
  const noise = 0.01;
  const freq = 1 / numX;

  lineThick = [];

  for (let i = 0; i < lineThin.numPoints; i++) {
    const yNoise = Math.random() - 0.5;
    const ySin = Math.sin(Math.PI * i * freq * Math.PI * 2);
    lineThin.setY(i, ySin * amp + yNoise * noise);
    lineThick.push({ x: lineThin.getX(i), y: lineThin.getY(i) });
  }

  let normals = PolyLine(lineThick);

  triPoints = [];

  for (let i = 0; i < lineThick.length; i++) {
    let top = scaleAndAdd(lineThick[i], normals[i].vec2, normals[i].miterLength * halfThick);
    let bot = scaleAndAdd(lineThick[i], normals[i].vec2, -normals[i].miterLength * halfThick);
    triPoints.push(top.x, top.y, bot.x, bot.y);
  }
}

function newFrame() {
  wglp.clear();
  update();
  let vertices = new Float32Array(triPoints);

  wglp.drawTriangles(vertices);
  wglp.draw();
  requestAnimationFrame(newFrame);
}
requestAnimationFrame(newFrame);
