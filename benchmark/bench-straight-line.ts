import { WebglPlot, WebglLineThick, LineConfig } from "../src/webglplot";

// Get the canvas element
const canvas = document.getElementById("myCanvas") as HTMLCanvasElement | null;
if (!canvas) {
    throw new Error("Canvas element not found");
}

// Set up canvas size with device pixel ratio for crisp rendering
const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

console.log("Canvas dimensions:", canvas.width, "x", canvas.height);

// Create the WebGL plot instance
const wglp = new WebglPlot(canvas);

// Create a thick line plotter (max 1 line)
const plotLine = new WebglLineThick(wglp, 1);

// Define a 45-degree line with 100 points from 0.1 to 1
// Generate points for a diagonal line
const numPoints = 100;
const points = new Float32Array(numPoints * 2); // x, y pairs

for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1); // Parameter from 0 to 1
    const value = 0.1 + t * (1.0 - 0.1); // Linear interpolation from 0.1 to 1.0


    points[i * 2] = value; // x coordinate
    points[i * 2 + 1] = value; // y coordinate (45-degree
}

const straightLine: LineConfig = {
    points: points,
    scale: [1, 1],         // No scaling
    offset: [0, 0],        // No offset
    color: [0, 1, 0, 1],   // Green color (R, G, B, A)
    thickness: 15,         // Line thickness in pixels
};

console.log("Line configuration:", straightLine);

// Initialize the line with our configuration
plotLine.initLines([straightLine]);

plotLine.setLogAxis(false, true); // Enable log axis for both x and y

// Clear the canvas and draw the line
wglp.clear();
plotLine.draw();

console.log("45-degree line rendered successfully with", numPoints, "points!");
