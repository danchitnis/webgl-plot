import { setupCanvasAndWebGL, UnifiedLinePlot, clearCanvas, transformBoundsToLinearSpace } from "../src/webglplot";

// Demo state
let plotter: UnifiedLinePlot;
let gl: WebGL2RenderingContext;
let isLogX = false;
let isLogY = false;
let animationFrameId: number;

// UI elements
let xAxisIndicator: HTMLElement;
let yAxisIndicator: HTMLElement;
let toggleXButton: HTMLElement;
let toggleYButton: HTMLElement;
let statusElements: {
  xAxisSpace: HTMLElement;
  yAxisSpace: HTMLElement;
  globalScale: HTMLElement;
  globalOffset: HTMLElement;
  boundsX: HTMLElement;
  boundsY: HTMLElement;
};

// Initialize the demo
function init() {
  console.log("🚀 Initializing Coordinate Space & Global Transform Demo");
  console.log("This demo shows how global transforms work differently in linear vs log space");
  
  // Get canvas and setup WebGL
  const canvas = document.getElementById("plotCanvas") as HTMLCanvasElement;
  if (!canvas) {
    throw new Error("Canvas element not found");
  }

  gl = setupCanvasAndWebGL(canvas, {
    backgroundColor: [0, 0, 0, 1],
    antialias: true
  });

  console.log("Canvas dimensions:", canvas.width, "x", canvas.height);

  // Setup UI references
  xAxisIndicator = document.getElementById("xAxisIndicator")!;
  yAxisIndicator = document.getElementById("yAxisIndicator")!;
  toggleXButton = document.getElementById("toggleXAxis")!;
  toggleYButton = document.getElementById("toggleYAxis")!;
  statusElements = {
    xAxisSpace: document.getElementById("xAxisSpace")!,
    yAxisSpace: document.getElementById("yAxisSpace")!,
    globalScale: document.getElementById("globalScale")!,
    globalOffset: document.getElementById("globalOffset")!,
    boundsX: document.getElementById("boundsX")!,
    boundsY: document.getElementById("boundsY")!,
  };

  // Create plotter
  plotter = new UnifiedLinePlot(gl, 1);

  // Generate y = log10(x) data
  generateLogFunction();

  // Initial setup in linear space
  setupLinearSpace();

  // Start render loop
  startRenderLoop();

  console.log("✅ Demo initialized successfully!");
  console.log("Try the controls to see how coordinate spaces and transforms work!");
}

/**
 * Generate y = log10(x) function data from x=0.1 to x=1000
 */
function generateLogFunction() {
  console.log("📊 Generating y = log₁₀(x) function data");
  
  const numPoints = 200;
  const xMin = 0.1;
  const xMax = 1000;
  const points = new Float32Array(numPoints * 2);

  // Generate logarithmically-spaced x values for smooth curve
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // Logarithmic spacing: x = xMin * (xMax/xMin)^t
    const x = xMin * Math.pow(xMax / xMin, t);
    const y = Math.log10(x);
    
    points[i * 2] = x;
    points[i * 2 + 1] = y;
  }

  console.log(`Generated ${numPoints} points from x=${xMin} to x=${xMax}`);
  console.log(`Y range: ${Math.log10(xMin).toFixed(3)} to ${Math.log10(xMax).toFixed(3)}`);

  // Initialize line
  plotter.initLines([{
    points: points,
    color: [0, 1, 0.5, 1], // Cyan-green color
    thickness: 2,
    enabled: true,
  }]);
}

/**
 * Setup initial linear space view
 */
function setupLinearSpace() {
  console.log("🔧 Setting up linear space view");
  
  isLogX = false;
  isLogY = false;
  plotter.setLogAxis(false, false);
  
  // Auto-scale to fit all data in linear space
  const bounds = plotter.getAllDataBounds();
  if (bounds) {
    console.log(`Linear space bounds: X[${bounds.minX.toFixed(3)}, ${bounds.maxX.toFixed(3)}], Y[${bounds.minY.toFixed(3)}, ${bounds.maxY.toFixed(3)}]`);
    plotter.autoScale();
  }
  
  updateUI();
}

