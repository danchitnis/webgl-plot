import {
  WebglPlot,
  WebglLinePlot,
  WebglLineThick,
  ColorRGBA, // Keep if used for other things, or remove
  LineConfig,
} from "../src/webglplot";

function main() {
  const canvas = document.getElementById(
    "combined_canvas"
  ) as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found: combined_canvas");
    return;
  }

  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;

  const wglp = new WebglPlot(canvas);

  // Instantiate Plotters
  const thinLinePlotter = wglp.newThinLinePlotter(1); // For one thin line
  const thickLinePlotter = wglp.newThickLinePlotter(1); // For one thick line

  // Define Thin Line using LineConfig
  const numXThin = 500;
  const thinLinePoints = new Float32Array(numXThin * 2);
  for (let i = 0; i < numXThin; i++) {
    const x = (i / (numXThin - 1)) * 2 - 1; // X from -1 to 1
    const y = Math.sin(x * Math.PI * 2) * 0.8; // Sine wave from -0.8 to 0.8
    thinLinePoints[i * 2] = x;
    thinLinePoints[i * 2 + 1] = y;
  }
  const thinLineConfig: LineConfig = {
    points: thinLinePoints,
    color: [1, 1, 0, 1], // Yellow, RGBA
    thickness: 1.5,
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
  wglp.clear();
  thinLinePlotter.draw();
  thickLinePlotter.draw();

  console.log("Combined thin and thick lines rendering with new plotters.");

  // Add performance measurement placeholders if this evolves into a proper benchmark
  // const startTime = performance.now();
  // ... rendering ...
  // const endTime = performance.now();
  // console.log(`Rendering time: ${endTime - startTime} ms`);

  // Optional: Demonstrate API usage
  // setTimeout(() => {
  //   thinLineConfig.color = [0, 1, 1, 1]; // Cyan
  //   thinLinePlotter.updateLineColor(0, thinLineConfig.color);
  //   wglp.clear();
  //   thinLinePlotter.draw();
  //   thickLinePlotter.draw();
  //   console.log("Thin line color updated");
  // }, 2000);
}

main();
