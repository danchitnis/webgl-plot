import { WebglPlot, type LineConfig } from "../src/webglplot";

// Add type for the line plotters
type LinePlotter = {
  initLines: (lines: LineConfig[]) => void;
  autoScaleEnabledLines: () => void;
  draw: () => void;
};

let linearPlot: WebglPlot;
let logPlot: WebglPlot;
let currentData: Float32Array = new Float32Array(0);
let logXEnabled = false;
let logYEnabled = false;
let isRenderingActive = false;

// Line type configuration
type LineType = 'thin' | 'thick' | 'unified';
let currentLineType: LineType = 'unified';
let currentThickness = 2;

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

// Generate multi-line test data to test the issue with disabled lines containing negative values
function generateMultiLineTestData() {
  console.log("=== Generating Multi-Line Test Data ===");
  
  // This function creates multiple lines where some contain negative values
  // and tests that auto-scaling only considers enabled lines when using log axes
  
  // We'll update the plots to show multiple lines instead of single line
  if (!linearPlot || !logPlot) {
    console.error("Plots not initialized");
    return;
  }

  try {
    console.log("Creating multi-line test data");
    
    // Line 1: Positive exponential data (good for log scale)
    const points1 = new Float32Array(200);
    for (let i = 0; i < 100; i++) {
      const x = 0.1 + (i / 99) * 10;
      const y = Math.exp(x * 0.3); // Always positive, exponential
      points1[i * 2] = x;
      points1[i * 2 + 1] = y;
    }
    
    // Line 2: Mixed positive/negative data (problematic for log Y)
    const points2 = new Float32Array(200);
    for (let i = 0; i < 100; i++) {
      const x = 0.1 + (i / 99) * 10;
      const y = Math.sin(x) * 50; // Oscillates between positive and negative
      points2[i * 2] = x;
      points2[i * 2 + 1] = y;
    }
    
    // Line 3: Mostly negative values (problematic for log Y)
    const points3 = new Float32Array(200);
    for (let i = 0; i < 100; i++) {
      const x = 0.1 + (i / 99) * 10;
      const y = -10 - i * 0.1; // Negative values
      points3[i * 2] = x;
      points3[i * 2 + 1] = y;
    }

    // Create line plotters
    const createLinePlotter = (plot: WebglPlot) => {
      switch (currentLineType) {
        case 'thin':
          return plot.newThinLinePlotter(3);
        case 'thick':
          return plot.newThickLinePlotter(3);
        case 'unified':
        default:
          return plot.newUnifiedLinePlotter(3);
      }
    };

    // Linear plot setup
    linearPlot.setLogAxis(false, false);
    linearLinePlotter = createLinePlotter(linearPlot);
    linearLinePlotter.initLines([
      {
        points: points1,
        color: [1, 0, 0, 1], // Red - positive exponential
        thickness: currentThickness,
        enabled: true
      },
      {
        points: points2,
        color: [0, 1, 0, 1], // Green - mixed pos/neg  
        thickness: currentThickness,
        enabled: true // Initially enabled, but user can disable
      },
      {
        points: points3,
        color: [0, 0, 1, 1], // Blue - negative values
        thickness: currentThickness,
        enabled: true // Initially enabled, but user can disable
      }
    ]);

    // Log plot setup (this is where the issue should be tested)
    logPlot.setLogAxis(logXEnabled, logYEnabled);
    logLinePlotter = createLinePlotter(logPlot);
    logLinePlotter.initLines([
      {
        points: points1,
        color: [1, 0, 0, 1], // Red - positive exponential
        thickness: currentThickness,
        enabled: true
      },
      {
        points: points2,
        color: [0, 1, 0, 1], // Green - mixed pos/neg
        thickness: currentThickness,
        enabled: true // ENABLED - but will be skipped by auto-scaling for log Y due to negative values
      },
      {
        points: points3,
        color: [0, 0, 1, 1], // Blue - negative values
        thickness: currentThickness,
        enabled: true // ENABLED - but will be skipped by auto-scaling for log Y due to negative values
      }
    ]);

    // Auto-scale both plots
    console.log("Auto-scaling linear plot (all lines enabled)");
    linearLinePlotter.autoScaleEnabledLines();
    
    console.log("Auto-scaling log plot (only positive line enabled)");
    logLinePlotter.autoScaleEnabledLines();

    // Start the render loop if not already running
    if (!isRenderingActive) {
      isRenderingActive = true;
      renderLoop();
    }

    updateStats("Multi-line test: Red=positive exp (always considered), Green=mixed +/- (skipped for log Y), Blue=negative (skipped for log Y)");
    console.log("=== Multi-Line Test Data Created ===");
    console.log("Linear plot: All 3 lines enabled and considered for auto-scaling");
    console.log("Log plot: All 3 lines enabled, but auto-scaling will skip green/blue lines for log Y");
    console.log("This tests the improved auto-scaling that skips lines with insufficient positive values for log axes");
    console.log("Expected: Linear plot shows all data ranges, Log plot only scales to fit red line");

  } catch (error) {
    console.error("Error creating multi-line test data:", error);
  }
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

    // Create line plotters based on current line type
    const createLinePlotter = (plot: WebglPlot) => {
      switch (currentLineType) {
        case 'thin':
          return plot.newThinLinePlotter(1);
        case 'thick':
          return plot.newThickLinePlotter(1);
        case 'unified':
        default:
          return plot.newUnifiedLinePlotter(1);
      }
    };

    // Linear plot (always linear axes)
    linearPlot.setLogAxis(false, false);
    linearLinePlotter = createLinePlotter(linearPlot);
    linearLinePlotter.initLines([{
      points: linearData,
      color: [1, 0.5, 0, 1], // Orange
      thickness: currentThickness,
      enabled: true
    }]);

    // Log plot (with current log settings)
    logPlot.setLogAxis(logXEnabled, logYEnabled);
    logLinePlotter = createLinePlotter(logPlot);
    logLinePlotter.initLines([{
      points: logData,
      color: [0, 0.8, 1, 1], // Cyan
      thickness: currentThickness,
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
  
  // Update log settings in real-time without reinitializing
  if (logPlot) {
    logPlot.setLogAxis(logXEnabled, logYEnabled);
    
    // Re-auto-scale with the new log settings (the auto-scaling logic now handles log transformation)
    if (logLinePlotter) {
      logLinePlotter.autoScaleEnabledLines();
      if (logPlot.debug) {
        console.log('Re-auto-scaled for new log axis settings');
      }
    }
  }
  updateLogStatus();
}

// Toggle log Y axis
function toggleLogY() {
  logYEnabled = !logYEnabled;
  console.log(`Log Y axis ${logYEnabled ? 'enabled' : 'disabled'}`);
  
  // Update log settings in real-time without reinitializing
  if (logPlot) {
    logPlot.setLogAxis(logXEnabled, logYEnabled);
    
    // Re-auto-scale with the new log settings (the auto-scaling logic now handles log transformation)
    if (logLinePlotter) {
      logLinePlotter.autoScaleEnabledLines();
      if (logPlot.debug) {
        console.log('Re-auto-scaled for new log axis settings');
      }
    }
  }
  updateLogStatus();
}

// Auto scale both plots
function autoScale() {
  updatePlots(); // This calls autoScaleEnabledLines internally
}

// Test smart auto-scaling to log space
function smartAutoScale() {
  console.log('=== Testing Smart Auto Scale ===');
  
  if (linearLinePlotter) {
    if (linearPlot.debug) {
      console.log('Linear plot: calling regular autoScaleEnabledLines()');
    }
    linearLinePlotter.autoScaleEnabledLines();
  }
  
  if (logPlot && logLinePlotter) {
    if (logPlot.debug) {
      console.log('Log plot: First ensuring proper scaling, then testing smart log space scaling');
    }
    
    // First ensure the plot is properly scaled with current settings
    logLinePlotter.autoScaleEnabledLines();
    if (logPlot.debug) {
      console.log('Initial auto-scaling complete');
    }
    
    // Now test the smart scaling to log space function
    console.log(`Testing autoScaleToLogSpace() with logX=${logXEnabled}, logY=${logYEnabled}`);
    const success = logPlot.autoScaleToLogSpace();
    console.log(`Smart auto-scaling ${success ? 'succeeded' : 'failed'}`);
    
    if (!success) {
      console.log('Smart scaling failed, falling back to regular auto-scaling');
      logLinePlotter.autoScaleEnabledLines();
    }
  }
  
  console.log('=== Smart Auto Scale Complete ===');
}

// Set line type and update plots
function setLineType(lineType: LineType) {
  currentLineType = lineType;
  
  // Update thickness based on line type
  switch (lineType) {
    case 'thin':
      currentThickness = 1;
      break;
    case 'thick':
      currentThickness = 3;
      break;
    case 'unified':
      currentThickness = 2; // Will auto-choose thick plotter
      break;
  }
  
  // Update status display
  const statusElement = document.getElementById('currentLineType');
  if (statusElement) {
    const plotterType = lineType === 'unified' ? 
      `Unified (${currentThickness > 1 ? 'thick' : 'thin'})` : 
      lineType;
    statusElement.textContent = `Current: ${plotterType} (thickness = ${currentThickness})`;
  }
  
  console.log(`Switched to ${lineType} lines (thickness = ${currentThickness})`);
  
  // Stop current rendering and reinitialize with new line type
  isRenderingActive = false;
  updatePlots();
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
  
  // Create plotter function for current line type
  const createTestPlotter = (plot: WebglPlot) => {
    switch (currentLineType) {
      case 'thin':
        return plot.newThinLinePlotter(1);
      case 'thick':
        return plot.newThickLinePlotter(1);
      case 'unified':
      default:
        return plot.newUnifiedLinePlotter(1);
    }
  };

  // Measure linear plot performance
  const linearStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    linearPlot.setLogAxis(false, false);
    const linePlotter = createTestPlotter(linearPlot);
    linePlotter.initLines([{
      points: currentData,
      color: [1, 0.5, 0, 1],
      thickness: currentThickness,
      enabled: true
    }]);
  }
  const linearTime = performance.now() - linearStart;

  // Measure log plot performance
  const logStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    logPlot.setLogAxis(logXEnabled, logYEnabled);
    const linePlotter = createTestPlotter(logPlot);
    linePlotter.initLines([{
      points: currentData,
      color: [0, 0.8, 1, 1],
      thickness: currentThickness,
      enabled: true
    }]);
  }
  const logTime = performance.now() - logStart;

  console.log(`Performance (${iterations} iterations) - ${currentLineType} lines (thickness = ${currentThickness}):`);
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
    generateMultiLineTestData: () => void;
    toggleLogX: () => void;
    toggleLogY: () => void;
    autoScale: () => void;
    measurePerformance: () => void;
    setLineType: (lineType: LineType) => void;
    smartAutoScale: () => void;
  }
}


window.generateExponentialData = generateExponentialData;
window.generatePowerLawData = generatePowerLawData;
window.generateMixedData = generateMixedData;
window.generateMultiLineTestData = generateMultiLineTestData;
window.toggleLogX = toggleLogX;
window.toggleLogY = toggleLogY;
window.autoScale = autoScale;
window.measurePerformance = measurePerformance;
window.setLineType = setLineType;
window.smartAutoScale = smartAutoScale;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initPlots();
  generateExponentialData(); // Start with exponential data
});

console.log("Log axis benchmark loaded");