import { setupCanvasAndWebGL, UnifiedLinePlot, clearCanvas, LineConfig } from "../src/webglplot";

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas element not found");
}

const gl = setupCanvasAndWebGL(canvas, {
  backgroundColor: [0, 0, 0, 1], // Black background
  antialias: true
});

const numX = 500; // Number of points for each line

const lineAmplitude = 0.15; // Amplitude of the sine wave for points

// Line configurations
const lineConfigs: LineConfig[] = [
  {
    // Red line
    points: new Float32Array(numX * 2), // Points will be populated below
    color: [1, 0, 0, 1], // Red
    thickness: 0.5, // Thin, will be rounded to 1.0 by UnifiedLinePlot logic for WebglLinePlot
    scale: [1, 1],
    offset: [0, 0.6],
    enabled: true,
  },
  {
    // Green line
    points: new Float32Array(numX * 2),
    color: [0, 1, 0, 1], // Green
    thickness: 1.0,
    scale: [1, 1],
    offset: [0, 0.2],
    enabled: true,
  },
  {
    // Blue line
    points: new Float32Array(numX * 2),
    color: [0, 0, 1, 1], // Blue
    thickness: 5.0, // Thick
    scale: [1, 1],
    offset: [0, -0.2],
    enabled: true,
  },
  {
    // Yellow line
    points: new Float32Array(numX * 2),
    color: [1, 1, 0, 1], // Yellow
    // No thickness specified (will default to 1.0)
    scale: [1, 1],
    offset: [0, -0.6],
    enabled: true,
  },
];

// Populate initial points for each configuration
lineConfigs.forEach((config, index) => {
  const xy = new Float32Array(numX * 2);
  for (let i = 0; i < numX; i++) {
    const x = (2 * i) / numX - 1; // X coordinate from -1 to 1
    xy[i * 2] = x;
    xy[i * 2 + 1] = Math.sin(x * Math.PI * (2 + index * 0.5)) * lineAmplitude;
  }
  config.points = xy;
});

// Create UnifiedLinePlot instances for each configuration
const plotObjects = lineConfigs.map((config) => {
  // Each UnifiedLinePlot instance will manage one line as per this benchmark's goal
  const unifiedPlotter = new UnifiedLinePlot(gl, 1);
  // Initialize with this specific line's config.
  // UnifiedLinePlot's initLines will handle the internal plotter choice.
  unifiedPlotter.initLines([config]);
  return unifiedPlotter;
});

const baseThicknesses = lineConfigs.map((cfg) => cfg.thickness ?? 1.0);

function applyThicknessRange(minT: number, maxT: number) {
  const minThickness = Math.max(0.5, minT);
  const maxThickness = Math.max(minThickness, maxT);
  const count = lineConfigs.length;

  lineConfigs.forEach((config, index) => {
    const t = count > 1 ? index / (count - 1) : 0;
    const base = baseThicknesses[index];
    const target = minThickness + t * (maxThickness - minThickness);
    config.thickness = Math.max(0.5, base * (target / baseThicknesses[index]));
    plotObjects[index].initLines([config]);
  });

  const status = document.getElementById("thicknessStatus");
  if (status) {
    status.textContent = `Thickness range: ${minThickness} – ${maxThickness}`;
  }
}

function randomizeThickness() {
  lineConfigs.forEach((config, index) => {
    const randomT = 0.5 + Math.random() * 8;
    config.thickness = randomT;
    plotObjects[index].initLines([config]);
  });
  const status = document.getElementById("thicknessStatus");
  if (status) {
    status.textContent = "Thickness range: randomized";
  }
}

console.log(
  "UnifiedLinePlot instances created. Verifying effective thicknesses:"
);
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
    `Line ${index}: Input thickness = ${
      originalConfig.thickness === undefined
        ? "undefined"
        : originalConfig.thickness
    }, Effective Thickness from getLineConfig = ${effectiveConfig?.thickness?.toFixed(
      1
    )}`
  );
  // TODO: Add a way to see internal plotter type from UnifiedLinePlot if needed for more detailed logging.
});

let time = 0;
function simplifiedRender() {
  time += 0.01;
  clearCanvas(gl);

  plotObjects.forEach((plot, index) => {
    const originalConfig = lineConfigs[index];
    const xValues = (originalConfig.points as Float32Array).filter(
      (_, idx) => idx % 2 === 0
    ); // X values remain constant
    const newYData = new Float32Array(numX);

    for (let i = 0; i < numX; i++) {
      const x = xValues[i];
      // Calculate new Y value based on X, time, line index, and the original yBase for this line
      newYData[i] =
        Math.sin(x * Math.PI * (2 + index * 0.5) + time) * lineAmplitude;
    }

    // Update only the Y data. Line ID is 0 because each plotter instance handles one line.
    plot.updateLineY(0, newYData);
    plot.draw(); // Call draw method on the UnifiedLinePlot instance
  });

  requestAnimationFrame(simplifiedRender);
}

// Start the animation loop
simplifiedRender();

console.log(
  "Rendering loop started with multiple lines of varying thicknesses and types."
);

const minThicknessInput = document.getElementById("minThickness") as HTMLInputElement | null;
const maxThicknessInput = document.getElementById("maxThickness") as HTMLInputElement | null;
const applyBtn = document.getElementById("applyThickness");
const randomBtn = document.getElementById("randomThickness");

applyBtn?.addEventListener("click", () => {
  const minVal = parseFloat(minThicknessInput?.value ?? "1");
  const maxVal = parseFloat(maxThicknessInput?.value ?? "6");
  applyThicknessRange(minVal, maxVal);
});

randomBtn?.addEventListener("click", () => {
  randomizeThickness();
});

// Initialize status with default inputs
applyThicknessRange(
  parseFloat(minThicknessInput?.value ?? "1"),
  parseFloat(maxThicknessInput?.value ?? "10")
);
