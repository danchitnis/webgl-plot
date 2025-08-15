import { setupCanvasAndWebGL, WebglLineThick, clearCanvas, LineConfig } from "../src/webglplot";

// Get the canvas element
const canvas = document.getElementById("myCanvas") as HTMLCanvasElement | null;
if (!canvas) {
    throw new Error("Canvas element not found");
}

const gl = setupCanvasAndWebGL(canvas, {
    backgroundColor: [0, 0, 0, 1], // Black background
    antialias: true
});

console.log("Canvas dimensions:", canvas.width, "x", canvas.height);

// Create a thick line plotter (max 1 line)
const plotLine = new WebglLineThick(gl, 1);

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

const bounds = plotLine.getAllDataBounds();
plotLine.transformToLogSpace(bounds);

// Clear the canvas and draw the line
clearCanvas(gl);
plotLine.draw();

console.log("45-degree line rendered successfully with", numPoints, "points!");
