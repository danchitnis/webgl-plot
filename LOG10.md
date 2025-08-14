# Logarithmic Axes (Log₁₀) Guide

The webgl-plot library provides GPU-accelerated logarithmic scaling for both X and Y axes, enabling high-performance visualization of exponential, power-law, and wide-range scientific data.

## 🚀 Quick Start

```typescript
import { setupCanvasAndWebGL, UnifiedLinePlot, clearCanvas } from 'webgl-plot';

// Setup canvas and WebGL context
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gl = setupCanvasAndWebGL(canvas, {
  backgroundColor: [0, 0, 0, 1]
});

// Create unified line plotter
const plotter = new UnifiedLinePlot(gl, 1);
plotter.initLines([{
  points: yourData, // Float32Array of [x1,y1,x2,y2,...]
  color: [1, 0, 0, 1],
  thickness: 2,
  enabled: true
}]);

// Enable logarithmic Y-axis
plotter.setLogAxis(false, true);
plotter.autoScaleEnabledLines();

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
plotter.setLogAxis(false, true);  // Enable log Y only
plotter.setLogAxis(true, true);   // Enable both axes
plotter.setLogAxis(false, false); // Disable log scaling
```

**Key Features:**
- ✅ **GPU-accelerated**: Transformation happens on GPU for real-time performance
- ✅ **No reinitialization**: Changes apply immediately without data reprocessing
- ✅ **Smart filtering**: Negative/zero values automatically moved off-screen
- ✅ **Zoom-independent**: Works correctly at any zoom level

### `autoScaleToLogSpace()`

Intelligently preserve current view when switching between linear and log space.

```typescript
plotter.setLogAxis(false, true);
const bounds = plotter.getDataBounds();
const preserved = plotter.autoScaleToLogSpace(bounds);

if (!preserved) {
  // Fallback to regular auto-scaling if view preservation failed
  plotter.autoScaleEnabledLines();
}
```

### Smart Auto-Scaling for Log Axes

The `autoScaleEnabledLines()` method intelligently handles mixed data when log axes are enabled:

```typescript
// Smart filtering: Lines with insufficient positive data are excluded from bounds calculation
const plotter = new UnifiedLinePlot(gl, 3);
plotter.initLines([
  { points: exponentialData, color: [1,0,0,1], enabled: true },  // 100% positive → included
  { points: sineWaveData, color: [0,1,0,1], enabled: true },     // ~50% positive → may be skipped
  { points: negativeData, color: [0,0,1,1], enabled: true }      // 0% positive → skipped
]);

plotter.setLogAxis(false, true); // Enable log Y axis
plotter.autoScaleEnabledLines(); // Automatically excludes problematic lines

// Console output will show: "Skipping line 1 - only 45/100 (45.0%) points valid for log axes"
```

**Smart Filtering Rules:**
- ✅ **Included**: Lines with ≥10% positive values AND ≥2 valid points
- ⚠️ **Excluded**: Lines with <10% positive values OR <2 valid points
- 🔍 **Visibility**: Excluded lines may still render (positive portions visible), but don't affect scaling

## 🔬 Scientific Data Examples

### Exponential Growth/Decay

```typescript
import { setupCanvasAndWebGL, WebglLinePlot, clearCanvas } from 'webgl-plot';

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
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gl = setupCanvasAndWebGL(canvas);
const expPlotter = new WebglLinePlot(gl, 1);

const expData = generateExponentialData();
expPlotter.initLines([{
  points: expData,
  color: [1, 0.5, 0, 1], // Orange
  thickness: 1.0,
  enabled: true
}]);

expPlotter.setLogAxis(false, true); // Linear X, Log Y
expPlotter.autoScaleEnabledLines();
```

### Power Law Data

