# Logarithmic Axes (Log₁₀) Guide

The webgl-plot library provides GPU-accelerated logarithmic scaling for both X and Y axes, enabling high-performance visualization of exponential, power-law, and wide-range scientific data.

## 🚀 Quick Start

### Using Factory Methods (Recommended)
```typescript
import { WebglPlot } from 'webgl-plot';

// Basic setup
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const plot = new WebglPlot(canvas);

// Create line plotter and add data
const plotter = plot.newUnifiedLinePlotter(1);
plotter.initLines([{
  points: yourData, // Float32Array of [x1,y1,x2,y2,...]
  color: [1, 0, 0, 1],
  thickness: 2,
  enabled: true
}]);

// Enable logarithmic Y-axis (v1.2.0+: can set directly on plotter)
plotter.setLogAxis(false, true);

// Auto-scale to fit data (with smart filtering for log axes)
plotter.autoScaleEnabledLines();

// Render
function animate() {
  plot.update();
  plotter.draw();
  requestAnimationFrame(animate);
}
animate();
```

### Using Direct Class Instantiation
```typescript
import { WebglPlot, WebglLinePlot, WebglLineThick, UnifiedLinePlot } from 'webgl-plot';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const plot = new WebglPlot(canvas);

// Option 1: Direct thin line plotter
const thinPlotter = new WebglLinePlot(plot, 1);

// Option 2: Direct thick line plotter  
const thickPlotter = new WebglLineThick(plot, 1);

// Option 3: Direct unified plotter
const unifiedPlotter = new UnifiedLinePlot(plot, 1);

// All plotters now have local log axis support and identical APIs
thinPlotter.initLines([{ points: yourData, color: [1,0,0,1], thickness: 1.0, enabled: true }]);
thinPlotter.setLogAxis(false, true); // Can set log axes directly on plotter
thinPlotter.autoScaleEnabledLines(); // Smart filtering applies to all plotters

// Or use the global plot settings (still supported)
plot.setLogAxis(false, true);
thinPlotter.autoScaleEnabledLines();
```

## 📚 Core API

### `setLogAxis(x: boolean, y: boolean)`

Enable or disable logarithmic base-10 scaling for each axis. Available on both WebglPlot and individual plotters.

```typescript
// Option 1: Set on WebglPlot (affects all plotters)
plot.setLogAxis(false, true);

// Option 2: Set directly on individual plotters (v1.2.0+)
thinPlotter.setLogAxis(false, true);  // Enable log Y for thin plotter
thickPlotter.setLogAxis(true, true);  // Enable both axes for thick plotter
unifiedPlotter.setLogAxis(false, false); // Disable for unified plotter

// Mixed usage: different plotters can have different log settings
thinPlotter.setLogAxis(false, true);   // Log Y only
thickPlotter.setLogAxis(true, false);  // Log X only
```

**Key Features:**
- ✅ **GPU-accelerated**: Transformation happens on GPU for real-time performance
- ✅ **No reinitialization**: Changes apply immediately without data reprocessing
- ✅ **Smart filtering**: Negative/zero values automatically moved off-screen
- ✅ **Zoom-independent**: Works correctly at any zoom level

### `autoScaleToLogSpace()`

Intelligently preserve current view when switching between linear and log space. Available on both WebglPlot and individual plotters.

```typescript
// Option 1: Using WebglPlot (legacy)
plot.setLogAxis(false, true);           
const preserved = plot.autoScaleToLogSpace(); 

// Option 2: Using individual plotters (v1.2.0+, recommended)
thinPlotter.setLogAxis(false, true);
const bounds = thinPlotter.getDataBounds();
const preserved = thinPlotter.autoScaleToLogSpace(bounds); // More accurate

if (!preserved) {
  // Fallback to regular auto-scaling if view preservation failed
  thinPlotter.autoScaleEnabledLines();
}
```

### Smart Auto-Scaling for Log Axes (v1.1.1+)

The `autoScaleEnabledLines()` method now intelligently handles mixed data when log axes are enabled:

```typescript
// Smart filtering: Lines with insufficient positive data are excluded from bounds calculation
const plotter = plot.newUnifiedLinePlotter(3);
plotter.initLines([
  { points: exponentialData, color: [1,0,0,1], enabled: true },  // 100% positive → included
  { points: sineWaveData, color: [0,1,0,1], enabled: true },     // ~50% positive → may be skipped
  { points: negativeData, color: [0,0,1,1], enabled: true }      // 0% positive → skipped
]);

plot.setLogAxis(false, true); // Enable log Y axis
plotter.autoScaleEnabledLines(); // Automatically excludes problematic lines

// Console output will show: "Skipping line 1 - only 45/100 (45.0%) points valid for log axes"
```

