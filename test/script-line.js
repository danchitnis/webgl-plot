import { WebglPlot, WebglLine, ColorRGBA, WebglSquare } from "../dist/webglplot.esm.js";

const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const numX = 20;

const color = new ColorRGBA(Math.random(), Math.random(), Math.random(), 1);

const line = new WebglLine(color, numX);

const wglp = new WebglPlot(canvas);

line.arrangeX();
wglp.addLine(line);

line.addArrayY([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]);
wglp.update();

line.addArrayY([0.9, 0.8, 0.7, 0.6]);
wglp.update();
