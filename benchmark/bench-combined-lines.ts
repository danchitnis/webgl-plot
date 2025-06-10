import {
  WebglPlot,
  WebglLine,
  ColorRGBA,
  WebglLinePlot, // Import WebglLinePlot
} from "../src/webglplot";

import { WebglLineThick, LineInitData } from "../src/webglplot";


function main() {
  const canvas = document.getElementById('combined_canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found: combined_canvas');
    return;
  }

  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;

  const wglp = new WebglPlot(canvas);

  // 1. Create and configure a thin line (WebglLine) using WebglLinePlot
  const numXThin = 500;
  const thinLine = new WebglLine();
  const thinLineColor = new ColorRGBA(0, 0, 1, 1); // Blue color for thin line
  thinLine.lineSpaceX(numXThin);
  thinLine.setColor(thinLineColor);

  const ysThin: number[] = [];
  for (let i = 0; i < numXThin; i++) {
    const x = (2 * Math.PI * i) / numXThin - Math.PI; // X from -PI to PI
    ysThin.push(Math.sin(x) * 0.8); // Scaled sine wave
  }
  thinLine.setYs(ysThin);

  // Use WebglLinePlot for the thin line
  const thinLinePlotter = new WebglLinePlot(wglp, [thinLine]);
  // No need to call wglp.addLine(thinLine) if using WebglLinePlot


  // 2. Create and configure a thick line (WebglLineThick)
  const thickLinePlot = new WebglLineThick(wglp, 1); // For one thick line

  const thickLineData: LineInitData = {
    points: new Float32Array([
      -0.8, 0.0,
      -0.4, 0.2,
       0.0, -0.2,
       0.4, 0.2,
       0.8, 0.0
    ]),
    scale: [1, 1],
    offset: [0, -0.5], // Move thick line down a bit to avoid overlap
    color: [1, 0, 0, 1], // Red color for thick line
    thickness: 15,
  };
  thickLinePlot.initLines([thickLineData]);


  // 3. Render both lines
  wglp.clear(); // Clear canvas once

  // Draw thin line(s) using WebglLinePlot
  // thinLinePlotter.updateLine(0); // Call if Ys change dynamically, not needed for initial draw with static data
  thinLinePlotter.draw();

  // Draw thick line(s)
  thickLinePlot.draw();

  console.log('Combined thin and thick lines rendering attempted.');

  // Add performance measurement placeholders if this evolves into a proper benchmark
  // const startTime = performance.now();
  // ... rendering ...
  // const endTime = performance.now();
  // console.log(`Rendering time: ${endTime - startTime} ms`);
}

main();
