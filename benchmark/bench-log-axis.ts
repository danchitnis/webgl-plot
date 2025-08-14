import { setupCanvasAndWebGL, UnifiedLinePlot, WebglLinePlot, WebglLineThick, clearCanvas, type LineConfig } from "../src/webglplot";
import type { DataBounds } from "../src/LogAxisUtils";

// Add type for the line plotters
type LinePlotter = {
  initLines: (lines: LineConfig[]) => void;
  autoScaleEnabledLines: () => unknown;
  draw: () => void;
  getDataBounds: () => { minX: number; maxX: number; minY: number; maxY: number } | null;
  setLogAxis: (x: boolean, y: boolean) => void;
  autoScaleToLogSpace: (dataBounds?: DataBounds | null) => boolean;
};

let linearGL: WebGL2RenderingContext;
let logGL: WebGL2RenderingContext;
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

  try {
    linearGL = setupCanvasAndWebGL(linearCanvas, {
      backgroundColor: [0.1, 0.1, 0.1, 1],
      antialias: true
    });

    logGL = setupCanvasAndWebGL(logCanvas, {
      backgroundColor: [0.1, 0.1, 0.1, 1],
      antialias: true
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
  if (!linearGL || !logGL) {
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
    const createLinePlotter = (gl: WebGL2RenderingContext) => {
      switch (currentLineType) {
        case 'thin':
          return new WebglLinePlot(gl, 3);
        case 'thick':
          return new WebglLineThick(gl, 3);
        case 'unified':
        default:
          return new UnifiedLinePlot(gl, 3);
      }
    };

    // Linear plot setup
    linearLinePlotter = createLinePlotter(linearGL);
    linearLinePlotter.setLogAxis(false, false);
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
    logLinePlotter = createLinePlotter(logGL);
    logLinePlotter.setLogAxis(logXEnabled, logYEnabled);
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
  if (!linearGL || !logGL || currentData.length === 0) {
    return;
  }

  try {
    console.log(`Updating plots - Log X: ${logXEnabled}, Log Y: ${logYEnabled}`);
    
    // Create fresh copy of data for each plot to avoid mutation issues
    const linearData = new Float32Array(currentData);
    const logData = new Float32Array(currentData);

    // Create line plotters based on current line type
    const createLinePlotter = (gl: WebGL2RenderingContext) => {
      switch (currentLineType) {
        case 'thin':
          return new WebglLinePlot(gl, 1);
        case 'thick':
          return new WebglLineThick(gl, 1);
        case 'unified':
        default:
          return new UnifiedLinePlot(gl, 1);
      }
    };

    // Linear plot (always linear axes)
    linearLinePlotter = createLinePlotter(linearGL);
    linearLinePlotter.setLogAxis(false, false);
    linearLinePlotter.initLines([{
      points: linearData,
      color: [1, 0.5, 0, 1], // Orange
      thickness: currentThickness,
      enabled: true
    }]);

    // Log plot (with current log settings)
    logLinePlotter = createLinePlotter(logGL);
    logLinePlotter.setLogAxis(logXEnabled, logYEnabled);
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
  if (!linearGL || !logGL || !linearLinePlotter || !logLinePlotter) return;

  try {
    // Clear and update both plots
    clearCanvas(linearGL);
    clearCanvas(logGL);
    
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
  if (logLinePlotter) {
    logLinePlotter.setLogAxis(logXEnabled, logYEnabled);
    
    // Re-auto-scale with the new log settings (the auto-scaling logic now handles log transformation)
    if (logLinePlotter) {
      logLinePlotter.autoScaleEnabledLines();
      console.log('Re-auto-scaled for new log axis settings');
    }
  }
  updateLogStatus();
}

// Toggle log Y axis
function toggleLogY() {
  logYEnabled = !logYEnabled;
  console.log(`Log Y axis ${logYEnabled ? 'enabled' : 'disabled'}`);
  
  // Update log settings in real-time without reinitializing
  if (logLinePlotter) {
    logLinePlotter.setLogAxis(logXEnabled, logYEnabled);
    
    // Re-auto-scale with the new log settings (the auto-scaling logic now handles log transformation)
    if (logLinePlotter) {
      logLinePlotter.autoScaleEnabledLines();
      console.log('Re-auto-scaled for new log axis settings');
    }
  }
  updateLogStatus();
}

// Auto scale both plots
function autoScale() {
  updatePlots(); // This calls autoScaleEnabledLines internally
}

// Test viewbounds calculation fix
function testViewboundsFix() {
  console.log('=== Testing Viewbounds Fix ===');
  
  if (!logGL || !logLinePlotter) {
    console.error('Log plot not initialized');
    return;
  }
  
  // Generate some test data
  generateExponentialData();
  
  // Set log axes
  logLinePlotter?.setLogAxis(true, true);
  
  // Get data bounds from plotter (actual data)
  const dataBounds = logLinePlotter.getDataBounds();
  if (dataBounds) {
    console.log(`Actual data bounds: X[${dataBounds.minX.toFixed(3)}, ${dataBounds.maxX.toFixed(3)}], Y[${dataBounds.minY.toFixed(3)}, ${dataBounds.maxY.toFixed(3)}]`);
    
    // Test old approach (transform-based bounds)
    console.log('Testing legacy transform-based approach...');
    const legacySuccess = logLinePlotter?.autoScaleToLogSpace();
    console.log(`Legacy approach: ${legacySuccess ? 'succeeded' : 'failed'}`);
    
    // Test new approach (data-based bounds)
    console.log('Testing new data-based approach...');
    const dataSuccess = logLinePlotter?.autoScaleToLogSpace(dataBounds);
    console.log(`Data-based approach: ${dataSuccess ? 'succeeded' : 'failed'}`);
    
    // Compare the results
    if (dataSuccess && legacySuccess) {
      console.log('Both approaches succeeded - data bounds approach is now more accurate');
    } else if (dataSuccess && !legacySuccess) {
      console.log('Data bounds approach succeeded where legacy failed - fix working!');
    } else if (!dataSuccess) {
      console.log('Data bounds approach failed - needs investigation');
    }
  } else {
    console.log('No data bounds available - plotter may not have valid data');
  }
  
  console.log('=== Viewbounds Fix Test Complete ===');
}

// Test smart auto-scaling to log space
function smartAutoScale() {
  console.log('=== Testing Smart Auto Scale ===');
  
  if (linearLinePlotter) {
    console.log('Linear plot: calling regular autoScaleEnabledLines()');
    linearLinePlotter.autoScaleEnabledLines();
  }
  
  if (logGL && logLinePlotter) {
    console.log('Log plot: First ensuring proper scaling, then testing smart log space scaling');
    
    // First ensure the plot is properly scaled with current settings
    logLinePlotter.autoScaleEnabledLines();
    console.log('Initial auto-scaling complete');
    
    // Get actual data bounds from the plotter (this is the fix!)
    const dataBounds = logLinePlotter.getDataBounds();
    if (dataBounds) {
      console.log(`Data bounds from plotter: X[${dataBounds.minX.toFixed(3)}, ${dataBounds.maxX.toFixed(3)}], Y[${dataBounds.minY.toFixed(3)}, ${dataBounds.maxY.toFixed(3)}]`);
      
      // Test the new method using actual data bounds
      console.log(`Testing autoScaleToLogSpace() with actual data bounds (logX=${logXEnabled}, logY=${logYEnabled})`);
      const success = logLinePlotter?.autoScaleToLogSpace(dataBounds);
      console.log(`Smart auto-scaling with data bounds ${success ? 'succeeded' : 'failed'}`);
      
      if (!success) {
        console.log('Smart scaling with data bounds failed, falling back to regular auto-scaling');
        logLinePlotter.autoScaleEnabledLines();
      }
    } else {
      console.log('No data bounds available from plotter, testing legacy transform-based approach');
      const success = logLinePlotter?.autoScaleToLogSpace();
      console.log(`Legacy smart auto-scaling ${success ? 'succeeded' : 'failed'}`);
      
      if (!success) {
        console.log('Legacy smart scaling failed, falling back to regular auto-scaling');
        logLinePlotter.autoScaleEnabledLines();
      }
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
  const createTestPlotter = (gl: WebGL2RenderingContext) => {
    switch (currentLineType) {
      case 'thin':
        return new WebglLinePlot(gl, 1);
      case 'thick':
        return new WebglLineThick(gl, 1);
      case 'unified':
      default:
        return new UnifiedLinePlot(gl, 1);
    }
  };

  // Measure linear plot performance
  const linearStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    const linePlotter = createTestPlotter(linearGL);
    linePlotter.setLogAxis(false, false);
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
    const linePlotter = createTestPlotter(logGL);
    linePlotter.setLogAxis(logXEnabled, logYEnabled);
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
    testViewboundsFix: () => void;
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
window.testViewboundsFix = testViewboundsFix;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initPlots();
  generateExponentialData(); // Start with exponential data
});

console.log("Log axis benchmark loaded");