```typescript
import { setupCanvasAndWebGL, WebglLineThick, clearCanvas } from 'webgl-plot';

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
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gl = setupCanvasAndWebGL(canvas);
const powerPlotter = new WebglLineThick(gl, 1);

const powerData = generatePowerLawData();
powerPlotter.initLines([{
  points: powerData,
  color: [0, 1, 0.5, 1], // Green
  thickness: 3.0,
  enabled: true
}]);

// Power law appears as straight line on log-log plot
powerPlotter.setLogAxis(true, true); // Log X, Log Y
powerPlotter.autoScaleEnabledLines();
```

### Wide Range Scientific Data

```typescript
import { setupCanvasAndWebGL, UnifiedLinePlot, clearCanvas } from 'webgl-plot';

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
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gl = setupCanvasAndWebGL(canvas);
const widePlotter = new UnifiedLinePlot(gl, 1);

const wideData = generateWideRangeData();
widePlotter.initLines([{
  points: wideData,
  color: [0.5, 0.5, 1, 1], // Blue
  thickness: 2.0, // Will auto-select thick plotter
  enabled: true
}]);

// Log X helps visualize wide range data
widePlotter.setLogAxis(true, false); // Log X, Linear Y
widePlotter.autoScaleEnabledLines();
```

## 🎛️ Interactive Controls

### Real-time Log Axis Toggling

```typescript
// Toggle log Y-axis with button
let logY = false;
document.getElementById('toggleLogY').addEventListener('click', () => {
  logY = !logY;
  plotter.setLogAxis(false, logY);
  plotter.autoScaleEnabledLines();
  console.log(`Log Y-axis: ${logY ? 'enabled' : 'disabled'}`);
});
```

### Preserve View When Switching

```typescript
function smoothLogToggle(enableLogY: boolean) {
  plotter.autoScaleEnabledLines();
  plotter.setLogAxis(false, enableLogY);
  
  const bounds = plotter.getDataBounds();
  const preserved = plotter.autoScaleToLogSpace(bounds);
  
  if (!preserved) {
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
const thinPlotter = new WebglLinePlot(gl, maxLines);

thinPlotter.initLines([{
  points: myData,
  color: [1, 0, 0, 1],
  thickness: 1.0, // Fixed at 1.0 pixel
  enabled: true
}]);

thinPlotter.setLogAxis(false, true);
thinPlotter.autoScaleEnabledLines();
```

**Performance**: ~2.1ms → ~2.3ms with log axes (9% overhead)
- ✅ Fastest rendering option
- ✅ Fixed 1-pixel thickness  
- ✅ Best for real-time data and high-density plots

#### Thick Lines (WebglLineThick) - Full Featured
```typescript
const thickPlotter = new WebglLineThick(gl, maxLines);

thickPlotter.initLines([{
  points: myData,
  color: [0, 1, 0, 1],
  thickness: 3.0, // Variable thickness
  enabled: true
}]);

thickPlotter.setLogAxis(true, true);
thickPlotter.autoScaleEnabledLines();
```

**Performance**: ~12.4ms → ~12.8ms with log axes (3% overhead)
- ✅ Variable thickness with proper joins and end caps
- ✅ Professional-quality line rendering
- ✅ Handles sharp angles with automatic bevel detection

#### Unified Lines (UnifiedLinePlot) - Smart Selection
```typescript
const unifiedPlotter = new UnifiedLinePlot(gl, maxLines);

unifiedPlotter.initLines([{
  points: myData,
  color: [0, 0, 1, 1],
  thickness: 2.0, // Automatically chooses thick plotter
  enabled: true
}]);

unifiedPlotter.setLogAxis(false, true);
unifiedPlotter.autoScaleEnabledLines();
```

**Performance**: Automatically selects optimal performance based on thickness
- ✅ Lines ≤ 1.0 pixel → Uses WebglLinePlot (thin, fast)
- ✅ Lines > 1.0 pixel → Uses WebglLineThick (thick, full-featured)
- ✅ Best general-purpose option

### Log Transform Performance

