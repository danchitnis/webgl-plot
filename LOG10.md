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
const bounds = plotter.getAllDataBounds(); // Smart filtering for log compatibility with coordinate space info
if (bounds) {
  // Enhanced API: automatically handles coordinate space conversion
  plotter.transformToLogSpace(bounds);
}

// Render loop
function animate() {
  // When data changes during animation, preserve current zoom/pan with getDataBounds():
  // const bounds = plotter.getDataBounds();
  // if (bounds) plotter.transformToLogSpace(bounds);
  //
  // Or to auto-scale to fit all data when data changes:
  // const bounds = plotter.getAllDataBounds();
  // if (bounds) plotter.transformToLogSpace(bounds);

  clearCanvas(gl);
  plotter.draw();
  requestAnimationFrame(animate);
}
animate();
```

## 📚 Core API

### Enhanced Coordinate-Space Aware API (v2)

All bounds methods now include coordinate space information, eliminating ambiguity:

```typescript
const bounds = plotter.getDataBounds();
// Returns: { minX, maxX, minY, maxY, coordinateSpace: { x: "linear"|"log", y: "linear"|"log" } }

if (bounds) {
  console.log(
    `X axis in ${bounds.coordinateSpace.x} space, Y axis in ${bounds.coordinateSpace.y} space`
  );
  // transformToLogSpace automatically handles coordinate conversion based on coordinateSpace info
  plotter.transformToLogSpace(bounds); // Always works correctly!
}
```

**Benefits:**

- ✅ **No more guesswork**: Always know what coordinate space bounds are in
- ✅ **Automatic conversion**: `transformToLogSpace()` handles coordinate space conversion
- ✅ **Works in any mode**: Linear, log, or mixed coordinate spaces
- ✅ **Eliminates bugs**: No more manual coordinate space tracking

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

### Transform Methods: Symmetric API

The library now provides symmetric transform methods for both coordinate spaces:

#### `transformToLogSpace(dataBounds?: DataBounds | null)`

Transform data bounds to logarithmic space and apply appropriate scaling.

```typescript
// Enable log axes and transform
plotter.setLogAxis(false, true); // Enable log Y
const bounds = plotter.getDataBounds(); // Gets bounds with coordinate space info
const success = plotter.transformToLogSpace(bounds); // Preserves current view
```

#### `transformToLinearSpace(dataBounds?: DataBounds | null)`

Transform data bounds to linear space and apply appropriate scaling.

```typescript
// Switch to linear axes while preserving view
const bounds = plotter.getDataBounds(); // Gets bounds with coordinate space info
plotter.setLogAxis(false, false); // Switch to linear axes
const success = plotter.transformToLinearSpace(bounds); // Preserves current view
```

**Key Benefits of Symmetric API:**

- ✅ **View preservation**: Both methods preserve zoom/pan when switching coordinate spaces
- ✅ **Automatic conversion**: Handles coordinate space conversion seamlessly
- ✅ **Consistent interface**: Same usage pattern for both log and linear transforms
- ✅ **Error handling**: Both return boolean success indicators
- ✅ **Bulk operations**: Both plotters support bulk line updates for performance

### Bulk Operations API

For performance optimization when updating many lines at once:

```typescript
// Enable/disable multiple lines at once
plotter.setMultipleLinesEnabled([0, 1, 2], false); // Disable lines 0, 1, 2

// Update transform for multiple lines
plotter.updateMultipleLinesTransform(
  [0, 2, 4], // Line IDs
  [2.0, 1.5], // Scale factors
  [0.1, -0.2] // Offsets
);
```

### Scaling Methods: Enhanced and Simplified

Both methods include coordinate space information, making usage much clearer:

#### 1. Autoscaling to Fit All Data

Use `getAllDataBounds()` → `transformToLogSpace()` when:

- First enabling log axes
- Want to fit all data in view
- Switching between linear/log modes
- Initial setup

```typescript
// Initial setup or autoscaling to fit all data
plotter.setLogAxis(false, true);
const bounds = plotter.getAllDataBounds(); // Gets bounds of ALL data with coordinate space info
if (bounds) {
  // automatically handles any coordinate space conversion needed
  plotter.transformToLogSpace(bounds);
}
```

#### 2. Preserving Current View (Zoom/Pan State)

Use `getDataBounds()` → `transformToLogSpace()` when:

- Data changes during runtime but want to keep current zoom/pan
- Already viewing a specific region and want to maintain it
- Zoom/pan operations in any coordinate space

```typescript
// When data changes but you want to preserve current zoom/pan state
const bounds = plotter.getDataBounds(); // Gets current viewport bounds with coordinate space info
if (bounds) {
  // Enhanced API: works seamlessly regardless of current coordinate space
  plotter.transformToLogSpace(bounds); // Maintains current view, handles conversion automatically
}
```

#### 3. View Preservation When Switching Coordinate Spaces

```typescript
// Switching coordinate spaces while preserving view
const currentBounds = plotter.getDataBounds(); // Gets bounds with coordinate space info
// No manual conversion needed! The bounds include coordinate space information

plotter.setLogAxis(true, false); // Switch to log X axis
if (currentBounds) {
  // Enhanced transformToLogSpace automatically handles the coordinate conversion
  plotter.transformToLogSpace(currentBounds); // View preserved automatically!
}

