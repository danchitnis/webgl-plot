import { setupCanvasAndWebGL, WebglLinePlot, WebglLineThick, clearCanvas, LineConfig } from "../src/webglplot";

function main() {
  const canvas = document.getElementById(
    "combined_canvas"
  ) as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found: combined_canvas");
    return;
  }

  const gl = setupCanvasAndWebGL(canvas, {
    backgroundColor: [0, 0, 0, 1], // Black background
    antialias: true
  });

  // Instantiate Plotters
  const thinLinePlotter = new WebglLinePlot(gl, 1); // For one thin line
  const thickLinePlotter = new WebglLineThick(gl, 1); // For one thick line

  // Define Thin Line using LineConfig
  const numXThin = 500;
  const thinLinePoints = new Float32Array(numXThin * 2);
  for (let i = 0; i < numXThin; i++) {
    const x = (i / (numXThin - 1)) * 2 - 1; // X from -1 to 1
    const y = Math.sin(x * Math.PI * 2) * 0.5; // Sine wave from -0.8 to 0.8
    thinLinePoints[i * 2] = x;
    thinLinePoints[i * 2 + 1] = y;
  }
  const thinLineConfig: LineConfig = {
    points: thinLinePoints,
    color: [1, 1, 0, 1], // Yellow, RGBA
    thickness: 1,
    scale: [1, 1],
    offset: [0, 0.3], // Move thin line up a bit
    enabled: true,
  };

  // Define Thick Line using LineConfig
  const thickLineConfig: LineConfig = {
    points: new Float32Array([
      -0.8, 0.0, -0.4, -0.2, 0.0, 0.0, 0.4, -0.2, 0.8, 0.0,
    ]),
    scale: [1, 1],
    offset: [0, -0.3], // Move thick line down
    color: [1, 0, 0, 1], // Red
    thickness: 15,
    enabled: true,
  };

  // Initialize Plotters
  thinLinePlotter.initLines([thinLineConfig]);
  thickLinePlotter.initLines([thickLineConfig]);

  // Render Both Lines
  clearCanvas(gl);
  thinLinePlotter.draw();
  thickLinePlotter.draw();

  console.log("Combined thin and thick lines rendering with new plotters.");
}

main();
