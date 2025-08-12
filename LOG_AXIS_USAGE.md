# Logarithmic Axis Usage Guide

The webgl-plot library now supports GPU-accelerated logarithmic scaling for both X and Y axes. This feature enables real-time visualization of exponential, power-law, and wide-range data with optimal performance.

## Quick Start

```typescript
import { WebglPlot } from 'webgl-plot';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const plot = new WebglPlot(canvas);

// Create a line plotter
const plotter = plot.newUnifiedLinePlotter(1);

// Initialize with exponential data
const exponentialData = generateExponentialData(); // Your data generation function
plotter.initLines([{
  points: exponentialData,
  color: [1, 0, 0, 1], // Red
  thickness: 2,
  enabled: true
}]);

// Enable logarithmic Y-axis for exponential data
plot.setLogAxis(false, true); // Linear X, Log Y

// Auto-scale to fit the data in log space
plot.autoScaleToLogSpace();

// Render loop
function render() {
  plot.update(); // Clear canvas
  plotter.draw(); // Draw lines
  requestAnimationFrame(render);
}
render();
```

## Core Functions

### `setLogAxis(x: boolean, y: boolean)`

Enable or disable logarithmic scaling for axes.

```typescript
// Enable log Y-axis for exponential data
plot.setLogAxis(false, true);

// Enable both axes for power-law data spanning many decades
plot.setLogAxis(true, true);

// Disable all log scaling (return to linear)
plot.setLogAxis(false, false);
```

**Key Features:**
- ✅ **GPU-accelerated**: Log transformation happens on GPU for maximum performance
- ✅ **Real-time**: No graph reinitialization required - changes apply immediately
- ✅ **Smart filtering**: Negative and zero values automatically filtered out
- ✅ **Zoom-independent**: Works correctly at any zoom level

### `autoScaleToLogSpace()`

Intelligently auto-scale while preserving the current view when switching to log space.

```typescript
// User has zoomed into a specific region in linear space
// Now enable log scaling while maintaining the current view
plot.setLogAxis(false, true);
const success = plot.autoScaleToLogSpace(); // Maintains zoom but in log space

if (success) {
  console.log("Successfully preserved current view in log space");
} else {
  console.log("Fell back to regular auto-scaling");
}
```

**Use Cases:**
- After toggling log axes to maintain current view
- For smooth transitions between linear and log representations  
- When you want to preserve user's current zoom/pan state

## Line Plotter Options

### Thin Lines (High Performance)
```typescript
const thinPlotter = plot.newThinLinePlotter(maxLines);
// - Thickness fixed at 1.0 pixel
// - Highest performance for real-time data
// - Ideal for high-density visualizations
```

### Thick Lines (Full Featured)
```typescript
const thickPlotter = plot.newThickLinePlotter(maxLines);
// - Variable thickness with proper joins
// - More computationally expensive (~6x slower)
// - Professional-quality line rendering
```

### Unified Lines (Smart Selection)
```typescript
const unifiedPlotter = plot.newUnifiedLinePlotter(maxLines);
// - Automatically chooses thin/thick based on line thickness
// - Best of both worlds - performance when possible, quality when needed
// - Recommended for most applications
```

## Data Types and Use Cases

### Exponential Data
```typescript
// Data: y = a * e^(b*x)
const exponentialData = generateExponentialData();
plot.setLogAxis(false, true); // Linear X, Log Y
plotter.initLines([{ points: exponentialData, color: [1,0,0,1], thickness: 2 }]);
```

### Power Law Data  
```typescript
// Data: y = a * x^b
const powerLawData = generatePowerLawData();
plot.setLogAxis(true, true); // Log X, Log Y (will appear linear on log-log plot)
plotter.initLines([{ points: powerLawData, color: [0,1,0,1], thickness: 2 }]);
```

### Wide Range Data
```typescript
// Data spanning many orders of magnitude
const wideRangeData = generateWideRangeData(); // e.g., 0.001 to 100000
plot.setLogAxis(true, false); // Log X, Linear Y
plotter.initLines([{ points: wideRangeData, color: [0,0,1,1], thickness: 2 }]);
```

## Performance Considerations

### GPU vs CPU Comparison
- **GPU Log Transformation**: ✅ Real-time performance, no data reprocessing
- **CPU Log Transformation**: ❌ Requires data copying and reinitialization

### Benchmark Results (1000 points)
```
Thin Lines:  Linear 2.1ms  →  Log 2.3ms  (9% overhead)
Thick Lines: Linear 12.4ms →  Log 12.8ms (3% overhead)
Unified:     Linear 2.1ms  →  Log 2.3ms  (9% overhead, auto-selected thin)
```

## Advanced Features

### Real-time Log Toggle
```typescript
// Toggle log axes without performance penalty
document.getElementById('toggleLogY').addEventListener('click', () => {
  const currentLogY = plot.logY;
  plot.setLogAxis(plot.logX, !currentLogY);
  plot.autoScaleToLogSpace(); // Maintain current view
});
```

### Custom Auto-scaling
```typescript
// Manual bounds calculation accounting for log transformation
const plotter = plot.newUnifiedLinePlotter(1);
plotter.initLines([{ points: myData, color: [1,0,0,1], thickness: 2 }]);

// This automatically accounts for current log axis settings
plotter.autoScaleEnabledLines();
```

## Troubleshooting

### Common Issues

**Lines disappear when enabling log axes:**
- **Cause**: Data contains negative or zero values
- **Solution**: Log transformation filters out non-positive values automatically
- **Check**: Ensure your data has positive values for the log-scaled axes

**Scaling looks wrong after toggling log axes:**
- **Cause**: Auto-scaling was calculated in linear space
- **Solution**: Call `plot.autoScaleToLogSpace()` after enabling log axes

**Performance is slower than expected:**
- **Cause**: Using thick lines when thin lines would suffice
- **Solution**: Use `newThinLinePlotter()` for thickness ≤ 1.0 pixel

### Debug Mode
```typescript
const plot = new WebglPlot(canvas, { debug: true });
// Enables console logging for log transformations and scaling operations
```

## Complete Example

See `/benchmark/bench-log-axis.html` for a complete interactive demonstration with:
- Multiple data types (exponential, power law, mixed scale)
- Real-time log axis toggling
- Performance measurement tools
- Comparison between thin, thick, and unified line plotters