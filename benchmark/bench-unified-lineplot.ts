import { WebglPlot, ColorRGBA, LineConfig, WebglLinePlot, WebglLineThick } from "../src/webglplot";

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas element not found");
}

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const numX = 500; // Number of points for each line

const webglPlot = new WebglPlot(canvas);

// Line configurations
const lineConfigs: LineConfig[] = [
  {
    // Should round up to 1.0 and use WebglLinePlot
    points: new Float32Array(numX * 2),
    color: [1, 0, 0, 1], // Red
    thickness: 0.5,
    scale: [1, 1],
    offset: [0, 0.6], // Offset to distinguish visually
    enabled: true,
  },
  {
    // Should use WebglLinePlot
    points: new Float32Array(numX * 2),
    color: [0, 1, 0, 1], // Green
    thickness: 1.0,
    scale: [1, 1],
    offset: [0, 0.2], // Offset to distinguish visually
    enabled: true,
  },
  {
    // Should use WebglLineThick
    points: new Float32Array(numX * 2),
    color: [0, 0, 1, 1], // Blue
    thickness: 1.5,
    scale: [1, 1],
    offset: [0, -0.2], // Offset to distinguish visually
    enabled: true,
  },
  {
    // Should default to 1.0 and use WebglLinePlot
    points: new Float32Array(numX * 2),
    color: [1, 1, 0, 1], // Yellow
    // No thickness specified
    scale: [1, 1],
    offset: [0, -0.6], // Offset to distinguish visually
    enabled: true,
  },
];

// Create line plot instances using the new unified method
const linePlots = lineConfigs.map((config) =>
  webglPlot.createLinePlot(config)
);

console.log(
  "Created line plots:",
  linePlots.map((lp) => lp.constructor.name)
);

// Initialize data for each line (e.g., a sine wave)
linePlots.forEach((plot, index) => {
  const lineConfig = lineConfigs[index];
  const xy = [];
  for (let i = 0; i < numX; i++) {
    const x = (2 * i) / numX - 1; // X coordinate from -1 to 1
    const y = Math.sin(x * Math.PI * 2 + index * Math.PI / 2) * 0.15; // Sine wave with phase shift
    xy.push(x, y);
  }
  // The `createLinePlot` method already calls `initLines`.
  // If we need to update data dynamically, we'd call a method like `updateLinePoints` if it exists,
  // or re-initialize if that's the only option.
  // For this benchmark, the initial data is set by createLinePlot.
  // Let's assume LineConfig in createLinePlot already has points, if not, this part needs adjustment.
  // The current `createLinePlot` implementation correctly passes the config (including points if present)
  // to `initLines`. So, we need to ensure `lineConfig.points` is populated *before* calling `createLinePlot`.

  // Let's generate points and update the config *before* creating the plot instance for simplicity here.
  // (Re-populating points for the configs)
  const newPoints = new Float32Array(numX * 2);
  for (let i = 0; i < numX; i++) {
    const x = (2 * i) / numX - 1; // X coordinate from -1 to 1
    newPoints[i * 2] = x;
    newPoints[i * 2 + 1] = Math.sin(x * Math.PI * (2 + index*0.5)) * 0.15; // Sine wave with varying frequency
  }
  lineConfigs[index].points = newPoints;
});

// Re-create plotters with updated points in configs
const updatedLinePlots = lineConfigs.map((config) =>
  webglPlot.createLinePlot(config)
);
console.log(
  "Re-created line plots with data:",
  updatedLinePlots.map((lp) => lp.constructor.name)
);


let time = 0;
function render() {
  time += 0.01;

  // Update line data (e.g., make them scroll or change shape)
  updatedLinePlots.forEach((plot, index) => {
    const lineConfig = lineConfigs[index]; // original config for params
    const points = lineConfig.points as Float32Array;
    const newYs = new Float32Array(numX);
    for (let i = 0; i < numX; i++) {
      const x = points[i*2]; // X coordinates remain the same
      newYs[i] = Math.sin(x * Math.PI * (2 + index*0.5) + time) * 0.15;
    }

    // The `createLinePlot` method already calls `initLines` with the initial data.
    // For dynamic updates, we call `initLines` again with the new data.
    // Each plot instance (WebglLinePlot or WebglLineThick) handles a single line,
    // so its internal lineId for updates (if methods like updateLineY were used) would be 0.

    // For this benchmark, we re-initialize the entire line data for simplicity of update.
    const newPoints = new Float32Array(numX * 2);
    for (let i = 0; i < numX; i++) {
      const x = (lineConfig.points as Float32Array)[i*2]; // X coordinates remain the same
      newPoints[i*2] = x;
      newPoints[i*2+1] = Math.sin(x * Math.PI * (2 + index*0.5) + time) * 0.15 + lineConfig.offset![1];
    }
    // The plot object (WebglLinePlot or WebglLineThick) is designed to handle one line (maxLines=1)
    // as per the createLinePlot implementation. Its initLines takes an array, so we pass [updateConfig].
    plot.initLines([{...lineConfig, points: newPoints}]);

    // Each plot instance (WebglLinePlot or WebglLineThick) should have its own draw method.
    if (typeof (plot as any).draw === "function") {
      (plot as any).draw();
    }
  });

  requestAnimationFrame(render);
}

