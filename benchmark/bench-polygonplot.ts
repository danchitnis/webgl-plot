import { WebglPlot, WebglPlotConfig } from "../src/webglplot";
import { WbglPolygonPlot, PolygonConfig } from "../src/WbglPolygonPlot";

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }
  canvas.width = 800;
  canvas.height = 600;

  const webglPlotConfig: WebglPlotConfig = {
    antialias: true,
    transparent: false,
    powerPerformance: "default",
    preserveDrawing: false, // Corrected property name
  };

  const wglp = new WebglPlot(canvas, webglPlotConfig);

  // Initialize WbglPolygonPlot
  // The maxPolygons parameter in constructor is not strictly used by current WbglPolygonPlot logic
  // if initPolygons is the primary way to set polygons, but kept for consistency with subtask.
  const polygonPlot = new WbglPolygonPlot(wglp, 100);

  // Create Polygon Configurations
  const polygonConfigs: PolygonConfig[] = [];

  // Triangle examples
  polygonConfigs.push(WbglPolygonPlot.createTriangle({
    center: [-0.8, 0.7],
    radius: 0.1,
    fillColor: [1, 0, 0, 0.5], // Red, semi-transparent
    isFilled: true,
    isStroked: true,
    strokeColor: [0,0,0,1],
    strokeWeight: 2,
  }));

  polygonConfigs.push(WbglPolygonPlot.createTriangle({
    center: [-0.6, 0.7],
    radius: 0.08,
    rotation: Math.PI / 4, // 45 degrees
    fillColor: [1, 0.5, 0, 0.7], // Orange
    isFilled: true,
    isStroked: false,
    offset: [0, 0.1] // Shifted up slightly
  }));

  // Square examples
  polygonConfigs.push(WbglPolygonPlot.createSquare({
    center: [-0.2, 0.5],
    size: 0.2,
    fillColor: [0, 1, 0, 0.6], // Green
    isFilled: true,
    strokeColor: [0.1, 0.1, 0.1, 1],
    strokeWeight: 3,
    isStroked: true,
  }));

  polygonConfigs.push(WbglPolygonPlot.createSquare({
    center: [0.1, 0.5],
    size: 0.15,
    rotation: Math.PI / 6, // 30 degrees
    isFilled: false, // Stroke only
    isStroked: true,
    strokeColor: [0, 0, 1, 1], // Blue
    strokeWeight: 4,
    scale: [1.5, 1] // Stretched horizontally
  }));

  // Circle examples
  polygonConfigs.push(WbglPolygonPlot.createCircle({
    center: [0.5, 0.6],
    radius: 0.1,
    fillColor: [1, 0, 1, 0.7], // Magenta
    isFilled: true,
    isStroked: true,
    strokeColor: [0.2, 0.2, 0.2, 1],
    strokeWeight: 1,
  }));

  polygonConfigs.push(WbglPolygonPlot.createCircle({
    center: [0.8, 0.6],
    radius: 0.07,
    segments: 8, // Octagon
    fillColor: [0.5, 0.5, 1, 0.8], // Light blue
    isFilled: true,
    isStroked: false,
    offset: [0, -0.1],
    enabled: true,
  }));

  // A larger, more complex polygon (e.g., a star or custom shape)
  const starPoints = new Float32Array([
    0.0,  0.3, // Top point
   0.07, 0.1,
   0.25, 0.1,
   0.1, -0.05,
   0.15,-0.25,
    0.0,-0.15,
   -0.15,-0.25,
   -0.1, -0.05,
   -0.25, 0.1,
   -0.07, 0.1,
  ].map(p => p*0.7)); // Scaled down a bit

  polygonConfigs.push({
      points: starPoints,
      fillColor: [1, 1, 0, 0.7], // Yellow
      isFilled: true,
      strokeColor: [0.5, 0.5, 0, 1],
      strokeWeight: 2,
      isStroked: true,
      offset: [-0.5, -0.3], // Positioned
      scale: [1,1]
  });

  // Initialize Polygons in WbglPolygonPlot
  polygonPlot.initPolygons(polygonConfigs);

  // Render Loop
  function animate() {
    // wglp.update(); // Assuming this clears the canvas or handles viewport updates
                     // For now, WebglPlot doesn't have a clear or explicit update per frame by default.
                     // Clearing is usually done by the browser before drawing or by setting preserveDrawingBuffer = false.
                     // If individual plots need clearing, that would be part of their draw() or a specific clear method.

    // Let's clear the canvas manually for this benchmark if preserveDrawingBuffer is true,
    // or rely on preserveDrawingBuffer:false.
    // For simplicity with current WebglPlot, if preserveDrawingBuffer is false (default for this demo),
    // clearing should be automatic. If it were true, we'd need:
    // const gl = wglp.webgl;
    // gl.clearColor(0.1, 0.1, 0.1, 1); // Example clear color
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    polygonPlot.draw();

    requestAnimationFrame(animate);
  }

  // Start the animation
  animate();

  // Example of updating a polygon after a delay (optional for initial demo)
  setTimeout(() => {
    if (polygonConfigs.length > 0) {
      polygonPlot.updatePolygonStyle(0, { fillColor: [0, 1, 1, 0.7] }); // Change first polygon's fill to cyan
      // Note: draw() needs to be called again to see the update.
      // In the animation loop, this will happen automatically.

      // Example of changing transform - this requires re-setting uniforms in the draw call.
      // The current updatePolygonTransform only updates the config.
      // The draw call reads from this config.
      polygonPlot.updatePolygonTransform(1, [1.5, 1.5], polygonConfigs[1].offset || [0,0]);
      polygonConfigs[1].scale = [1.5,1.5]; // also update the source array if we re-init later

      // To update points, which is more involved as it changes buffer data:
      // const firstPolygon = polygonConfigs[0];
      // if (firstPolygon && WbglPolygonPlot.createTriangle) { // Check if it was a triangle
      //   const newTrianglePoints = WbglPolygonPlot.createTriangle({
      //     center: [-0.8, 0.65], // slightly moved
      //     radius: 0.12, // slightly larger
      //     fillColor: firstPolygon.fillColor,
      //   }).points;
      //   polygonPlot.updatePolygonPoints(0, newTrianglePoints);
      // }
      console.log("Updated first polygon style and second polygon transform after 2 seconds.");
    }
  }, 2000);

});

// Basic HTML (conceptual - assumed to be in bench-polygonplot.html)
/*
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WbglPolygonPlot Benchmark</title>
    <style>
        body { margin: 0; overflow: hidden; background-color: #333; }
        canvas { border: 1px solid white; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script src="bench-polygonplot.js"></script> <!-- Assuming compiled JS -->
</body>
</html>
*/
