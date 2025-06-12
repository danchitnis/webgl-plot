"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var webglplot_1 = require("../dist/webglplot");
// Simple Assertion Function
function assert(condition, message) {
    if (!condition) {
        console.error("Assertion Failed:", message);
        var errorDisplay = document.getElementById("errorDisplay");
        if (errorDisplay) {
            var p = document.createElement("p");
            p.textContent = "Assertion Failed: ".concat(message);
            errorDisplay.appendChild(p);
        }
        throw new Error(message);
    }
    else {
        console.log("Assertion Passed:", message);
    }
}
function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        var msg = "".concat(message, " - Expected: ").concat(expected, ", Actual: ").concat(actual);
        console.error("Assertion Failed:", msg);
        var errorDisplay = document.getElementById("errorDisplay");
        if (errorDisplay) {
            var p = document.createElement("p");
            p.textContent = "Assertion Failed: ".concat(msg);
            errorDisplay.appendChild(p);
        }
        throw new Error(msg);
    }
    else {
        console.log("Assertion Passed:", message);
    }
}
// Mock canvas for WebglPlot initialization
var mockCanvas = document.createElement("canvas");
mockCanvas.width = 100;
mockCanvas.height = 100;
// Append to body if tests need actual rendering, otherwise not strictly necessary for these logic tests.
// document.body.appendChild(mockCanvas);
// Test Suite
console.log("Starting WebglPlot.createLinePlot() tests...");
var tests = {
    runAllTests: function () {
        this.testThicknessLessThanOne();
        this.testThicknessEqualToOne();
        this.testThicknessGreaterThanOne();
        this.testThicknessUndefined();
        this.testThicknessZero();
        console.log("All tests completed.");
        var successDisplay = document.getElementById("successDisplay");
        if (successDisplay) {
            successDisplay.textContent = "All tests completed successfully!";
        }
    },
    // Test Case 1: Thickness < 1.0
    testThicknessLessThanOne: function () {
        console.log("Running test: Thickness < 1.0");
        var webglPlot = new webglplot_1.WebglPlot(mockCanvas);
        var lineConfig = {
            points: new Float32Array([0, 0, 1, 1]),
            color: [1, 0, 0, 1], // Red
            thickness: 0.5,
        };
        var plotObject = webglPlot.createLinePlot(lineConfig);
        assert(plotObject instanceof webglplot_1.WebglLinePlot, "Should be WebglLinePlot for thickness 0.5");
        if (plotObject instanceof webglplot_1.WebglLinePlot) {
            var effectiveConfig = plotObject.getLineConfig(0);
            assert(effectiveConfig !== undefined, "Effective config should exist for WebglLinePlot");
            assertEquals(effectiveConfig === null || effectiveConfig === void 0 ? void 0 : effectiveConfig.thickness, 1.0, "Effective thickness should be 1.0 for input 0.5");
        }
    },
    // Test Case 2: Thickness = 1.0
    testThicknessEqualToOne: function () {
        console.log("Running test: Thickness = 1.0");
        var webglPlot = new webglplot_1.WebglPlot(mockCanvas);
        var lineConfig = {
            points: new Float32Array([0, 0, 1, 1]),
            color: [0, 1, 0, 1], // Green
            thickness: 1.0,
        };
        var plotObject = webglPlot.createLinePlot(lineConfig);
        assert(plotObject instanceof webglplot_1.WebglLinePlot, "Should be WebglLinePlot for thickness 1.0");
        if (plotObject instanceof webglplot_1.WebglLinePlot) {
            var effectiveConfig = plotObject.getLineConfig(0);
            assert(effectiveConfig !== undefined, "Effective config should exist for WebglLinePlot");
            assertEquals(effectiveConfig === null || effectiveConfig === void 0 ? void 0 : effectiveConfig.thickness, 1.0, "Effective thickness should be 1.0 for input 1.0");
        }
    },
    // Test Case 3: Thickness > 1.0
    testThicknessGreaterThanOne: function () {
        console.log("Running test: Thickness > 1.0");
        var webglPlot = new webglplot_1.WebglPlot(mockCanvas);
        var lineConfig = {
            points: new Float32Array([0, 0, 1, 1]),
            color: [0, 0, 1, 1], // Blue
            thickness: 1.5,
        };
        var plotObject = webglPlot.createLinePlot(lineConfig);
        assert(plotObject instanceof webglplot_1.WebglLineThick, "Should be WebglLineThick for thickness 1.5");
        if (plotObject instanceof webglplot_1.WebglLineThick) {
            // WebglLineThick.initLines is called by createLinePlot.
            // We need to wait for a potential async operation or ensure data is ready for getLineConfig in WebglLineThick.
            // However, current WebglLineThick.initLines and getLineConfig are synchronous.
            var effectiveConfig = plotObject.getLineConfig(0);
            assert(effectiveConfig !== undefined, "Effective config should exist for WebglLineThick");
            assertEquals(effectiveConfig === null || effectiveConfig === void 0 ? void 0 : effectiveConfig.thickness, 1.5, "Effective thickness should be 1.5 for input 1.5");
        }
    },
    // Test Case 4: Thickness undefined
    testThicknessUndefined: function () {
        console.log("Running test: Thickness undefined");
        var webglPlot = new webglplot_1.WebglPlot(mockCanvas);
        var lineConfig = {
            points: new Float32Array([0, 0, 1, 1]),
            color: [1, 1, 0, 1], // Yellow
            // thickness is undefined
        };
        var plotObject = webglPlot.createLinePlot(lineConfig);
        assert(plotObject instanceof webglplot_1.WebglLinePlot, "Should be WebglLinePlot for undefined thickness");
        if (plotObject instanceof webglplot_1.WebglLinePlot) {
            var effectiveConfig = plotObject.getLineConfig(0);
            assert(effectiveConfig !== undefined, "Effective config should exist for WebglLinePlot");
            assertEquals(effectiveConfig === null || effectiveConfig === void 0 ? void 0 : effectiveConfig.thickness, 1.0, "Effective thickness should be 1.0 for undefined input");
        }
    },
    // Test Case 5: Thickness = 0
    testThicknessZero: function () {
        console.log("Running test: Thickness = 0");
        var webglPlot = new webglplot_1.WebglPlot(mockCanvas);
        var lineConfig = {
            points: new Float32Array([0, 0, 1, 1]),
            color: [1, 0, 1, 1], // Magenta
            thickness: 0,
        };
        var plotObject = webglPlot.createLinePlot(lineConfig);
        assert(plotObject instanceof webglplot_1.WebglLinePlot, "Should be WebglLinePlot for thickness 0");
        if (plotObject instanceof webglplot_1.WebglLinePlot) {
            var effectiveConfig = plotObject.getLineConfig(0);
            assert(effectiveConfig !== undefined, "Effective config should exist for WebglLinePlot");
            assertEquals(effectiveConfig === null || effectiveConfig === void 0 ? void 0 : effectiveConfig.thickness, 1.0, "Effective thickness should be 1.0 for input 0");
        }
    },
};
// Expose to window for calling from HTML
window.runAllTests = tests.runAllTests.bind(tests);
document.addEventListener('DOMContentLoaded', function () {
    // Optionally run tests automatically, or provide a button in HTML to trigger them.
    // For simplicity here, we can call it directly or let the HTML call it.
    // tests.runAllTests();
});