**Smart Filtering Rules:**
- ✅ **Included**: Lines with ≥10% positive values AND ≥2 valid points
- ⚠️ **Excluded**: Lines with <10% positive values OR <2 valid points
- 🔍 **Visibility**: Excluded lines may still render (positive portions visible), but don't affect scaling

**Applies to All Plotter Types:**
```typescript
// Smart auto-scaling works the same for all plotters (v1.2.0+)
const thinPlotter = new WebglLinePlot(plot, 3);    // ✅ Local log axis support
const thickPlotter = new WebglLineThick(plot, 3);  // ✅ Local log axis support  
const unifiedPlotter = new UnifiedLinePlot(plot, 3); // ✅ Local log axis support

// Each plotter can have independent log axis settings
thinPlotter.setLogAxis(false, true);    // Log Y only
thickPlotter.setLogAxis(true, false);   // Log X only  
unifiedPlotter.setLogAxis(true, true);  // Both axes

// All will skip lines with insufficient positive data when log axes are enabled
thinPlotter.autoScaleEnabledLines();   // Console: "Skipping line X - only Y% valid"
thickPlotter.autoScaleEnabledLines();  // Console: "Skipping line X - only Y% valid"
unifiedPlotter.autoScaleEnabledLines(); // Console: "Skipping line X - only Y% valid"
```

This prevents poor auto-scaling when some lines contain mostly negative values that become invisible on log axes.

## 🔬 Scientific Data Examples

### Exponential Growth/Decay

```typescript
import { WebglPlot, WebglLinePlot } from 'webgl-plot';

// Generate exponential data: y = 2 * e^(0.5*x)
function generateExponentialData(): Float32Array {
  const points = new Float32Array(200); // 100 points * 2 coords
  for (let i = 0; i < 100; i++) {
    const x = i * 0.1; // x: 0 to 10
    const y = 2 * Math.exp(0.5 * x); // Exponential growth
    points[i * 2] = x;
    points[i * 2 + 1] = y;
  }
  return points;
}

// Setup for exponential data using thin lines (high performance)
const plot = new WebglPlot(canvas);
const expPlotter = new WebglLinePlot(plot, 1); // Direct instantiation

const expData = generateExponentialData();
expPlotter.initLines([{
  points: expData,
  color: [1, 0.5, 0, 1], // Orange
  thickness: 1.0, // Fixed for thin lines
  enabled: true
}]);

plot.setLogAxis(false, true); // Linear X, Log Y
expPlotter.autoScaleEnabledLines(); // Smart auto-scaling for log axes
```

### Power Law Data

```typescript
import { WebglPlot, WebglLineThick } from 'webgl-plot';

// Generate power law data: y = 3 * x^2.5
function generatePowerLawData(): Float32Array {
  const points = new Float32Array(200);
  for (let i = 0; i < 100; i++) {
    const x = 0.1 + i * 0.99; // x: 0.1 to 100
    const y = 3 * Math.pow(x, 2.5); // Power law
    points[i * 2] = x;
    points[i * 2 + 1] = y;
  }
  return points;
}

// Setup using thick lines for presentation quality
const plot = new WebglPlot(canvas);
const powerPlotter = new WebglLineThick(plot, 1); // Direct instantiation

const powerData = generatePowerLawData();
powerPlotter.initLines([{
  points: powerData,
  color: [0, 1, 0.5, 1], // Green
  thickness: 3.0, // Variable thickness
  enabled: true
}]);

// Power law appears as straight line on log-log plot
plot.setLogAxis(true, true); // Log X, Log Y
powerPlotter.autoScaleEnabledLines(); // Smart auto-scaling for log axes
```

### Wide Range Scientific Data

```typescript
import { WebglPlot, UnifiedLinePlot } from 'webgl-plot';

// Data spanning multiple orders of magnitude
function generateWideRangeData(): Float32Array {
  const points = new Float32Array(200);
  for (let i = 0; i < 100; i++) {
    // X spans 6 orders of magnitude: 0.001 to 1000
    const x = Math.pow(10, (i / 99) * 6 - 3);
    const y = x * x + 0.1 * Math.sin(Math.log10(x) * 10);
    points[i * 2] = x;
    points[i * 2 + 1] = y;
  }
  return points;
}

// Setup using unified plotter (auto-selects optimal renderer)
const plot = new WebglPlot(canvas);
const widePlotter = new UnifiedLinePlot(plot, 1); // Direct instantiation

const wideData = generateWideRangeData();
widePlotter.initLines([{
  points: wideData,
  color: [0.5, 0.5, 1, 1], // Blue
  thickness: 2.0, // Will auto-select thick plotter
  enabled: true
}]);

// Log X helps visualize wide range data
plot.setLogAxis(true, false); // Log X, Linear Y
widePlotter.autoScaleEnabledLines(); // Smart auto-scaling for log axes
```

