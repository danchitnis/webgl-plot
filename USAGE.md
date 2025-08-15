# webgl-plot Usage Guide

A high-performance 2D WebGL plotting library for real-time data visualization.

## Quick Start

### Basic Setup

```typescript
import { setupCanvasAndWebGL, UnifiedLinePlot, clearCanvas } from 'webgl-plot';

// Setup canvas and WebGL context
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gl = setupCanvasAndWebGL(canvas, {
  backgroundColor: [0, 0, 0, 1], // Black background
  antialias: true
});

// Create a unified line plotter (automatically chooses thin/thick rendering)
const plotter = new UnifiedLinePlot(gl, 10); // Max 10 lines

// Initialize lines
plotter.initLines([
  {
    points: new Float32Array([0, 0, 1, 1, 2, 0.5]), // x1,y1, x2,y2, x3,y3...
    color: [1, 0, 0, 1], // Red
    thickness: 2.0,
    enabled: true
  }
]);

// Render loop
function render() {
  clearCanvas(gl);
  plotter.draw();
  requestAnimationFrame(render);
}
render();
```

## Core Concepts

### User-Managed WebGL Context

Unlike many WebGL libraries, webgl-plot v2 requires you to manage the WebGL2 context directly:

- **You create the context**: `canvas.getContext('webgl2')` or use helpers
- **You handle canvas clearing**: `gl.clear()` or use `clearCanvas()`  
- **You manage the render loop**: `requestAnimationFrame()` with your draw calls

This approach gives you:
- Full control over WebGL state
- Better integration with React/Vue/other frameworks
- Ability to mix multiple plotter types on same canvas
- No stale wrapper object issues

### Canvas Setup

```typescript
import { setupCanvas, createWebGL2Context } from 'webgl-plot';

const canvas = document.getElementById('canvas');

// Method 1: Manual setup
setupCanvas(canvas); // Handles device pixel ratio
const gl = createWebGL2Context(canvas, {
  antialias: true,
  powerPerformance: 'high-performance'
});

// Method 2: Combined setup (recommended)
const gl = setupCanvasAndWebGL(canvas, {
  backgroundColor: [0.1, 0.1, 0.2, 1],
  antialias: true,
  devicePixelRatio: window.devicePixelRatio
});
```

### Canvas Clearing and Background

```typescript
import { setBackgroundColor, clearCanvas } from 'webgl-plot';

// Set background color
setBackgroundColor(gl, [0.1, 0.1, 0.2, 1]); // Dark blue
setBackgroundColor(gl, "rgba(25, 25, 50, 1)"); // CSS format

// Clear canvas
clearCanvas(gl); // Uses current clear color
clearCanvas(gl, [1, 1, 1, 1]); // Clear with white background
```

## Plotter Types

### UnifiedLinePlot (Recommended)

Automatically chooses between thin and thick line rendering based on line thickness.

```typescript
import { UnifiedLinePlot } from 'webgl-plot';

const plotter = new UnifiedLinePlot(gl, 20); // Max 20 lines

plotter.initLines([
  {
    points: new Float32Array([0, 0, 1, 1, 2, 0]),
    color: [1, 0, 0, 1], 
    thickness: 1.0, // → Uses thin renderer (high performance)
    enabled: true
  },
  {
    points: new Float32Array([0, 0.5, 1, 1.5, 2, 0.5]),
    color: [0, 1, 0, 1],
    thickness: 3.0, // → Uses thick renderer (all lines in this plotter)
    enabled: true
  }
]);

// Update individual lines
plotter.updateLineY(0, new Float32Array([0, 0.2, 0.4])); // Update Y values
plotter.updateLineColor(1, [0, 0, 1, 1]); // Change to blue
plotter.setLineEnabled(0, false); // Hide line

plotter.draw();
```

### WebglLinePlot (Thin Lines)

High-performance thin lines (1 pixel width) using native WebGL lines.

```typescript
import { WebglLinePlot } from 'webgl-plot';

const thinPlotter = new WebglLinePlot(gl, 50);

thinPlotter.initLines([
  {
    points: new Float32Array([0, 0, 1, 1, 2, 0.5]),
    color: [1, 0, 0, 1],
    thickness: 1.0, // Always 1.0 for thin lines
    enabled: true
  }
]);

thinPlotter.draw();
```

### WebglLineThick (Thick Lines)

Feature-rich thick lines with proper joins and end caps.

```typescript
import { WebglLineThick } from 'webgl-plot';

const thickPlotter = new WebglLineThick(gl, 10);

thickPlotter.initLines([
  {
    points: new Float32Array([0, 0, 1, 1, 2, 0.5]),
    color: [0, 1, 0, 1],
    thickness: 5.0, // Any thickness > 1.0
    enabled: true
  }
]);

thickPlotter.draw();
```

