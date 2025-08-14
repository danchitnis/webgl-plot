import { setupCanvasAndWebGL, WebglLineThick, clearCanvas, LineConfig } from "../src/webglplot";

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement | null;
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

const line: LineConfig = {
  points: new Float32Array([0, 0, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.6]),
  scale: [1, 1],
  offset: [0, 0],
  color: [1, 1, 0, 1],
  thickness: 20,
};

plotLine.initLines([line]);

// Add a global scale to test thickness invariance
const globalScale = 1.4;
plotLine.setGlobalTransform([globalScale, globalScale], [0, 0]);

clearCanvas(gl);

plotLine.draw();
