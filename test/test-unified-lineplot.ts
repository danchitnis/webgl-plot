import { WebglPlot, UnifiedLinePlot, ColorRGBA, LineConfig } from "../src/webglplot";
// Note: WebglLinePlot and WebglLineThick are not directly used in tests anymore,
// but UnifiedLinePlot uses them, so they are implicitly part of what's tested.

// Simple Assertion Function
function assert(condition: unknown, message: string): void {
  if (!condition) {
    console.error("Assertion Failed:", message);
    const errorDisplay = document.getElementById("errorDisplay");
    if (errorDisplay) {
      const p = document.createElement("p");
      p.textContent = `Assertion Failed: ${message}`;
      errorDisplay.appendChild(p);
    }
    throw new Error(message);
  } else {
    console.log("Assertion Passed:", message);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    const msg = `${message} - Expected: ${expected}, Actual: ${actual}`;
    console.error("Assertion Failed:", msg);
    const errorDisplay = document.getElementById("errorDisplay");
    if (errorDisplay) {
      const p = document.createElement("p");
      p.textContent = `Assertion Failed: ${msg}`;
      errorDisplay.appendChild(p);
    }
    throw new Error(msg);
  } else {
    console.log("Assertion Passed:", message);
  }
}

// Mock canvas for WebglPlot initialization
const mockCanvas = document.createElement("canvas");
mockCanvas.width = 100;
mockCanvas.height = 100;
// Append to body if tests need actual rendering, otherwise not strictly necessary for these logic tests.
// document.body.appendChild(mockCanvas);


// Test Suite
console.log("Starting WebglPlot.createLinePlot() tests...");