### WebglScatterAcc (Scatter Plots)

High-performance scatter plots with color-coded points.

```typescript
import { WebglScatterAcc } from 'webgl-plot';

const scatterPlotter = new WebglScatterAcc(gl, 100000); // Max 100k points

scatterPlotter.setSquareSize(0.01); // Point size
scatterPlotter.setColor([1, 1, 0, 1]); // Yellow base color

// Add scattered points
const positions = new Float32Array([
  -0.5, -0.5,  // x1, y1
   0.5, -0.5,  // x2, y2
   0.0,  0.5   // x3, y3
]);
const colors = new Uint8Array([
  255, 0, 0,   // Red
  0, 255, 0,   // Green
  0, 0, 255    // Blue
]);

scatterPlotter.addSquare(positions, colors);
scatterPlotter.draw();
```

### WebglPolygonPlot (Polygons)

Filled and stroked polygon rendering.

```typescript
import { WebglPolygonPlot } from 'webgl-plot';

const polyPlotter = new WebglPolygonPlot(gl);

polyPlotter.initPolygons([
  {
    points: new Float32Array([
      -0.5, -0.5,  // Triangle vertices
       0.5, -0.5,
       0.0,  0.5
    ]),
    fillColor: [1, 0, 0, 0.5], // Semi-transparent red
    strokeColor: [1, 1, 1, 1], // White outline
    strokeWeight: 2.0,
    isFilled: true,
    isStroked: true,
    enabled: true
  }
]);

polyPlotter.draw();
```

## Advanced Features

### Global Transforms and Scaling

```typescript
// Set global transform for all plotters sharing the context
plotter.setGlobalTransform([2.0, 1.5], [0.1, -0.2]); // [scaleX, scaleY], [offsetX, offsetY]

// Individual line transforms
plotter.updateLineTransform(0, [1.0, 2.0], [0.0, 0.1]); // Line-specific transform
```

### Logarithmic Axes

```typescript
// Enable log scaling
plotter.setLogAxis(true, true); // logX, logY

// Auto-scale to fit log data
const success = plotter.transformToLogSpace();
if (success) {
  console.log('Log scaling applied successfully');
}

// Get data bounds for manual scaling
const bounds = plotter.getDataBounds();
console.log('Data range:', bounds); // {minX, maxX, minY, maxY}
```

### Auto-scaling

```typescript
// Auto-scale to fit all enabled lines
plotter.autoScale();

// Get current line configuration
const config = plotter.getLineConfig(0);
console.log('Line 0 config:', config);
```

## Multiple Plotters on Same Canvas

```typescript
import { clearCanvas, UnifiedLinePlot, WebglScatterAcc } from 'webgl-plot';

const canvas = document.getElementById('canvas');
const gl = setupCanvasAndWebGL(canvas, { backgroundColor: [0, 0, 0, 1] });

// Create multiple plotters sharing the same WebGL context
const linePlotter = new UnifiedLinePlot(gl, 10);
const scatterPlotter = new WebglScatterAcc(gl, 1000);

// Initialize data for each plotter
linePlotter.initLines([/* line data */]);
scatterPlotter.addSquare(positions, colors);

// Render all plotters
function render() {
  clearCanvas(gl); // Clear once
  
  // Draw all plotters in desired order
  scatterPlotter.draw(); // Background layer
  linePlotter.draw();    // Foreground layer
  
  requestAnimationFrame(render);
}
render();
```

## Framework Integration

### React Usage

```typescript
import React, { useEffect, useRef } from 'react';
import { setupCanvasAndWebGL, UnifiedLinePlot, clearCanvas } from 'webgl-plot';

const PlotComponent: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const plotterRef = useRef<UnifiedLinePlot | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Setup once
    const gl = setupCanvasAndWebGL(canvasRef.current, {
      backgroundColor: [0.1, 0.1, 0.2, 1]
    });
    glRef.current = gl;

    const plotter = new UnifiedLinePlot(gl, 5);
    plotterRef.current = plotter;

    plotter.initLines([
      {
        points: new Float32Array([0, 0, 1, 1, 2, 0.5]),
        color: [1, 0, 0, 1],
        thickness: 2.0,
        enabled: true
      }
    ]);

    // Render loop
    const render = () => {
      if (gl && plotter) {
        clearCanvas(gl);
        plotter.draw();
        requestAnimationFrame(render);
      }
    };
    render();

    // Cleanup
    return () => {
      plotter?.cleanup();
    };
  }, []);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && glRef.current) {
        handleCanvasResize(canvasRef.current, glRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '400px' }} />;
};
```