/**
 * Toggle X-axis between linear and log coordinate space
 */
function toggleXAxis() {
  const oldSpaceX = isLogX ? "log" : "linear";
  const oldSpaceY = isLogY ? "log" : "linear";
  const newSpaceX = isLogX ? "linear" : "log";
  
  console.log(`\n🔄 Toggling X-axis from ${oldSpaceX} to ${newSpaceX} space`);
  console.log(`Current coordinate space: X:${oldSpaceX}, Y:${oldSpaceY}`);
  console.log("Using view preservation to maintain current zoom/pan...");

  // Get current view bounds (these are in the CURRENT coordinate space)
  const currentBounds = plotter.getDataBounds();
  if (currentBounds) {
    console.log(`Current view bounds (in ${oldSpaceX}/${oldSpaceY} space): X[${currentBounds.minX.toFixed(3)}, ${currentBounds.maxX.toFixed(3)}], Y[${currentBounds.minY.toFixed(3)}, ${currentBounds.maxY.toFixed(3)}]`);
    
    // Convert current bounds to linear space first (if needed)
    let linearBounds = currentBounds;
    if (isLogX || isLogY) {
      linearBounds = transformBoundsToLinearSpace(currentBounds, isLogX, isLogY);
      console.log(`Converted to linear space: X[${linearBounds.minX.toFixed(3)}, ${linearBounds.maxX.toFixed(3)}], Y[${linearBounds.minY.toFixed(3)}, ${linearBounds.maxY.toFixed(3)}]`);
      
      // Check for extreme bounds and fall back to data bounds if needed
      const dataRange = 1000 - 0.1; // Our data range
      const convertedRangeX = linearBounds.maxX - linearBounds.minX;
      if (convertedRangeX > dataRange * 100) { // If range is 100x larger than data
        console.log("⚠️ Converted bounds are extremely wide, falling back to data bounds for better UX");
        const dataBounds = plotter.getAllDataBounds();
        if (dataBounds) {
          linearBounds = dataBounds;
        }
      }
    }
    
    // Toggle X-axis state
    isLogX = !isLogX;
    
    console.log(`Setting log axes: X=${isLogX}, Y=${isLogY}`);
    plotter.setLogAxis(isLogX, isLogY);
    
    if (isLogX || isLogY) {
      // At least one axis is log, validate bounds are compatible with log space
      console.log("Transforming linear bounds to new log coordinate space");
      
      // Check if bounds are compatible with log axes
      let boundsToUse = linearBounds;
      if (isLogX && (linearBounds.minX <= 0 || linearBounds.maxX <= 0)) {
        console.log("⚠️ X bounds contain non-positive values, incompatible with log X axis");
        console.log("Falling back to data bounds for log compatibility");
        const dataBounds = plotter.getAllDataBounds();
        if (dataBounds) {
          boundsToUse = dataBounds;
        }
      } else if (isLogY && (linearBounds.minY <= 0 || linearBounds.maxY <= 0)) {
        console.log("⚠️ Y bounds contain non-positive values, incompatible with log Y axis");
        console.log("Falling back to data bounds for log compatibility");
        const dataBounds = plotter.getAllDataBounds();
        if (dataBounds) {
          boundsToUse = dataBounds;
        }
      }
      
      const success = plotter.transformToLogSpace(boundsToUse);
      if (!success) {
        console.log("Could not transform to new space, using auto-scale");
        const bounds = plotter.getAllDataBounds();
        if (bounds) {
          plotter.transformToLogSpace(bounds);
        }
      }
    } else {
      // Both axes are linear, apply linear transform directly
      console.log("Both axes are linear, applying linear space transform");
      applyLinearSpaceTransform(linearBounds);
    }
  }

  updateUI();
  console.log(`🎯 X-axis now in ${newSpaceX.toUpperCase()} space`);
}

