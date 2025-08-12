import { WebglPlot } from "../src/webglplot";

// Add type for the line plotters
type LinePlotter = {
  initLines: (lines: any[]) => void;
  autoScaleEnabledLines: () => void;
  draw: () => void;
};

let linearPlot: WebglPlot;
let logPlot: WebglPlot;
let currentData: Float32Array = new Float32Array(0);
let logXEnabled = false;
let logYEnabled = false;
let isRenderingActive = false;

// Initialize both plots
function initPlots() {
  const linearCanvas = document.getElementById("linearCanvas") as HTMLCanvasElement;
  const logCanvas = document.getElementById("logCanvas") as HTMLCanvasElement;

  if (!linearCanvas || !logCanvas) {
    console.error("Canvas elements not found");
    return;
  }

  // Set up canvas dimensions for high DPI displays
  const setupCanvas = (canvas: HTMLCanvasElement) => {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
  };

  setupCanvas(linearCanvas);
  setupCanvas(logCanvas);

  try {
    linearPlot = new WebglPlot(linearCanvas, {
      antialias: true,
      backgroundColor: [0.1, 0.1, 0.1, 1],
      debug: true
    });

    logPlot = new WebglPlot(logCanvas, {
      antialias: true,
      backgroundColor: [0.1, 0.1, 0.1, 1],
      debug: true
    });

    console.log("Plots initialized successfully");
  } catch (error) {
    console.error("Error initializing plots:", error);
  }
}

// Generate exponential data (y = a * e^(b*x))
function generateExponentialData() {
  const numPoints = 1000;
  const points = new Float32Array(numPoints * 2);
  
  for (let i = 0; i < numPoints; i++) {
    const x = 0.01 + (i / numPoints) * 10; // x from 0.01 to 10.01 (avoid zero)
    const y = Math.exp(x * 0.5); // exponential growth
    
    points[i * 2] = x;
    points[i * 2 + 1] = y;
  }
  
  currentData = points;
  updatePlots();
  updateStats("Exponential data: y = e^(0.5*x), x ∈ [0.01, 10.01]");
}

// Generate power law data (y = a * x^b)
function generatePowerLawData() {
  const numPoints = 1000;
  const points = new Float32Array(numPoints * 2);
  
  for (let i = 0; i < numPoints; i++) {
    const x = 0.1 + (i / numPoints) * 99.9; // x from 0.1 to 100
    const y = Math.pow(x, 2.5); // power law: x^2.5
    
    points[i * 2] = x;
    points[i * 2 + 1] = y;
  }
  
  currentData = points;
  updatePlots();
  updateStats("Power law data: y = x^2.5, x ∈ [0.1, 100]");
}

// Generate mixed scale data with both small and large values
function generateMixedData() {
  const numPoints = 1000;
  const points = new Float32Array(numPoints * 2);
  
  for (let i = 0; i < numPoints; i++) {
    const x = Math.pow(10, (i / numPoints) * 6 - 3); // x from 0.001 to 1000 (log scale)
    const y = x * x + 0.1 * Math.sin(Math.log10(x) * 10); // quadratic with oscillation
    
    points[i * 2] = x;
    points[i * 2 + 1] = y;
  }
  
  currentData = points;
  updatePlots();
  updateStats("Mixed scale data: wide range spanning several orders of magnitude");
}

// Store line plotters globally so they persist
let linearLinePlotter: LinePlotter | null = null;
let logLinePlotter: LinePlotter | null = null;

// Update both plots with current data
function updatePlots() {
  if (!linearPlot || !logPlot || currentData.length === 0) {
    return;
  }

  try {
    console.log(`Updating plots - Log X: ${logXEnabled}, Log Y: ${logYEnabled}`);
    
    // Create fresh copy of data for each plot to avoid mutation issues
    const linearData = new Float32Array(currentData);
    const logData = new Float32Array(currentData);

    // Linear plot (always linear axes)
    linearPlot.setLogAxis(false, false);
    linearLinePlotter = linearPlot.newUnifiedLinePlotter(1);
    linearLinePlotter.initLines([{
      points: linearData,
      color: [1, 0.5, 0, 1], // Orange
      thickness: 2,
      enabled: true
    }]);

    // Log plot (with current log settings)
    logPlot.setLogAxis(logXEnabled, logYEnabled);
    logLinePlotter = logPlot.newUnifiedLinePlotter(1);
    logLinePlotter.initLines([{
      points: logData,
      color: [0, 0.8, 1, 1], // Cyan
      thickness: 2,
      enabled: true
    }]);

    // Auto-scale both plots
    linearLinePlotter.autoScaleEnabledLines();
    logLinePlotter.autoScaleEnabledLines();

    // Start the render loop if not already running
    if (!isRenderingActive) {
      isRenderingActive = true;
      renderLoop();
    }

  } catch (error) {
    console.error("Error updating plots:", error);
  }
}