The GPU-based log transformation adds minimal overhead:

```typescript
// Benchmark results (1000 points):
Thin Lines (WebglLinePlot):   Linear 2.1ms  →  Log 2.3ms  (9% overhead)
Thick Lines (WebglLineThick): Linear 12.4ms →  Log 12.8ms (3% overhead)  
Unified (auto-selected):      Linear 2.1ms  →  Log 2.3ms  (9% overhead when thin)
```

All plotters benefit from GPU-accelerated log transformation with minimal performance impact.

## 🛠️ Advanced Usage

### Multiple Data Series with Mixed Axes

```typescript
// Scientific instrument data with different scales
const pressurePlotter = new WebglLinePlot(gl, 1);
const temperaturePlotter = new WebglLinePlot(gl, 1);

// Pressure data (exponential behavior) - use log Y
pressurePlotter.initLines([{ points: pressureData, color: [1, 0, 0, 1], thickness: 1, enabled: true }]);
pressurePlotter.setLogAxis(false, true);

// Temperature data (linear behavior) - use linear
temperaturePlotter.initLines([{ points: temperatureData, color: [0, 0, 1, 1], thickness: 1, enabled: true }]);
temperaturePlotter.setLogAxis(false, false);

// Render both
function render() {
  clearCanvas(gl);
  pressurePlotter.draw();
  temperaturePlotter.draw();
  requestAnimationFrame(render);
}
```

### Debug Mode for Development

```typescript
import { DebugLogger } from 'webgl-plot';

// Enable debug logging
DebugLogger.setDebugMode(true);

// Debug output shows:
// - Log transformation details
// - Bounds calculations
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
  const plotter = new WebglLinePlot(gl, maxLines); // Faster
} else {
  const plotter = new WebglLineThick(gl, maxLines); // Full-featured
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
  { points: positiveData, color: [1,0,0,1], enabled: true },    // ✅ Used for log auto-scaling
  { points: mixedData, color: [0,1,0,1], enabled: true },       // ⚠️ Skipped if <10% positive values
  { points: negativeData, color: [0,0,1,1], enabled: true }     // ⚠️ Skipped for log Y auto-scaling
]);

plotter.setLogAxis(false, true); // Enable log Y
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
import { setupCanvasAndWebGL, UnifiedLinePlot, clearCanvas } from 'webgl-plot';

class ScientificDashboard {
  private gl: WebGL2RenderingContext;
  private dataPlotter: UnifiedLinePlot;
  private isLogY = false;
  
  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.gl = setupCanvasAndWebGL(canvas, {
      backgroundColor: [0.05, 0.05, 0.1, 1] // Dark blue
    });
    
    this.dataPlotter = new UnifiedLinePlot(this.gl, 10);
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
    
    this.dataPlotter.setLogAxis(config.logX, config.logY);
    this.dataPlotter.autoScaleEnabledLines();
    
    this.isLogY = config.logY;
    this.updateUI();
  }
  
  // Toggle log Y-axis
  toggleLogY() {
    this.isLogY = !this.isLogY;
    this.dataPlotter.setLogAxis(false, this.isLogY);
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
      clearCanvas(this.gl);
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
- **API reference**: Check JSDoc comments in source files
- **Test the smart filtering**: Open browser console when running benchmarks to see auto-scaling decisions

## How Log Scaling Works

The logarithmic scaling in webgl-plot uses GPU-accelerated transformations:

1. **GPU Transform**: `log10(value)` computed in vertex shaders for real-time performance
2. **Smart Filtering**: Negative/zero values automatically moved off-screen (log(x ≤ 0) undefined)
3. **Auto-scaling Intelligence**: Lines with <10% positive values excluded from bounds calculation
4. **Zoom Independence**: Scaling works correctly at any zoom level

The log transformation preserves data relationships while compressing wide dynamic ranges, making it ideal for exponential data, power laws, and scientific measurements spanning multiple orders of magnitude.