/**
 * Toggle Y-axis between linear and log coordinate space
 */
function toggleYAxis() {
  const oldSpaceX = isLogX ? "log" : "linear";
  const oldSpaceY = isLogY ? "log" : "linear";
  const newSpaceY = isLogY ? "linear" : "log";
  
  console.log(`\n🔄 Toggling Y-axis from ${oldSpaceY} to ${newSpaceY} space`);
  console.log(`Current coordinate space: X:${oldSpaceX}, Y:${oldSpaceY}`);
  console.log("Using view preservation to maintain current zoom/pan...");

  // Get current view bounds (these are in the CURRENT coordinate space)
  const currentBounds = plotter.getDataBounds();
  if (currentBounds) {
    console.log(`Current view bounds (in ${oldSpaceX}/${oldSpaceY} space): X[${currentBounds.minX.toFixed(3)}, ${currentBounds.maxX.toFixed(3)}], Y[${currentBounds.minY.toFixed(3)}, ${currentBounds.maxY.toFixed(3)}]`);
    
    // Convert current bounds to linear space first (if needed)
    let linearBounds = currentBounds;
    if (isLogX || isLogY) {
      linearBounds = transformBoundsToLinearSpace(currentBounds, isLogX, isLogY);
      console.log(`Converted to linear space: X[${linearBounds.minX.toFixed(3)}, ${linearBounds.maxX.toFixed(3)}], Y[${linearBounds.minY.toFixed(3)}, ${linearBounds.maxY.toFixed(3)}]`);
      
      // Check for extreme bounds and fall back to data bounds if needed
      const dataRangeX = 1000 - 0.1; // Our X data range
      const dataRangeY = 3 - (-1); // Our Y data range  
      const convertedRangeX = linearBounds.maxX - linearBounds.minX;
      const convertedRangeY = linearBounds.maxY - linearBounds.minY;
      
      if (convertedRangeX > dataRangeX * 100 || convertedRangeY > dataRangeY * 100) { // If range is 100x larger than data
        console.log("⚠️ Converted bounds are extremely wide, falling back to data bounds for better UX");
        const dataBounds = plotter.getAllDataBounds();
        if (dataBounds) {
          linearBounds = dataBounds;
        }
      }
    }
    
    // Toggle Y-axis state
    isLogY = !isLogY;
    
    console.log(`Setting log axes: X=${isLogX}, Y=${isLogY}`);
    plotter.setLogAxis(isLogX, isLogY);
    
    if (isLogX || isLogY) {
      // At least one axis is log, validate bounds are compatible with log space
      console.log("Transforming linear bounds to new log coordinate space");
      
      // Check if bounds are compatible with log axes
      let boundsToUse = linearBounds;
      if (isLogX && (linearBounds.minX <= 0 || linearBounds.maxX <= 0)) {
        console.log("⚠️ X bounds contain non-positive values, incompatible with log X axis");
        console.log("Falling back to data bounds for log compatibility");
        const dataBounds = plotter.getAllDataBounds();
        if (dataBounds) {
          boundsToUse = dataBounds;
        }
      } else if (isLogY && (linearBounds.minY <= 0 || linearBounds.maxY <= 0)) {
        console.log("⚠️ Y bounds contain non-positive values, incompatible with log Y axis");
        console.log("Falling back to data bounds for log compatibility");
        const dataBounds = plotter.getAllDataBounds();
        if (dataBounds) {
          boundsToUse = dataBounds;
        }
      }
      
      const success = plotter.transformToLogSpace(boundsToUse);
      if (!success) {
        console.log("Could not transform to new space, using auto-scale");
        const bounds = plotter.getAllDataBounds();
        if (bounds) {
          plotter.transformToLogSpace(bounds);
        }
      }
    } else {
      // Both axes are linear, apply linear transform directly
      console.log("Both axes are linear, applying linear space transform");
      applyLinearSpaceTransform(linearBounds);
    }
  }

  updateUI();
  console.log(`🎯 Y-axis now in ${newSpaceY.toUpperCase()} space`);
}

