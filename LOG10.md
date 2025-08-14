# Logarithmic Axes (Log₁₀) Guide

The webgl-plot library provides GPU-accelerated logarithmic scaling for both X and Y axes, enabling high-performance visualization of exponential, power-law, and wide-range scientific data.

## 🚀 Quick Start

```typescript
import { setupCanvasAndWebGL, UnifiedLinePlot, clearCanvas } from "webgl-plot";

// Setup canvas and WebGL context
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = setupCanvasAndWebGL(canvas, {
  backgroundColor: [0, 0, 0, 1],
});

// Create unified line plotter
const plotter = new UnifiedLinePlot(gl, 1);
plotter.initLines([
  {
    points: yourData, // Float32Array of [x1,y1,x2,y2,...]
    color: [1, 0, 0, 1],
    thickness: 2,
    enabled: true,
  },
]);

// Enable logarithmic Y-axis
plotter.setLogAxis(false, true);

// Proper scaling for log axes
const bounds = plotter.autoScaleEnabledLines();
if (bounds && bounds !== undefined) {
  plotter.autoScaleToLogSpace(bounds);
}

// Render loop
function animate() {
  clearCanvas(gl);
  plotter.draw();
  requestAnimationFrame(animate);
}
animate();
```

## 📚 Core API

### `setLogAxis(x: boolean, y: boolean)`

Enable or disable logarithmic base-10 scaling for each axis on individual plotters.

```typescript
// Set log axes on plotter instances
plotter.setLogAxis(false, true); // Enable log Y only
plotter.setLogAxis(true, true); // Enable both axes
plotter.setLogAxis(false, false); // Disable log scaling
```

**Key Features:**

- ✅ **GPU-accelerated**: Transformation happens on GPU for real-time performance
- ✅ **No reinitialization**: Changes apply immediately without data reprocessing
- ✅ **Smart filtering**: Negative/zero values automatically moved off-screen
- ✅ **Zoom-independent**: Works correctly at any zoom level

### `autoScaleToLogSpace()`

Properly scales the view for logarithmic axes by transforming data bounds to log space.

**Correct usage pattern for log axes:**

```typescript
plotter.setLogAxis(false, true); // Enable log Y axis

// Step 1: Get data bounds in linear space
const bounds = plotter.autoScaleEnabledLines();

// Step 2: Transform and apply scaling for log space
if (bounds && bounds !== undefined) {
  const success = plotter.autoScaleToLogSpace(bounds);
  if (!success) {
    console.log("Log space transformation failed");
  }
}
```

**Alternative using getDataBounds():**

```typescript
plotter.setLogAxis(false, true);
const bounds = plotter.getDataBounds();
const success = plotter.autoScaleToLogSpace(bounds);
```

### Smart Auto-Scaling for Log Axes

When log axes are enabled, use the two-step pattern for proper scaling:

```typescript
// Smart filtering: Lines with insufficient positive data are excluded from bounds calculation
const plotter = new UnifiedLinePlot(gl, 3);
plotter.initLines([
  { points: exponentialData, color: [1, 0, 0, 1], enabled: true }, // 100% positive → included
  { points: sineWaveData, color: [0, 1, 0, 1], enabled: true }, // ~50% positive → may be skipped
  { points: negativeData, color: [0, 0, 1, 1], enabled: true }, // 0% positive → skipped
]);

plotter.setLogAxis(false, true); // Enable log Y axis

// Step 1: Calculate bounds (automatically excludes problematic lines)
const bounds = plotter.autoScaleEnabledLines();

// Step 2: Apply log space transformation
if (bounds && bounds !== undefined) {
  plotter.autoScaleToLogSpace(bounds);
}

// Console output will show: "Skipping line 1 - only 45/100 (45.0%) points valid for log axes"
```

**Smart Filtering Rules:**

- ✅ **Included**: Lines with ≥10% positive values AND ≥2 valid points
- ⚠️ **Excluded**: Lines with <10% positive values OR <2 valid points
- 🔍 **Visibility**: Excluded lines may still render (positive portions visible), but don't affect scaling

