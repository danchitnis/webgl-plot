import {
  WebglPlot,
  WebglLine,
  ColorRGBA,
  WebglLinePlot,
  LineConfig,
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
const linePlot = new WebglLinePlot(wglp, 1); // Specify number of lines
const lineConfig: LineConfig = {
  points: new Float32Array(line.xy),
  color: [line.color.r, line.color.g, line.color.b, line.color.a],
  thickness: 1, // Default thickness
  scale: [1, 1], // Default scale
  offset: [0, 0], // Default offset
  enabled: true, // Default enabled state
};
linePlot.initLines([lineConfig]); // Initialize lines with LineConfig

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
linePlot.updateLineY(0, new Float32Array(ys));
linePlot.draw();

console.log("Line drawn successfully");
