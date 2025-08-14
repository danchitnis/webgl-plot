import { setupCanvasAndWebGL, UnifiedLinePlot, clearCanvas } from "../src/webglplot";

let linearGL: WebGL2RenderingContext;
let logGL: WebGL2RenderingContext;
let linearPlotter: UnifiedLinePlot;
let logPlotter: UnifiedLinePlot;
let isRenderingActive = false;
let logXEnabled = false;
let logYEnabled = false;

// Initialize both plots
function initPlots() {
  const linearCanvas = document.getElementById("linearCanvas") as HTMLCanvasElement;
  const logCanvas = document.getElementById("logCanvas") as HTMLCanvasElement;

  if (!linearCanvas || !logCanvas) {
    console.error("Canvas elements not found");
    return;
  }

  try {
    // Setup WebGL contexts with dark background
    linearGL = setupCanvasAndWebGL(linearCanvas, {
      backgroundColor: [0.1, 0.1, 0.1, 1],
      antialias: true
    });

    logGL = setupCanvasAndWebGL(logCanvas, {
      backgroundColor: [0.1, 0.1, 0.1, 1],
      antialias: true
    });

    // Create unified line plotters
    linearPlotter = new UnifiedLinePlot(linearGL, 1);
    logPlotter = new UnifiedLinePlot(logGL, 1);

    console.log("Log axis demo initialized successfully");
  } catch (error) {
    console.error("Error initializing plots:", error);
  }
}

// Generate exponential data (y = e^(0.5*x)) - ideal for demonstrating log scaling
function generateExponentialData() {
  const numPoints = 1000;
  const points = new Float32Array(numPoints * 2);
  
  for (let i = 0; i < numPoints; i++) {
    const x = 0.1 + (i / numPoints) * 5; // x from 0.1 to 5.1
    const y = Math.exp(x * 0.5); // exponential growth
    
    points[i * 2] = x;
    points[i * 2 + 1] = y;
  }
  
  updatePlots(points);
  updateStats("Exponential data: y = e^(0.5*x)");
}

// Generate power law data (y = x^2.5) - shows benefits of log-log scaling
function generatePowerLawData() {
  const numPoints = 1000;
  const points = new Float32Array(numPoints * 2);
  
  for (let i = 0; i < numPoints; i++) {
    const x = 0.1 + (i / numPoints) * 99.9; // x from 0.1 to 100
    const y = Math.pow(x, 2.5); // power law: x^2.5
    
    points[i * 2] = x;
    points[i * 2 + 1] = y;
  }
  
  updatePlots(points);
  updateStats("Power law data: y = x^2.5");
}

// Update both plots with new data
function updatePlots(data: Float32Array) {
  if (!linearGL || !logGL || !linearPlotter || !logPlotter) {
    console.error("Plots not initialized");
    return;
  }

  try {
    // Linear plot setup (always linear axes)
    linearPlotter.setLogAxis(false, false);
    linearPlotter.initLines([{
      points: new Float32Array(data),
      color: [1, 0.5, 0, 1], // Orange
      thickness: 2,
      enabled: true
    }]);

    // Log plot setup (with current log settings)
    logPlotter.setLogAxis(logXEnabled, logYEnabled);
    logPlotter.initLines([{
      points: new Float32Array(data),
      color: [0, 0.8, 1, 1], // Cyan
      thickness: 2,
      enabled: true
    }]);

    // Auto-scale both plots
    console.log("Auto-scaling plots after data update...");
    const linearResult = linearPlotter.autoScaleEnabledLines();
    console.log("Linear auto-scale result:", linearResult);
    
    // Log plot uses appropriate scaling method
    if (logXEnabled || logYEnabled) {
      const bounds = logPlotter.autoScaleEnabledLines();
      if (bounds && bounds !== undefined) {
        const logResult = logPlotter.autoScaleToLogSpace(bounds);
        console.log("Log plot data bounds:", bounds);
        console.log("Log space scaling success:", logResult);
      } else {
        console.log("No valid bounds for log space scaling");
      }
    } else {
      const logResult = logPlotter.autoScaleEnabledLines();
      console.log("Log auto-scale result:", logResult);
    }

    // Start the render loop if not already running
    if (!isRenderingActive) {
      isRenderingActive = true;
      renderLoop();
    }

    console.log(`Data updated - Log X: ${logXEnabled}, Log Y: ${logYEnabled}`);

  } catch (error) {
    console.error("Error updating plots:", error);
  }
}