/**
 * Zoom in by 2x in current coordinate space
 */
function zoomIn() {
  const xSpace = isLogX ? "log" : "linear";
  const ySpace = isLogY ? "log" : "linear";
  console.log(`\n🔍 Zooming IN 2× in X:${xSpace}, Y:${ySpace} space`);
  
  // Get current transform
  const currentBounds = plotter.getDataBounds();
  if (!currentBounds) {
    console.log("❌ Could not get current bounds for zoom");
    return;
  }

  const { minX, maxX, minY, maxY } = currentBounds;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const rangeX = (maxX - minX) / 4; // Zoom in by 2x = range / 2, then half again for each side
  const rangeY = (maxY - minY) / 4;

  const newBounds = {
    minX: centerX - rangeX,
    maxX: centerX + rangeX,
    minY: centerY - rangeY,
    maxY: centerY + rangeY,
  };

  console.log(`Current bounds: X[${minX.toFixed(3)}, ${maxX.toFixed(3)}], Y[${minY.toFixed(3)}, ${maxY.toFixed(3)}]`);
  console.log(`New bounds: X[${newBounds.minX.toFixed(3)}, ${newBounds.maxX.toFixed(3)}], Y[${newBounds.minY.toFixed(3)}, ${newBounds.maxY.toFixed(3)}]`);

  console.log(`📊 Coordinate space: X:${isLogX ? "log" : "linear"}, Y:${isLogY ? "log" : "linear"}`);
  applyMixedSpaceTransform(newBounds);

  updateUI();
}

/**
 * Zoom out by 2x in current coordinate space
 */
function zoomOut() {
  const xSpace = isLogX ? "log" : "linear";
  const ySpace = isLogY ? "log" : "linear";
  console.log(`\n🔍 Zooming OUT 2× in X:${xSpace}, Y:${ySpace} space`);
  
  const currentBounds = plotter.getDataBounds();
  if (!currentBounds) {
    console.log("❌ Could not get current bounds for zoom");
    return;
  }

  const { minX, maxX, minY, maxY } = currentBounds;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const rangeX = (maxX - minX); // Zoom out by 2x = range * 2, then half for each side
  const rangeY = (maxY - minY);

  const newBounds = {
    minX: centerX - rangeX,
    maxX: centerX + rangeX,
    minY: centerY - rangeY,
    maxY: centerY + rangeY,
  };

  console.log(`Current bounds: X[${minX.toFixed(3)}, ${maxX.toFixed(3)}], Y[${minY.toFixed(3)}, ${maxY.toFixed(3)}]`);
  console.log(`New bounds: X[${newBounds.minX.toFixed(3)}, ${newBounds.maxX.toFixed(3)}], Y[${newBounds.minY.toFixed(3)}, ${newBounds.maxY.toFixed(3)}]`);

  console.log(`📊 Coordinate space: X:${isLogX ? "log" : "linear"}, Y:${isLogY ? "log" : "linear"}`);
  applyMixedSpaceTransform(newBounds);

  updateUI();
}

/**
 * Pan left in current coordinate space
 */
