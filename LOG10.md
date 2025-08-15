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

// Enable logarithmic Y-axis and scale appropriately
plotter.setLogAxis(false, true);
const bounds = plotter.autoScale(); // Smart filtering for log compatibility
if (bounds && bounds !== undefined) {
  plotter.transformToLogSpace(bounds);
}

// Render loop
function animate() {
  // When data changes during animation, use getDataBounds() instead:
  // const bounds = plotter.getDataBounds();
  // if (bounds) plotter.transformToLogSpace(bounds);
  
  clearCanvas(gl);
  plotter.draw();
  requestAnimationFrame(animate);
}
animate();
```

## 📚 Core API

### `setLogAxis(x: boolean, y: boolean)`

Enable or disable logarithmic base-10 scaling for each axis.

```typescript
plotter.setLogAxis(false, true); // Enable log Y only
plotter.setLogAxis(true, true); // Enable both axes
plotter.setLogAxis(false, false); // Disable log scaling
```

**Key Features:**
- ✅ **GPU-accelerated**: Transformation happens on GPU for real-time performance
- ✅ **No reinitialization**: Changes apply immediately without data reprocessing
- ✅ **Smart filtering**: Negative/zero values automatically moved off-screen
- ✅ **Zoom-independent**: Works correctly at any zoom level

### Scaling Methods: Two Different Use Cases

**CRITICAL**: The choice between `autoScale()` and `getDataBounds()` depends on your current coordinate space:

#### 1. Initial Setup or Axis Mode Changes
Use `autoScale()` → `transformToLogSpace()` when:
- First enabling log axes
- Switching between linear/log modes
- Initializing the plotter

```typescript
// Initial setup
plotter.setLogAxis(false, true);
const bounds = plotter.autoScale(); // Smart filtering for log compatibility
if (bounds && bounds !== undefined) {
  plotter.transformToLogSpace(bounds);
}
```

#### 2. Data Updates When Already in Log Space
Use `getDataBounds()` → `transformToLogSpace()` when:
- Data changes during runtime
- Already in log space and want to rescale

```typescript
// When data changes and you're already in log space
const bounds = plotter.getDataBounds(); // Gets bounds without state changes
if (bounds) {
  plotter.transformToLogSpace(bounds);
}
```

#### 3. Switching from Log Space Back to Linear Space
Use `setLogAxis()` → `autoScale()` when:
- Switching from log axes back to linear axes
- Want to rescale to linear space with proper bounds

```typescript
// When switching from log back to linear space
plotter.setLogAxis(false, false); // Disable log axes (back to linear)
const bounds = plotter.autoScale(); // Calculates bounds and applies linear scaling
// No need to call transformToLogSpace() since we're now in linear mode
```

**Why this distinction matters:**
- `autoScale()` resets to linear coordinate space before calculating bounds
- Using it when already in log space causes: log → linear → log transitions with visual jumps
- `getDataBounds()` preserves current coordinate space while getting bounds

### Smart Auto-Scaling for Log Axes

When using `autoScale()` with log axes, lines are automatically filtered:

```typescript
const plotter = new UnifiedLinePlot(gl, 3);
plotter.initLines([
  { points: exponentialData, color: [1, 0, 0, 1], enabled: true }, // 100% positive → included
  { points: sineWaveData, color: [0, 1, 0, 1], enabled: true }, // ~50% positive → may be excluded
  { points: negativeData, color: [0, 0, 1, 1], enabled: true }, // 0% positive → excluded
]);

plotter.setLogAxis(false, true);
const bounds = plotter.autoScale(); // Excludes problematic lines
if (bounds && bounds !== undefined) {
  plotter.transformToLogSpace(bounds);
}
// Console may show: "Skipping line 1 - only 45/100 (45.0%) points valid for log axes"
```

**Smart Filtering Rules:**
- ✅ **Included**: Lines with ≥10% positive values AND ≥2 valid points
- ⚠️ **Excluded**: Lines with <10% positive values OR <2 valid points
- 🔍 **Visibility**: Excluded lines may still render (positive portions visible), but don't affect scaling

## 🔍 Troubleshooting

### Lines disappear when enabling log axes

**Problem**: Data contains negative or zero values  
**Solution**: Log transformation automatically filters these out

```typescript
// Debug data range
function analyzeData(data: Float32Array) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let negativeCount = 0;

  for (let i = 0; i < data.length; i += 2) {
    const x = data[i], y = data[i + 1];
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

### Visual jumps when rescaling

**Problem**: Using wrong scaling method for current coordinate space  
**Solution**: Follow the two-pattern approach

```typescript
// ❌ WRONG: Causes visual jumps when already in log space
// const bounds = plotter.autoScale(); // Resets to linear first!
// plotter.transformToLogSpace(bounds);

// ✅ CORRECT: For initial setup
plotter.setLogAxis(false, true);
const initialBounds = plotter.autoScale();
if (initialBounds && initialBounds !== undefined) {
  plotter.transformToLogSpace(initialBounds);
}

// ✅ CORRECT: For data updates when already in log space
const updateBounds = plotter.getDataBounds();
if (updateBounds) {
  plotter.transformToLogSpace(updateBounds);
}
```

### Auto-scaling excludes some lines

**This is expected behavior** when log axes are enabled. Lines with mostly negative/zero values are automatically excluded from bounds calculation.

To include mixed data:
1. Pre-filter your data to remove negative values, OR
2. Use separate plotters for positive and negative data, OR  
3. Use linear axes for mixed data visualization

```typescript
function preprocessForLogY(data: Float32Array): Float32Array {
  const filtered: number[] = [];
  for (let i = 0; i < data.length; i += 2) {
    const x = data[i];
    const y = data[i + 1];
    if (y > 0) {
      filtered.push(x, y);
    }
  }
  return new Float32Array(filtered);
}
```

## Usage Summary

| Scenario | Method | Reason |
|----------|--------|--------|
| Initial setup | `autoScale()` | Smart filtering for log compatibility |
| Switching to log axes | `autoScale()` → `transformToLogSpace()` | Applies log transformation |
| Switching to linear axes | `setLogAxis()` → `autoScale()` | Resets to linear scaling |
| Data updates in log space | `getDataBounds()` → `transformToLogSpace()` | Preserves current coordinate space |
| Data updates in linear space | `autoScale()` | Standard linear autoscaling |

## 🔗 See Also

- **Interactive demo**: `/benchmark/bench-log-axis.html`
- **API reference**: Check JSDoc comments in source files
- **Test smart filtering**: Open browser console when running benchmarks

## How Log Scaling Works

The logarithmic scaling uses GPU-accelerated transformations:

1. **GPU Transform**: `log10(value)` computed in vertex shaders for real-time performance
2. **Smart Filtering**: Negative/zero values automatically moved off-screen (log(x ≤ 0) undefined)
3. **Auto-scaling Intelligence**: Lines with <10% positive values excluded from bounds calculation
4. **Zoom Independence**: Scaling works correctly at any zoom level

The log transformation preserves data relationships while compressing wide dynamic ranges, making it ideal for exponential data, power laws, and scientific measurements spanning multiple orders of magnitude.