// Switching back to linear - NOW WITH SYMMETRIC API!
plotter.setLogAxis(false, false); // Switch to linear axes
if (currentBounds) {
  // Use the new transformToLinearSpace method to preserve view
  plotter.transformToLinearSpace(currentBounds); // View preserved automatically!
  // OR use autoScale() if you want to fit all data instead of preserving view
  // plotter.autoScale(); // Auto-scale to fit all data in current coordinate space
}
```

**Why this distinction matters:**

- `getAllDataBounds()` returns complete data extent → autoscales to fit all data
- `getDataBounds()` returns current viewport bounds → preserves zoom/pan state
- Choose based on whether you want to autoscale or maintain current view

### Smart Auto-Scaling for Log Axes

When using `getAllDataBounds()` with log axes, lines are automatically filtered:

```typescript
const plotter = new UnifiedLinePlot(gl, 3);
plotter.initLines([
  { points: exponentialData, color: [1, 0, 0, 1], enabled: true }, // 100% positive → included
  { points: sineWaveData, color: [0, 1, 0, 1], enabled: true }, // ~50% positive → may be excluded
  { points: negativeData, color: [0, 0, 1, 1], enabled: true }, // 0% positive → excluded
]);

plotter.setLogAxis(false, true);
const bounds = plotter.getAllDataBounds(); // Excludes problematic lines
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

### Visual jumps when rescaling

**Problem**: Using wrong scaling method for current coordinate space  
**Solution**: Follow the two-pattern approach

```typescript
// ❌ WRONG: Uses autoscaling when you want to preserve zoom/pan
// const bounds = plotter.getAllDataBounds(); // This will autoscale to fit all data!
// plotter.transformToLogSpace(bounds);

// ✅ CORRECT: For initial setup or autoscaling
plotter.setLogAxis(false, true);
const initialBounds = plotter.getAllDataBounds(); // Gets all data bounds
if (initialBounds && initialBounds !== undefined) {
  plotter.transformToLogSpace(initialBounds);
}

// ✅ CORRECT: For preserving current zoom/pan when data updates
const updateBounds = plotter.getDataBounds(); // Gets current viewport bounds
if (updateBounds) {
  plotter.transformToLogSpace(updateBounds); // Maintains current view
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

| Scenario                                          | Enhanced Method (v2)                                                      | Reason                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Initial setup (autoscale to fit all data)         | `getAllDataBounds()` → `transformToLogSpace()`                            | Smart filtering for log compatibility with coordinate space info |
| Switching to log axes (autoscale)                 | `getAllDataBounds()` → `transformToLogSpace()`                            | Enhanced API handles coordinate conversion automatically         |
| Switching to linear axes (autoscale)              | `setLogAxis()` → `getAllDataBounds()` → `transformToLinearSpace()`        | Symmetric API for linear coordinate space                        |
| **Switching to log with view preservation** ✨    | `getDataBounds()` → `transformToLogSpace()`                               | **Enhanced API maintains zoom/pan automatically**                |
| **Switching to linear with view preservation** ✨ | `getDataBounds()` → `transformToLinearSpace()`                            | **Symmetric API maintains zoom/pan automatically**               |
| Data updates (preserve zoom/pan in log)           | `getDataBounds()` → `transformToLogSpace()`                               | Preserves current viewport with automatic coordinate handling    |
| Data updates (preserve zoom/pan in linear)        | `getDataBounds()` → `transformToLinearSpace()`                            | Preserves current viewport with automatic coordinate handling    |
| Data updates (autoscale in current space)         | `autoScale()`                                                             | Auto-scales within current coordinate space without changing it  |
| Zoom/pan operations (any coordinate space)        | `getDataBounds()` → `transformToLogSpace()` OR `transformToLinearSpace()` | **Works in any coordinate mode!**                                |

**✨ Enhanced Benefits:**

- ✅ **Symmetric API**: `transformToLogSpace()` and `transformToLinearSpace()` work identically
- ✅ **View preservation**: Both transform methods preserve zoom/pan when switching coordinate spaces
- ✅ **No more manual coordinate space tracking**: Automatic coordinate space handling
- ✅ **Coordinate space information always included**: Bounds include coordinate space metadata
- ✅ **Eliminates common bugs**: Consistent interface prevents coordinate space confusion
- ✅ **Clear separation**: `autoScale()` for same-space scaling, `transform*()` methods for coordinate changes

## 🔗 See Also

- **Interactive demo**: `/benchmark/bench-log-axis.html`
- **Coordinate space demo**: `/benchmark/bench-coordinate-space.html` - Shows view preservation when toggling between coordinate spaces
- **API reference**: Check JSDoc comments in source files
- **Test smart filtering**: Open browser console when running benchmarks
- **Coordinate transformation utilities**: `transformBoundsToLogSpace()` and `transformBoundsToLinearSpace()`

## How Log Scaling Works

The logarithmic scaling uses GPU-accelerated transformations:

1. **GPU Transform**: `log10(value)` computed in vertex shaders for real-time performance
2. **Smart Filtering**: Negative/zero values automatically moved off-screen (log(x ≤ 0) undefined)
3. **Auto-scaling Intelligence**: Lines with <10% positive values excluded from bounds calculation
4. **Zoom Independence**: Scaling works correctly at any zoom level

The log transformation preserves data relationships while compressing wide dynamic ranges, making it ideal for exponential data, power laws, and scientific measurements spanning multiple orders of magnitude.
