import { WebglPlot, ColorRGBA, LineConfig, UnifiedLinePlot } from "../src/webglplot";

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

// Populate initial points for each configuration
lineConfigs.forEach((config, index) => {
    const xy = new Float32Array(numX * 2);
    for (let i = 0; i < numX; i++) {
        const x = (2 * i) / numX - 1; // X coordinate from -1 to 1
        // Sine wave with varying frequency and phase, using the offset for vertical separation
        xy[i*2] = x;
        xy[i*2+1] = Math.sin(x * Math.PI * (2 + index * 0.5)) * 0.15;
    }
    config.points = xy;
});

// Create UnifiedLinePlot instances for each configuration
const plotObjects = lineConfigs.map(config => {
  // Each UnifiedLinePlot instance will manage one line as per this benchmark's goal
  const unifiedPlotter = webglPlot.newUnifiedLinePlotter(1);
  // Initialize with this specific line's config.
  // UnifiedLinePlot's initLines will handle the internal plotter choice.
  unifiedPlotter.initLines([config]);
  return unifiedPlotter;
});

console.log("UnifiedLinePlot instances created. Verifying effective thicknesses:");
plotObjects.forEach((plot, index) => {
  const originalConfig = lineConfigs[index];
  const effectiveConfig = plot.getLineConfig(0); // Get config from the UnifiedLinePlot instance

  let expectedThickness = originalConfig.thickness;
  if (expectedThickness === undefined || expectedThickness < 1.0) {
    expectedThickness = 1.0;
  }
  // If UnifiedLinePlot chose WebglLinePlot internally, all lines are 1.0.
  // If it chose WebglLineThick, it uses the (potentially adjusted) original thickness.
  // The getLineConfig on UnifiedLinePlot should reflect what its internal plotter is using.

  console.log(
    `Line ${index}: Input thickness = ${originalConfig.thickness === undefined ? "undefined" : originalConfig.thickness}, Effective Thickness from getLineConfig = ${effectiveConfig?.thickness?.toFixed(1)}`
  );
  // TODO: Add a way to see internal plotter type from UnifiedLinePlot if needed for more detailed logging.
});

let time = 0;
function simplifiedRender() {
  time += 0.01;
  webglPlot.clear();

  plotObjects.forEach((plot, index) => {
    const originalConfig = lineConfigs[index]; // Used for dynamic data generation logic
    const currentPoints = (originalConfig.points as Float32Array);

    const newDynamicPoints = new Float32Array(numX * 2);
    for (let i = 0; i < numX; i++) {
      const x = currentPoints[i*2];
      newDynamicPoints[i*2] = x;
      newDynamicPoints[i*2+1] = Math.sin(x * Math.PI * (2 + index*0.5) + time) * 0.15 + originalConfig.offset![1];
    }

    // Create a new config for initLines, preserving original color, etc.
    // The thickness from originalConfig will be processed by UnifiedLinePlot's initLines logic.
    const updateConfig: LineConfig = {
        ...originalConfig,
        points: newDynamicPoints,
    };

    plot.initLines([updateConfig]); // Re-initialize with new points
    plot.draw(); // Call draw method on the UnifiedLinePlot instance
  });

  requestAnimationFrame(simplifiedRender);
}

// Start the animation loop
simplifiedRender();

console.log("Rendering loop started with multiple lines of varying thicknesses and types.");
