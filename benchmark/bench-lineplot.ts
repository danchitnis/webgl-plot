import {
  WebglPlot,
  WebglLine,
  ColorRGBA,
  WebglLinePlot,
} from "../src/webglplot";

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas element not found");
}

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const numX = 500; // Fixed number of points for the line

const wglp = new WebglPlot(canvas);

// Create a single line with a red color
const color = new ColorRGBA(1, 0, 0, 1); // Red line
const line = new WebglLine();
line.lineSpaceX(numX); // This creates the X coordinates
line.setColor(color);

// Create the LinePlot instance with single line
const linePlot = new WebglLinePlot(wglp, [line]);

console.log("Created WebglLinePlot with a single red line");

// Create a simple square wave pattern for the line
const ys: number[] = [];
const lineSize = line.getSize();

for (let i = 0; i < lineSize; i++) {
  const x = (2 * i) / lineSize - 1; // X coordinate from -1 to 1
  // Create a static square wave pattern
  const square = Math.sign(Math.sin(x * 4)) * 0.5;
  ys.push(square);
}

// Set the Y values to the line
line.setYs(ys);

// Clear canvas and draw the line
wglp.clear();
linePlot.updateLine(0);
linePlot.draw();

console.log("Line drawn successfully");