// Animation loop
function renderLoop() {
  if (!linearGL || !logGL || !linearPlotter || !logPlotter) return;

  try {
    // Clear and draw both plots
    clearCanvas(linearGL);
    clearCanvas(logGL);
    
    linearPlotter.draw();
    logPlotter.draw();
    
  } catch (error) {
    console.error("Error in render loop:", error);
  }

  requestAnimationFrame(renderLoop);
}

// Toggle log X axis
function toggleLogX() {
  logXEnabled = !logXEnabled;
  console.log(`Log X axis ${logXEnabled ? 'enabled' : 'disabled'}`);
  
  if (logPlotter) {
    logPlotter.setLogAxis(logXEnabled, logYEnabled);
    console.log("Re-auto-scaling log plot after X toggle...");
    
    if (logXEnabled || logYEnabled) {
      // For log axes, use autoScaleToLogSpace which handles log transformation
      const bounds = logPlotter.autoScaleEnabledLines();
      if (bounds && bounds !== undefined) {
        const logResult = logPlotter.autoScaleToLogSpace(bounds);
        console.log("Log plot data bounds:", bounds);
        console.log("Log space scaling success:", logResult);
      } else {
        console.log("No valid bounds for log space scaling");
      }
    } else {
      // For linear axes, use regular auto-scaling
      const result = logPlotter.autoScaleEnabledLines();
      console.log("Log plot auto-scale result after X toggle:", result);
    }
  }
  updateLogStatus();
}

// Toggle log Y axis
function toggleLogY() {
  logYEnabled = !logYEnabled;
  console.log(`Log Y axis ${logYEnabled ? 'enabled' : 'disabled'}`);
  
  if (logPlotter) {
    logPlotter.setLogAxis(logXEnabled, logYEnabled);
    console.log("Re-auto-scaling log plot after Y toggle...");
    
    if (logXEnabled || logYEnabled) {
      // For log axes, use autoScaleToLogSpace which handles log transformation
      const bounds = logPlotter.autoScaleEnabledLines();
      if (bounds && bounds !== undefined) {
        const logResult = logPlotter.autoScaleToLogSpace(bounds);
        console.log("Log plot data bounds:", bounds);
        console.log("Log space scaling success:", logResult);
      } else {
        console.log("No valid bounds for log space scaling");
      }
    } else {
      // For linear axes, use regular auto-scaling
      const result = logPlotter.autoScaleEnabledLines();
      console.log("Log plot auto-scale result after Y toggle:", result);
    }
  }
  updateLogStatus();
}


// Update status displays
function updateStats(dataInfo: string) {
  const linearStats = document.getElementById("linearStats");
  
  if (linearStats) {
    linearStats.textContent = `Linear Scale - ${dataInfo}`;
  }
  
  updateLogStatus();
}

// Update log axis status
function updateLogStatus() {
  const logStats = document.getElementById("logStats");
  if (logStats) {
    const xStatus = logXEnabled ? "Log X" : "Linear X";
    const yStatus = logYEnabled ? "Log Y" : "Linear Y";
    logStats.textContent = `${xStatus}, ${yStatus} - Compare scaling behavior`;
  }
}

// Make functions globally available for HTML buttons
declare global {
  interface Window {
    generateExponentialData: () => void;
    generatePowerLawData: () => void;
    toggleLogX: () => void;
    toggleLogY: () => void;
  }
}

window.generateExponentialData = generateExponentialData;
window.generatePowerLawData = generatePowerLawData;
window.toggleLogX = toggleLogX;
window.toggleLogY = toggleLogY;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initPlots();
  generateExponentialData(); // Start with exponential data to show log scaling benefits
});

console.log("Log axis demo loaded - use buttons to explore log scaling features");