// Populate initial points before creating plots
lineConfigs.forEach((config, index) => {
    const xy = new Float32Array(numX * 2);
    for (let i = 0; i < numX; i++) {
        const x = (2 * i) / numX - 1; // X coordinate from -1 to 1
        xy[i*2] = x;
        xy[i*2+1] = Math.sin(x * Math.PI * (2 + index*0.5)) * 0.15; // Sine wave with varying frequency
    }
    config.points = xy;
});

// Create the plots *after* points are initialized in the configs
// This was the previous 'updatedLinePlots', now correctly named and used.
const plotsToRender = lineConfigs.map((config) => webglPlot.createLinePlot(config));

console.log("Line plots created. Types and configured thicknesses:");
plotsToRender.forEach((plot, index) => {
  const config = lineConfigs[index];
  let plotType = "Unknown";
  let actualThickness = "N/A";

  if (plot instanceof WebglLinePlot) {
    plotType = "WebglLinePlot";
    const actualLineConfig = plot.getLineConfig(0); // Since createLinePlot makes single-line plotters
    if (actualLineConfig && actualLineConfig.thickness !== undefined) {
      actualThickness = actualLineConfig.thickness.toFixed(1);
    }
  } else if (plot instanceof WebglLineThick) {
    plotType = "WebglLineThick";
    // WebglLineThick receives the adjusted config in initLines.
    // We assume the 'thickness' in the config passed to its initLines was correctly adjusted by createLinePlot.
    // For logging, we'll show the thickness from the *original* config that createLinePlot processed.
    // The adjusted thickness is what WebglLineThick would use internally.
    // To be more precise, we'd need WebglLineThick to expose its line configs.
    // For this test, knowing createLinePlot *intended* a certain thickness for WebglLineThick is key.
    let intendedThickness = config.thickness;
    if (intendedThickness === undefined) intendedThickness = 1.0;
    if (intendedThickness < 1.0) intendedThickness = 1.0;
    actualThickness = intendedThickness.toFixed(1) + " (intended for WebglLineThick)";

  }
  console.log(
    `Line ${index}: Input thickness = ${config.thickness === undefined ? "undefined (defaulted by createLinePlot)" : config.thickness}, Resulting Plot Type = ${plotType}, Effective Thickness = ${actualThickness}`
  );
});


// Simplified render using plotsToRender
function simplifiedRender() {
  time += 0.01;
  webglPlot.clear();

  plotsToRender.forEach((plot, index) => {
    const originalConfig = lineConfigs[index];
    const currentPoints = (originalConfig.points as Float32Array);

    const newDynamicPoints = new Float32Array(numX * 2);
    for (let i = 0; i < numX; i++) {
      const x = currentPoints[i*2]; // Keep original X
      newDynamicPoints[i*2] = x;
      // Update Y based on sine wave, time, and its original offset
      newDynamicPoints[i*2+1] = Math.sin(x * Math.PI * (2 + index*0.5) + time) * 0.15 + originalConfig.offset![1];
    }

    // Create a new config for initLines, using the original config as a base
    // to preserve color, original thickness (which createLinePlot adjusted), etc.
    const updateConfig: LineConfig = {
        ...originalConfig, // Spread original config
        points: newDynamicPoints, // Provide new points
        // thickness will be taken from originalConfig, which is what createLinePlot used to make its decision
    };

    // Re-initialize the line with new points.
    // The plot object (WebglLinePlot or WebglLineThick) handles one line (maxLines=1).
    // Its initLines method takes an array of LineConfig, so we pass [updateConfig].
    plot.initLines([updateConfig]);
    (plot as any).draw(); // Call draw method on the plot object
  });

  requestAnimationFrame(simplifiedRender);
}

// Start the animation loop
simplifiedRender();

console.log("Rendering loop started with multiple lines of varying thicknesses and types.");