const tests = {
  runAllTests: function () {
    this.testThicknessLessThanOne();
    this.testThicknessEqualToOne();
    this.testThicknessGreaterThanOne();
    this.testThicknessUndefined();
    this.testThicknessZero();
    console.log("All tests completed.");
    const successDisplay = document.getElementById("successDisplay");
    if (successDisplay) {
        successDisplay.textContent = "All tests completed successfully!";
    }
  },

  // Test Case 1: Thickness < 1.0
  testThicknessLessThanOne: function () {
    console.log("Running test: Thickness < 1.0");
    const webglPlot = new WebglPlot(mockCanvas);
    const lineConfig: LineConfig = {
      points: new Float32Array([0, 0, 1, 1]),
      color: [1, 0, 0, 1], // Red
      thickness: 0.5,
    };
    // const plotObject = webglPlot.createLinePlot(lineConfig);
    const unifiedPlotter = webglPlot.newUnifiedLinePlotter(1);
    unifiedPlotter.initLines([lineConfig]);

    // assert(plotObject instanceof WebglLinePlot, "Should be WebglLinePlot for thickness 0.5");
    // With UnifiedLinePlot, the object itself is UnifiedLinePlot. We check its effect.
    const effectiveConfig = unifiedPlotter.getLineConfig(0);
    assert(effectiveConfig !== undefined, "Effective config should exist");
    assertEquals(effectiveConfig?.thickness, 1.0, "Effective thickness should be 1.0 for input 0.5");
    assertEquals(unifiedPlotter.getInternalPlotterType(), 'WebglLinePlot', "Internal plotter should be WebglLinePlot for thickness 0.5");
  },

  // Test Case 2: Thickness = 1.0
  testThicknessEqualToOne: function () {
    console.log("Running test: Thickness = 1.0");
    const webglPlot = new WebglPlot(mockCanvas);
    const lineConfig: LineConfig = {
      points: new Float32Array([0, 0, 1, 1]),
      color: [0, 1, 0, 1], // Green
      thickness: 1.0,
    };
    const unifiedPlotter = webglPlot.newUnifiedLinePlotter(1);
    unifiedPlotter.initLines([lineConfig]);

    const effectiveConfig = unifiedPlotter.getLineConfig(0);
    assert(effectiveConfig !== undefined, "Effective config should exist");
    assertEquals(effectiveConfig?.thickness, 1.0, "Effective thickness should be 1.0 for input 1.0");
    assertEquals(unifiedPlotter.getInternalPlotterType(), 'WebglLinePlot', "Internal plotter should be WebglLinePlot for thickness 1.0");
  },

  // Test Case 3: Thickness > 1.0
  testThicknessGreaterThanOne: function () {
    console.log("Running test: Thickness > 1.0");
    const webglPlot = new WebglPlot(mockCanvas);
    const lineConfig: LineConfig = {
      points: new Float32Array([0, 0, 1, 1]),
      color: [0, 0, 1, 1], // Blue
      thickness: 1.5,
    };
    const unifiedPlotter = webglPlot.newUnifiedLinePlotter(1);
    unifiedPlotter.initLines([lineConfig]);

    // UnifiedLinePlot will internally use WebglLineThick.
    // Its getLineConfig should reflect the thickness used by the internal plotter.
    const effectiveConfig = unifiedPlotter.getLineConfig(0);
    assert(effectiveConfig !== undefined, "Effective config should exist");
    assertEquals(effectiveConfig?.thickness, 1.5, "Effective thickness should be 1.5 for input 1.5");
    assertEquals(unifiedPlotter.getInternalPlotterType(), 'WebglLineThick', "Internal plotter should be WebglLineThick for thickness 1.5");
  },

  // Test Case 4: Thickness undefined
  testThicknessUndefined: function () {
    console.log("Running test: Thickness undefined");
    const webglPlot = new WebglPlot(mockCanvas);
    const lineConfig: LineConfig = {
      points: new Float32Array([0, 0, 1, 1]),
      color: [1, 1, 0, 1], // Yellow
      // thickness is undefined
    };
    const unifiedPlotter = webglPlot.newUnifiedLinePlotter(1);
    unifiedPlotter.initLines([lineConfig]);

    const effectiveConfig = unifiedPlotter.getLineConfig(0);
    assert(effectiveConfig !== undefined, "Effective config should exist");
    assertEquals(effectiveConfig?.thickness, 1.0, "Effective thickness should be 1.0 for undefined input");
    assertEquals(unifiedPlotter.getInternalPlotterType(), 'WebglLinePlot', "Internal plotter should be WebglLinePlot for undefined thickness");
  },

  // Test Case 5: Thickness = 0
  testThicknessZero: function () {
    console.log("Running test: Thickness = 0");
    const webglPlot = new WebglPlot(mockCanvas);
    const lineConfig: LineConfig = {
      points: new Float32Array([0, 0, 1, 1]),
      color: [1, 0, 1, 1], // Magenta
      thickness: 0,
    };
    const unifiedPlotter = webglPlot.newUnifiedLinePlotter(1);
    unifiedPlotter.initLines([lineConfig]);

    const effectiveConfig = unifiedPlotter.getLineConfig(0);
    assert(effectiveConfig !== undefined, "Effective config should exist");
    assertEquals(effectiveConfig?.thickness, 1.0, "Effective thickness should be 1.0 for input 0");
    assertEquals(unifiedPlotter.getInternalPlotterType(), 'WebglLinePlot', "Internal plotter should be WebglLinePlot for thickness 0");
  },

  // Test API delegation: updateLineColor
  testUpdateLineColorDelegation: function () {
    console.log("Running test: updateLineColor delegation");
    const webglPlot = new WebglPlot(mockCanvas);

    // Scenario 1: Thin line (WebglLinePlot internally)
    const thinLineConfig: LineConfig = { points: new Float32Array([0,0,1,1]), color: [1,0,0,1], thickness: 1.0 };
    const thinPlotter = webglPlot.newUnifiedLinePlotter(1);
    thinPlotter.initLines([thinLineConfig]);
    const newRedColor: [number,number,number,number] = [0.8,0.1,0.1,0.9];
    thinPlotter.updateLineColor(0, newRedColor);
    let effectiveConfigThin = thinPlotter.getLineConfig(0);
    assert(effectiveConfigThin !== undefined, "[Thin] Effective config should exist after color update");
    assertEquals(JSON.stringify(effectiveConfigThin?.color), JSON.stringify(newRedColor), "[Thin] Color should be updated");
    assertEquals(thinPlotter.getInternalPlotterType(), 'WebglLinePlot', "[Thin] Internal plotter should be WebglLinePlot");

    // Scenario 2: Thick line (WebglLineThick internally)
    const thickLineConfig: LineConfig = { points: new Float32Array([0,0,1,1]), color: [0,0,1,1], thickness: 2.0 };
    const thickPlotter = webglPlot.newUnifiedLinePlotter(1);
    thickPlotter.initLines([thickLineConfig]);
    const newBlueColor: [number,number,number,number] = [0.1,0.1,0.8,0.9];
    thickPlotter.updateLineColor(0, newBlueColor);
    let effectiveConfigThick = thickPlotter.getLineConfig(0);
    assert(effectiveConfigThick !== undefined, "[Thick] Effective config should exist after color update");
    assertEquals(JSON.stringify(effectiveConfigThick?.color), JSON.stringify(newBlueColor), "[Thick] Color should be updated");
    assertEquals(thickPlotter.getInternalPlotterType(), 'WebglLineThick', "[Thick] Internal plotter should be WebglLineThick");
  },

  // Test API delegation: updateLinePoints
  testUpdateLinePointsDelegation: function () {
    console.log("Running test: updateLinePoints delegation");
    const webglPlot = new WebglPlot(mockCanvas);
    const initialPoints = new Float32Array([0,0,0.1,0.1]);
    const newPoints = new Float32Array([0.5,0.5,0.6,0.6]);

    // Scenario 1: Thin line (WebglLinePlot internally)
    const thinLineConfig: LineConfig = { points: initialPoints, color: [0,1,0,1], thickness: 1.0 };
    const thinPlotter = webglPlot.newUnifiedLinePlotter(1);
    thinPlotter.initLines([thinLineConfig]);
    thinPlotter.updateLinePoints(0, newPoints); // Should delegate to WebglLinePlot
    const effectiveConfigThin = thinPlotter.getLineConfig(0);
    assert(effectiveConfigThin !== undefined, "[Thin] Effective config should exist after points update");
    // WebglLinePlot's getLineConfig returns the full LineConfig, including points.
    assertEquals(JSON.stringify(effectiveConfigThin?.points), JSON.stringify(newPoints), "[Thin] Points should be updated");
    assertEquals(thinPlotter.getInternalPlotterType(), 'WebglLinePlot', "[Thin] Internal plotter for points update should be WebglLinePlot");

    // Scenario 2: Thick line (WebglLineThick internally)
    // WebglLineThick doesn't have updateLinePoints, UnifiedLinePlot logs a warning.
    const thickLineConfig: LineConfig = { points: initialPoints, color: [0,1,1,1], thickness: 2.0 };
    const thickPlotter = webglPlot.newUnifiedLinePlotter(1);
    thickPlotter.initLines([thickLineConfig]);

    // Spy on console.warn for this specific test block if possible, otherwise manually verify warning.
    // For automated test here, we ensure it doesn't crash and try to check points if possible.
    // The current implementation of UnifiedLinePlot.updateLinePoints logs a warning for WebglLineThick.
    // The points will NOT be updated in WebglLineThick via this method.
    console.log("Expecting a warning for updateLinePoints on WebglLineThick instance next...");
    thickPlotter.updateLinePoints(0, newPoints);
    const effectiveConfigThick = thickPlotter.getLineConfig(0);
    assert(effectiveConfigThick !== undefined, "[Thick] Effective config should exist");
    // For WebglLineThick, getLineConfig returns Partial<LineConfig> without points.
    // So, we can't directly verify points update here via getLineConfig.
    // The main check is that the call didn't error and the type is correct.
    // And that the warning was logged (manual check or advanced test setup).
    assertEquals(thickPlotter.getInternalPlotterType(), 'WebglLineThick', "[Thick] Internal plotter for points update should be WebglLineThick");
    // To verify points *didn't* change for WebglLineThick via this path would require more complex state tracking
    // or for its getLineConfig to return points (which it doesn't, by design).
    // The critical part is that it delegates to the correct internal logic (which is a warning for thick lines).
  },

};

// Expose to window for calling from HTML
(window as any).runAllTests = function() {
  tests.testThicknessLessThanOne();
  tests.testThicknessEqualToOne();
  tests.testThicknessGreaterThanOne();
  tests.testThicknessUndefined();
  tests.testThicknessZero();
  tests.testUpdateLineColorDelegation();
  tests.testUpdateLinePointsDelegation();
  console.log("All tests completed.");
  const successDisplay = document.getElementById("successDisplay");
  if (successDisplay) {
      successDisplay.textContent = "All tests completed successfully!";
  }
};

document.addEventListener('DOMContentLoaded', () => {
    // To run tests automatically, uncomment the line below
    // (window as any).runAllTests();
});