## 🔍 Troubleshooting

### Common Issues

**Lines disappear when enabling log axes:**

```typescript
// Problem: Data contains negative or zero values
// Solution: Log transformation automatically filters these out
// Check: Ensure your data has positive values for log-scaled axes

// Debug: Check data range
function analyzeData(data: Float32Array) {
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  let negativeCount = 0;

  for (let i = 0; i < data.length; i += 2) {
    const x = data[i],
      y = data[i + 1];
    if (x <= 0 || y <= 0) negativeCount++;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  console.log(`Data range: X[${minX}, ${maxX}], Y[${minY}, ${maxY}]`);
  console.log(`Points with negative/zero values: ${negativeCount}`);
}
```

**Scaling looks wrong after toggling:**

```typescript
// Problem: Auto-scaling calculated in wrong space
// Solution: Always re-auto-scale after changing log axis settings
plotter.setLogAxis(false, true);

// Proper scaling for log axes
const bounds = plotter.autoScaleEnabledLines();
if (bounds && bounds !== undefined) {
  plotter.autoScaleToLogSpace(bounds);
}
```

**Auto-scaling ignores some lines with log axes:**

```typescript
// This is EXPECTED behavior: Smart auto-scaling for log axes
// Lines with mostly negative/zero values are automatically excluded from
// auto-scaling bounds calculation when log axes are enabled

// Example: Mixed data scenario
const plotter = new UnifiedLinePlot(gl, 3);
plotter.initLines([
  { points: positiveData, color: [1, 0, 0, 1], enabled: true }, // ✅ Used for log auto-scaling
  { points: mixedData, color: [0, 1, 0, 1], enabled: true }, // ⚠️ Skipped if <10% positive values
  { points: negativeData, color: [0, 0, 1, 1], enabled: true }, // ⚠️ Skipped for log Y auto-scaling
]);

plotter.setLogAxis(false, true); // Enable log Y

// Proper scaling for log axes
const bounds = plotter.autoScaleEnabledLines(); // Only considers lines with sufficient positive data
if (bounds && bounds !== undefined) {
  plotter.autoScaleToLogSpace(bounds);
}

// Check console output for "Skipping line X" messages to see which lines were excluded
```

**Mixed positive/negative data with log axes:**

```typescript
// For data that oscillates between positive and negative (e.g., sine waves):
// - Positive portions will be visible on log scale
// - Negative portions will be filtered out (moved off-screen)
// - Auto-scaling will exclude the line if <10% of points are positive

// To force inclusion of mixed data in auto-scaling:
// 1. Pre-filter your data to remove negative values, OR
// 2. Use separate plotters for positive and negative data, OR
// 3. Use linear axes for mixed data visualization

function preprocessForLogY(data: Float32Array): Float32Array {
  const filtered: number[] = [];
  for (let i = 0; i < data.length; i += 2) {
    const x = data[i];
    const y = data[i + 1];
    if (y > 0) {
      // Keep only positive Y values for log Y axis
      filtered.push(x, y);
    }
  }
  return new Float32Array(filtered);
}
```

## 🔗 See Also

- **Interactive demo**: `/benchmark/bench-log-axis.html`
- **API reference**: Check JSDoc comments in source files
- **Test the smart filtering**: Open browser console when running benchmarks to see auto-scaling decisions

## How Log Scaling Works

The logarithmic scaling in webgl-plot uses GPU-accelerated transformations:

1. **GPU Transform**: `log10(value)` computed in vertex shaders for real-time performance
2. **Smart Filtering**: Negative/zero values automatically moved off-screen (log(x ≤ 0) undefined)
3. **Auto-scaling Intelligence**: Lines with <10% positive values excluded from bounds calculation
4. **Zoom Independence**: Scaling works correctly at any zoom level

The log transformation preserves data relationships while compressing wide dynamic ranges, making it ideal for exponential data, power laws, and scientific measurements spanning multiple orders of magnitude.