## 🎛️ Interactive Controls

### Real-time Log Axis Toggling

```typescript
// Toggle log Y-axis with button
document.getElementById('toggleLogY').addEventListener('click', () => {
  const currentLogY = plot.logY;
  plot.setLogAxis(plot.logX, !currentLogY);
  
  // Re-scale for new axis type
  plotter.autoScaleEnabledLines();
  
  console.log(`Log Y-axis: ${!currentLogY ? 'enabled' : 'disabled'}`);
});

// Toggle log X-axis
document.getElementById('toggleLogX').addEventListener('click', () => {
  const currentLogX = plot.logX;
  plot.setLogAxis(!currentLogX, plot.logY);
  plotter.autoScaleEnabledLines();
});
```

### Preserve View When Switching

```typescript
function smoothLogToggle(enableLogY: boolean) {
  // First ensure plot is scaled properly
  plotter.autoScaleEnabledLines();
  
  // Switch to log axis
  plot.setLogAxis(plot.logX, enableLogY);
  
  // Try to preserve current view
  const preserved = plot.autoScaleToLogSpace();
  
  if (!preserved) {
    // Fall back to full auto-scale
    plotter.autoScaleEnabledLines();
    console.log('View could not be preserved, used full auto-scale');
  } else {
    console.log('Successfully preserved view in log space');
  }
}
```

## 🏎️ Performance Considerations

### Line Plotter Selection

Choose the right plotter for your use case:

#### Thin Lines (WebglLinePlot) - High Performance
```typescript
const thinPlotter = plot.newThinLinePlotter(maxLines);
// OR direct instantiation:
// const thinPlotter = new WebglLinePlot(plot, maxLines);

thinPlotter.initLines([{
  points: myData,
  color: [1, 0, 0, 1],
  thickness: 1.0, // Fixed at 1.0 pixel
  enabled: true
}]);

// Now supports local log axis control (v1.2.0+)
thinPlotter.setLogAxis(false, true);
thinPlotter.autoScaleEnabledLines();
```

**Performance**: ~2.1ms → ~2.3ms with log axes (9% overhead)
- ✅ Fastest rendering option
- ✅ Fixed 1-pixel thickness  
- ✅ Best for real-time data and high-density plots
- ✅ **New**: Local log axis support with `setLogAxis()` and `autoScaleToLogSpace()`

#### Thick Lines (WebglLineThick) - Full Featured
```typescript
const thickPlotter = plot.newThickLinePlotter(maxLines);
// OR direct instantiation:
// const thickPlotter = new WebglLineThick(plot, maxLines);

thickPlotter.initLines([{
  points: myData,
  color: [0, 1, 0, 1],
  thickness: 3.0, // Variable thickness
  enabled: true
}]);

// Local log axis support (same API as thin lines)
thickPlotter.setLogAxis(true, true);
thickPlotter.autoScaleEnabledLines();
```

**Performance**: ~12.4ms → ~12.8ms with log axes (3% overhead)
- ✅ Variable thickness with proper joins and end caps
- ✅ Professional-quality line rendering
- ✅ Handles sharp angles with automatic bevel detection
- ✅ **Enhanced**: Improved shared utilities for consistent log axis behavior

#### Unified Lines (UnifiedLinePlot) - Smart Selection
```typescript
const unifiedPlotter = plot.newUnifiedLinePlotter(maxLines);
// OR direct instantiation:
// const unifiedPlotter = new UnifiedLinePlot(plot, maxLines);

unifiedPlotter.initLines([{
  points: myData,
  color: [0, 0, 1, 1],
  thickness: 2.0, // Automatically chooses thick plotter
  enabled: true
}]);

// Log axis control forwarded to underlying plotter
unifiedPlotter.setLogAxis(false, true);
unifiedPlotter.autoScaleEnabledLines();
```

**Performance**: Automatically selects optimal performance based on thickness
- ✅ Lines ≤ 1.0 pixel → Uses WebglLinePlot (thin, fast)
- ✅ Lines > 1.0 pixel → Uses WebglLineThick (thick, full-featured)
- ✅ Best general-purpose option
- ✅ **Updated**: Forwards log axis calls to underlying plotter for consistent API