function panLeft() {
  const xSpace = isLogX ? "log" : "linear";
  const ySpace = isLogY ? "log" : "linear";
  console.log(`\n↔️ Panning LEFT in X:${xSpace}, Y:${ySpace} space`);
  
  const currentBounds = plotter.getDataBounds();
  if (!currentBounds) {
    console.log("❌ Could not get current bounds for pan");
    return;
  }

  const { minX, maxX, minY, maxY } = currentBounds;
  const rangeX = maxX - minX;
  const panAmount = rangeX * 0.3; // Pan by 30% of current view

  const newBounds = {
    minX: minX - panAmount,
    maxX: maxX - panAmount,
    minY,
    maxY,
  };

  console.log(`Pan amount: ${panAmount.toFixed(3)} (30% of range)`);
  console.log(`Current X: [${minX.toFixed(3)}, ${maxX.toFixed(3)}]`);
  console.log(`New X: [${newBounds.minX.toFixed(3)}, ${newBounds.maxX.toFixed(3)}]`);

  console.log(`📊 Coordinate space: X:${isLogX ? "log" : "linear"}, Y:${isLogY ? "log" : "linear"}`);
  applyMixedSpaceTransform(newBounds);

  updateUI();
}

/**
 * Pan right in current coordinate space
 */
function panRight() {
  const xSpace = isLogX ? "log" : "linear";
  const ySpace = isLogY ? "log" : "linear";
  console.log(`\n↔️ Panning RIGHT in X:${xSpace}, Y:${ySpace} space`);
  
  const currentBounds = plotter.getDataBounds();
  if (!currentBounds) {
    console.log("❌ Could not get current bounds for pan");
    return;
  }

  const { minX, maxX, minY, maxY } = currentBounds;
  const rangeX = maxX - minX;
  const panAmount = rangeX * 0.3; // Pan by 30% of current view

  const newBounds = {
    minX: minX + panAmount,
    maxX: maxX + panAmount,
    minY,
    maxY,
  };

  console.log(`Pan amount: ${panAmount.toFixed(3)} (30% of range)`);
  console.log(`Current X: [${minX.toFixed(3)}, ${maxX.toFixed(3)}]`);
  console.log(`New X: [${newBounds.minX.toFixed(3)}, ${newBounds.maxX.toFixed(3)}]`);

  console.log(`📊 Coordinate space: X:${isLogX ? "log" : "linear"}, Y:${isLogY ? "log" : "linear"}`);
  applyMixedSpaceTransform(newBounds);

  updateUI();
}

/**
 * Reset to default auto-scaled view
 */
function resetView() {
  console.log("\n🔄 Resetting to default view");
  
  if (isLogX || isLogY) {
    console.log(`📊 At least one axis is log: X:${isLogX ? "log" : "linear"}, Y:${isLogY ? "log" : "linear"}`);
    console.log("Using getAllDataBounds() → transformToLogSpace()");
    const bounds = plotter.getAllDataBounds();
    if (bounds) {
      plotter.transformToLogSpace(bounds);
    }
  } else {
    console.log("📊 Both axes are linear: using autoScale()");
    plotter.autoScale();
  }

  updateUI();
  console.log("✅ View reset complete");
}

/**
 * Apply transform using the enhanced coordinate-space aware API.
 * The new API handles all coordinate space combinations automatically!
 */
function applyMixedSpaceTransform(bounds: { minX: number; maxX: number; minY: number; maxY: number }) {
  console.log("Using enhanced API with automatic coordinate space handling");
  
  // Create bounds with coordinate space info for the enhanced API
  const boundsWithSpace = {
    ...bounds,
    coordinateSpace: {
      x: isLogX ? "log" as const : "linear" as const,
      y: isLogY ? "log" as const : "linear" as const,
    },
  };
  
  if (!isLogX && !isLogY) {
    // Both axes are linear - use standard linear transform
    // (transformToLogSpace would do nothing when no log axes are enabled)
    applyLinearSpaceTransform(bounds);
  } else {
    // At least one axis is log - use enhanced transformToLogSpace API
    const success = plotter.transformToLogSpace(boundsWithSpace);
    if (!success) {
      console.log("Failed to apply transform, falling back to auto-scale");
      const fallbackBounds = plotter.getAllDataBounds();
      if (fallbackBounds) {
        plotter.transformToLogSpace(fallbackBounds);
      }
    }
  }
}