// Animation loop
function renderLoop() {
  if (!linearPlot || !logPlot || !linearLinePlotter || !logLinePlotter) return;

  try {
    // Clear and update both plots
    linearPlot.update();
    logPlot.update();
    
    // Draw the line plotters
    linearLinePlotter.draw();
    logLinePlotter.draw();
    
  } catch (error) {
    console.error("Error in render loop:", error);
  }

  requestAnimationFrame(renderLoop);
}

// Toggle log X axis
function toggleLogX() {
  logXEnabled = !logXEnabled;
  console.log(`Log X axis ${logXEnabled ? 'enabled' : 'disabled'}`);
  
  // Stop current rendering loop
  isRenderingActive = false;
  
  // Reinitialize plots with new log settings
  updatePlots();
  updateLogStatus();
}

// Toggle log Y axis
function toggleLogY() {
  logYEnabled = !logYEnabled;
  console.log(`Log Y axis ${logYEnabled ? 'enabled' : 'disabled'}`);
  
  // Stop current rendering loop
  isRenderingActive = false;
  
  // Reinitialize plots with new log settings
  updatePlots();
  updateLogStatus();
}

// Auto scale both plots
function autoScale() {
  updatePlots(); // This calls autoScaleEnabledLines internally
}

// Update status display
function updateStats(dataInfo: string) {
  const linearStats = document.getElementById("linearStats");
  const logStats = document.getElementById("logStats");
  
  if (linearStats) {
    linearStats.textContent = `Linear scale - ${dataInfo}`;
  }
  
  if (logStats) {
    logStats.textContent = `Log scale - ${dataInfo}`;
  }
}

// Update log axis status
function updateLogStatus() {
  const logStats = document.getElementById("logStats");
  if (logStats) {
    const xStatus = logXEnabled ? "Log X" : "Linear X";
    const yStatus = logYEnabled ? "Log Y" : "Linear Y";
    const pointCount = currentData.length / 2;
    logStats.textContent = `${xStatus}, ${yStatus} - Original Points: ${pointCount}`;
  }
}

// Performance measurement
function measurePerformance() {
  if (currentData.length === 0) return;

  const iterations = 100;
  
  // Measure linear plot performance
  const linearStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    linearPlot.setLogAxis(false, false);
    const linePlotter = linearPlot.newUnifiedLinePlotter(1);
    linePlotter.initLines([{
      points: currentData,
      color: [1, 0.5, 0, 1],
      thickness: 2,
      enabled: true
    }]);
  }
  const linearTime = performance.now() - linearStart;

  // Measure log plot performance
  const logStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    logPlot.setLogAxis(logXEnabled, logYEnabled);
    const linePlotter = logPlot.newUnifiedLinePlotter(1);
    linePlotter.initLines([{
      points: currentData,
      color: [0, 0.8, 1, 1],
      thickness: 2,
      enabled: true
    }]);
  }
  const logTime = performance.now() - logStart;

  console.log(`Performance (${iterations} iterations):`);
  console.log(`Linear plot: ${linearTime.toFixed(2)}ms`);
  console.log(`Log plot: ${logTime.toFixed(2)}ms`);
  console.log(`Overhead: ${((logTime - linearTime) / linearTime * 100).toFixed(1)}%`);
}

// Make functions globally available
declare global {
  interface Window {
    generateExponentialData: () => void;
    generatePowerLawData: () => void;
    generateMixedData: () => void;
    toggleLogX: () => void;
    toggleLogY: () => void;
    autoScale: () => void;
    measurePerformance: () => void;
  }
}


window.generateExponentialData = generateExponentialData;
window.generatePowerLawData = generatePowerLawData;
window.generateMixedData = generateMixedData;
window.toggleLogX = toggleLogX;
window.toggleLogY = toggleLogY;
window.autoScale = autoScale;
window.measurePerformance = measurePerformance;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initPlots();
  generateExponentialData(); // Start with exponential data
});

console.log("Log axis benchmark loaded");