### Log Transform Performance

The GPU-based log transformation adds minimal overhead:

```typescript
// Benchmark results (1000 points):
Thin Lines (WebglLinePlot):   Linear 2.1ms  →  Log 2.3ms  (9% overhead)
Thick Lines (WebglLineThick): Linear 12.4ms →  Log 12.8ms (3% overhead)  
Unified (auto-selected):      Linear 2.1ms  →  Log 2.3ms  (9% overhead when thin)
```

All plotters benefit from GPU-accelerated log transformation with minimal performance impact.

**v1.2.0+ Improvements:**
- ✅ **Shared utilities**: Eliminated ~150 lines of duplicate code between plotters
- ✅ **Consistent API**: All plotters now have identical log axis methods
- ✅ **Local control**: Each plotter can have independent log axis settings
- ✅ **Better maintainability**: Single source of truth for log axis logic

## 🛠️ Advanced Usage

### Multiple Data Series with Mixed Axes

```typescript
// Scientific instrument data with different scales
const pressurePlotter = plot.newThinLinePlotter(1);
const temperaturePlotter = plot.newThinLinePlotter(1);

// Pressure data (exponential behavior)
pressurePlotter.initLines([{
  points: pressureData,
  color: [1, 0, 0, 1], // Red
  thickness: 1,
  enabled: true
}]);

// Temperature data (linear behavior)
temperaturePlotter.initLines([{
  points: temperatureData,
  color: [0, 0, 1, 1], // Blue
  thickness: 1,
  enabled: true
}]);

// Use log Y for pressure, linear for temperature display
plot.setLogAxis(false, true); // Benefits pressure data visualization

// Render both
function render() {
  plot.update();
  pressurePlotter.draw();
  temperaturePlotter.draw();
  requestAnimationFrame(render);
}
```

### Debug Mode for Development

```typescript
// Enable debug logging
const plot = new WebglPlot(canvas, { debug: true });

// Debug output shows:
// - Log transformation details
// - Bounds calculations
// - Performance metrics
// - Auto-scaling operations
```

### Custom Data Filtering

```typescript
// Pre-filter data for log axes (optional - GPU does this automatically)
function prepareDataForLog(rawData: Float32Array, logX: boolean, logY: boolean): Float32Array {
  const filtered: number[] = [];
  
  for (let i = 0; i < rawData.length; i += 2) {
    const x = rawData[i];
    const y = rawData[i + 1];
    
    // Skip points that would be problematic for log axes
    if ((logX && x <= 0) || (logY && y <= 0)) {
      continue;
    }
    
    filtered.push(x, y);
  }
  
  return new Float32Array(filtered);
}

// Usage (though GPU filtering is usually sufficient)
const cleanData = prepareDataForLog(rawData, true, true);
plotter.initLines([{ points: cleanData, color: [1,0,0,1], thickness: 2 }]);
```

## 🔍 Troubleshooting

### Common Issues

**Lines disappear when enabling log axes:**
```typescript
// Problem: Data contains negative or zero values
// Solution: Log transformation automatically filters these out
// Check: Ensure your data has positive values for log-scaled axes

// Debug: Check data range
function analyzeData(data: Float32Array) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let negativeCount = 0;
  
  for (let i = 0; i < data.length; i += 2) {
    const x = data[i], y = data[i + 1];
    if (x <= 0 || y <= 0) negativeCount++;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  
  console.log(`Data range: X[${minX}, ${maxX}], Y[${minY}, ${maxY}]`);
  console.log(`Points with negative/zero values: ${negativeCount}`);
}
```

**Scaling looks wrong after toggling:**
```typescript
// Problem: Auto-scaling calculated in wrong space
// Solution: Always re-auto-scale after changing log axis settings
plot.setLogAxis(false, true);
plotter.autoScaleEnabledLines(); // Essential step
```

**Performance slower than expected:**
```typescript
// Problem: Using thick lines when thin would suffice
// Solution: Use appropriate plotter for your needs
if (maxThickness <= 1.0) {
  const plotter = plot.newThinLinePlotter(maxLines); // Faster
} else {
  const plotter = plot.newThickLinePlotter(maxLines); // Full-featured
}
```