/**
 * Apply transform for linear space (since transformToLogSpace does nothing when no log axes)
 */
function applyLinearSpaceTransform(bounds: { minX: number; maxX: number; minY: number; maxY: number }) {
  // Calculate transform to fit bounds into NDC [-1, 1]
  const { minX, maxX, minY, maxY } = bounds;
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;

  let scaleX = 1.0;
  let scaleY = 1.0;
  let offsetX = 0.0;
  let offsetY = 0.0;

  if (rangeX > 1e-9) {
    scaleX = 2.0 / rangeX;
    const centerX = minX + rangeX / 2.0;
    offsetX = 0.0 - centerX * scaleX;
  }

  if (rangeY > 1e-9) {
    scaleY = 2.0 / rangeY;
    const centerY = minY + rangeY / 2.0;
    offsetY = 0.0 - centerY * scaleY;
  }

  console.log(`Calculated linear transform: Scale[${scaleX.toFixed(4)}, ${scaleY.toFixed(4)}], Offset[${offsetX.toFixed(4)}, ${offsetY.toFixed(4)}]`);
  plotter.setGlobalTransform([scaleX, scaleY], [offsetX, offsetY]);
}

/**
 * Update UI elements with current state
 */
function updateUI() {
  // Update X-axis indicator
  if (isLogX) {
    xAxisIndicator.textContent = "X: LOG";
    xAxisIndicator.className = "coordinate-indicator log";
    toggleXButton.textContent = "X: Switch to Linear";
    statusElements.xAxisSpace.textContent = "Log";
  } else {
    xAxisIndicator.textContent = "X: LINEAR";
    xAxisIndicator.className = "coordinate-indicator linear";
    toggleXButton.textContent = "X: Switch to Log";
    statusElements.xAxisSpace.textContent = "Linear";
  }

  // Update Y-axis indicator
  if (isLogY) {
    yAxisIndicator.textContent = "Y: LOG";
    yAxisIndicator.className = "coordinate-indicator log";
    toggleYButton.textContent = "Y: Switch to Linear";
    statusElements.yAxisSpace.textContent = "Log";
  } else {
    yAxisIndicator.textContent = "Y: LINEAR";
    yAxisIndicator.className = "coordinate-indicator linear";
    toggleYButton.textContent = "Y: Switch to Log";
    statusElements.yAxisSpace.textContent = "Linear";
  }

  // Get current global transform and bounds
  const currentBounds = plotter.getDataBounds();
  if (currentBounds) {
    statusElements.boundsX.textContent = `[${currentBounds.minX.toFixed(3)}, ${currentBounds.maxX.toFixed(3)}]`;
    statusElements.boundsY.textContent = `[${currentBounds.minY.toFixed(3)}, ${currentBounds.maxY.toFixed(3)}]`;
  }

  // Display actual global scale and offset values
  const globalScale = plotter.getGlobalScale();
  const globalOffset = plotter.getGlobalOffset();
  statusElements.globalScale.textContent = `[${globalScale[0].toFixed(4)}, ${globalScale[1].toFixed(4)}]`;
  statusElements.globalOffset.textContent = `[${globalOffset[0].toFixed(4)}, ${globalOffset[1].toFixed(4)}]`;
}

/**
 * Render loop
 */
function render() {
  clearCanvas(gl);
  plotter.draw();
  animationFrameId = requestAnimationFrame(render);
}

function startRenderLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  render();
}

// Make functions globally available
declare global {
  interface Window {
    toggleXAxis: () => void;
    toggleYAxis: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    panLeft: () => void;
    panRight: () => void;
    resetView: () => void;
  }
}

window.toggleXAxis = toggleXAxis;
window.toggleYAxis = toggleYAxis;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.panLeft = panLeft;
window.panRight = panRight;
window.resetView = resetView;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}