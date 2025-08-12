import {
  WebglPlot,
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

// Create the LinePlot instance with single line
const linePlot = new WebglLinePlot(wglp, 1); // Specify number of lines

// Create a simple square wave pattern for the line
const xy: number[] = [];
for (let i = 0; i < numX; i++) {
  const x = (2 * i) / numX - 1; // X coordinate from -1 to (1 - 2/numX)
  const y = Math.sign(Math.sin(x * 4)) * 0.5; // Static square wave pattern
  xy.push(x, y);
}

const lineConfig: LineConfig = {
  points: new Float32Array(xy),
  color: [color.r, color.g, color.b, color.a], // Red color in RGBA format
  thickness: 1, // Default thickness
  scale: [1, 1], // Default scale
  offset: [0, 0], // Default offset
  enabled: true, // Default enabled state
};
linePlot.initLines([lineConfig]); // Initialize lines with LineConfig

console.log("Created WebglLinePlot with a single red line");

// Clear canvas and draw the line
wglp.clear();
//linePlot.updateLineY(0, new Float32Array(ys)); // Data is now set in initLines
linePlot.draw();

console.log("Line drawn successfully");