**Auto-scaling ignores some lines with log axes:**
```typescript
// This is EXPECTED behavior (v1.1.1+): Smart auto-scaling for log axes
// Lines with mostly negative/zero values are automatically excluded from 
// auto-scaling bounds calculation when log axes are enabled

// Example: Mixed data scenario
const plotter = plot.newUnifiedLinePlotter(3);
plotter.initLines([
  { points: positiveData, color: [1,0,0,1], enabled: true },    // ✅ Used for log auto-scaling
  { points: mixedData, color: [0,1,0,1], enabled: true },       // ⚠️ Skipped if <10% positive values
  { points: negativeData, color: [0,0,1,1], enabled: true }     // ⚠️ Skipped for log Y auto-scaling
]);

plot.setLogAxis(false, true); // Enable log Y
plotter.autoScaleEnabledLines(); // Only considers lines with sufficient positive data

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
    if (y > 0) { // Keep only positive Y values for log Y axis
      filtered.push(x, y);
    }
  }
  return new Float32Array(filtered);
}
```

## 📊 Complete Example: Scientific Dashboard

```typescript
import { WebglPlot } from 'webgl-plot';

class ScientificDashboard {
  private plot: WebglPlot;
  private dataPlotter: any;
  private isLogY = false;
  
  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.plot = new WebglPlot(canvas, {
      backgroundColor: [0.05, 0.05, 0.1, 1], // Dark blue
      debug: false // Set to true for development
    });
    
    this.dataPlotter = this.plot.newUnifiedLinePlotter(10);
    this.setupControls();
  }
  
  // Load scientific data
  loadExperimentData(data: Float32Array, dataType: 'exponential' | 'power-law' | 'linear') {
    const config = {
      exponential: { logX: false, logY: true, color: [1, 0.6, 0, 1] },
      'power-law': { logX: true, logY: true, color: [0.6, 1, 0, 1] },
      linear: { logX: false, logY: false, color: [0, 0.6, 1, 1] }
    }[dataType];
    
    this.dataPlotter.initLines([{
      points: data,
      color: config.color,
      thickness: 2,
      enabled: true
    }]);
    
    // Set appropriate axes for data type
    this.plot.setLogAxis(config.logX, config.logY);
    this.dataPlotter.autoScaleEnabledLines();
    
    this.isLogY = config.logY;
    this.updateUI();
  }
  
  // Toggle log Y-axis
  toggleLogY() {
    this.isLogY = !this.isLogY;
    this.plot.setLogAxis(this.plot.logX, this.isLogY);
    this.dataPlotter.autoScaleEnabledLines();
    this.updateUI();
  }
  
  // Setup UI controls
  private setupControls() {
    document.getElementById('toggleLog')?.addEventListener('click', () => {
      this.toggleLogY();
    });
  }
  
  private updateUI() {
    const button = document.getElementById('toggleLog');
    if (button) {
      button.textContent = `${this.isLogY ? 'Disable' : 'Enable'} Log Y-axis`;
    }
  }
  
  // Animation loop
  start() {
    const animate = () => {
      this.plot.update();
      this.dataPlotter.draw();
      requestAnimationFrame(animate);
    };
    animate();
  }
}

// Usage
const dashboard = new ScientificDashboard('scientificCanvas');
dashboard.loadExperimentData(myExponentialData, 'exponential');
dashboard.start();
```

## 🔗 See Also

- **Interactive demo**: `/benchmark/bench-log-axis.html`
  - Use "Multi-Line Test" button to see smart auto-scaling in action
  - Compare linear vs log scaling with mixed positive/negative data
- **API reference**: Check JSDoc comments in `src/webglplot.ts`, `src/WebglLinePlot.ts`, and `src/WebglLineThick.ts`
- **Test the smart filtering**: Open browser console when running benchmarks to see auto-scaling decisions
- **Shared utilities**: See `src/LogAxisUtils.ts` for the common log axis functionality

## 🎯 Version Notes

**v1.2.0+**: Unified log axis support across all plotters
- ✅ **Feature parity**: WebglLinePlot now has same log axis capabilities as WebglLineThick
- ✅ **Local control**: All plotters support `setLogAxis()` and `autoScaleToLogSpace()` methods
- ✅ **Shared utilities**: Extracted common log axis logic into `LogAxisUtils.ts`
- ✅ **Better performance**: Improved efficiency through code deduplication
- ✅ **Enhanced documentation**: Complete API coverage for all plotter types
- ✅ **Backward compatibility**: All existing code continues to work unchanged

**v1.1.1+**: Enhanced auto-scaling for log axes
- Automatically excludes lines with insufficient positive data from bounds calculation
- Prevents poor scaling when mixing positive/negative data with log axes
- Maintains backward compatibility - all existing code continues to work
- Added console logging for transparency in auto-scaling decisions

The logarithmic axis feature transforms webgl-plot into a powerful tool for scientific data visualization while maintaining the library's signature high performance.