### Vue.js Usage

```typescript
<template>
  <canvas ref="canvasRef" style="width: 100%; height: 400px" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { setupCanvasAndWebGL, UnifiedLinePlot, clearCanvas } from 'webgl-plot';

const canvasRef = ref<HTMLCanvasElement>();
let gl: WebGL2RenderingContext;
let plotter: UnifiedLinePlot;
let animationId: number;

onMounted(() => {
  if (!canvasRef.value) return;

  gl = setupCanvasAndWebGL(canvasRef.value, {
    backgroundColor: [0, 0, 0, 1]
  });

  plotter = new UnifiedLinePlot(gl, 10);
  plotter.initLines([/* your data */]);

  const render = () => {
    clearCanvas(gl);
    plotter.draw();
    animationId = requestAnimationFrame(render);
  };
  render();
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
  plotter?.cleanup();
});
</script>
```

## Performance Tips

### High-Performance Settings

```typescript
// Use high-performance WebGL context
const gl = createWebGL2Context(canvas, {
  powerPerformance: 'high-performance',
  antialias: false, // Disable for better performance
  transparent: false // Opaque contexts perform better
});

// For thin lines, use WebglLinePlot directly
const thinPlotter = new WebglLinePlot(gl, 100); // More efficient than UnifiedLinePlot

// Batch updates
const newData = new Float32Array(1000);
// ... fill newData
plotter.updateLineY(0, newData); // Update once vs many individual updates
```

### Memory Management

```typescript
// Clean up resources when done
plotter.cleanup(); // Releases WebGL resources

// Reuse Float32Arrays instead of creating new ones
const reusableBuffer = new Float32Array(1000);
// Fill and reuse reusableBuffer for updates
```

### Real-time Data Updates

```typescript
let frameCount = 0;

function generateData() {
  const data = new Float32Array(100);
  for (let i = 0; i < 50; i++) {
    data[i * 2] = i / 49; // x: 0 to 1
    data[i * 2 + 1] = Math.sin(i * 0.2 + frameCount * 0.1); // y: animated sine
  }
  return data;
}

function render() {
  // Update data at 60fps
  const newData = generateData();
  plotter.updateLineY(0, newData.filter((_, i) => i % 2 === 1)); // Y values only

  clearCanvas(gl);
  plotter.draw();
  
  frameCount++;
  requestAnimationFrame(render);
}
```

## Troubleshooting

### Common Issues

**Canvas appears black:**
```typescript
// Ensure canvas is sized properly
setupCanvas(canvas);
// Or check if background color is set
setBackgroundColor(gl, [1, 1, 1, 1]); // White background
```

**Lines not appearing:**
```typescript
// Check if lines are enabled
plotter.setLineEnabled(0, true);
// Verify data range is within [-1, 1] or use transforms
plotter.setGlobalTransform([1, 1], [0, 0]);
```

**Performance issues:**
```typescript
// Use appropriate plotter type
const thinPlotter = new WebglLinePlot(gl, maxLines); // For thin lines only
// Reduce antialias
const gl = createWebGL2Context(canvas, { antialias: false });
```

**WebGL context lost:**
```typescript
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  console.log('WebGL context lost');
});

canvas.addEventListener('webglcontextrestored', () => {
  console.log('WebGL context restored');
  // Recreate plotters and reload data
});
```

### Debug Mode

```typescript
import { DebugLogger } from 'webgl-plot';

// Enable debug logging
DebugLogger.setDebugMode(true);

// Check for WebGL errors
const error = gl.getError();
if (error !== gl.NO_ERROR) {
  console.error('WebGL Error:', error);
}
```

## API Reference

See individual class documentation and TypeScript definitions for complete API details.

### Core Classes
- `UnifiedLinePlot` - Smart line plotter (recommended)
- `WebglLinePlot` - Thin lines only
- `WebglLineThick` - Thick lines only  
- `WebglScatterAcc` - Scatter plots
- `WebglPolygonPlot` - Polygon rendering

### Helper Functions
- `setupCanvas()` - Canvas dimension setup
- `createWebGL2Context()` - WebGL context creation
- `setupCanvasAndWebGL()` - Combined setup
- `clearCanvas()` - Canvas clearing
- `setBackgroundColor()` - Background color management
- `handleCanvasResize()` - Resize handling

### Types
- `LineConfig` - Line configuration interface
- `PolygonConfig` - Polygon configuration interface
- `WebGL2ContextOptions` - WebGL context options

For more examples and advanced usage, see the `/benchmark` directory in the repository.