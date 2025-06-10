import { LineInitData } from "../src/WbglLineThick.ts";
import { WebglPlot, WebglLineThick } from "../src/webglplot.ts";

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement | null;
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

const line: LineInitData = {
  points: new Float32Array([0, 0, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.6]),
  scale: [1, 1],
  offset: [0, 0],
  color: [1, 1, 0, 1],
  thickness: 20,
};

plotLine.initLines([line]);

// Add a global scale to test thickness invariance
// Simulate a zoom out by a factor of 2
plotLine.setGlobalTransform([0.5, 0.5], [0, 0]);

wglp.clear();

plotLine.draw();
