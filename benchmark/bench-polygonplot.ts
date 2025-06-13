import { WebglPlot } from "../src/webglplot";
import { WbglPolygonPlot, PolygonConfig } from "../src/WbglPolygonPlot";
import { WebglLinePlot, LineConfig } from "../src/WbglLinePlot"; // Corrected import name

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("my_canvas") as HTMLCanvasElement; // Updated ID
  if (!canvas) {
    console.error("Canvas element 'my_canvas' not found!");
    return;
  }
  // canvas.width and canvas.height are now controlled by CSS via .canvas class

  const wglp = new WebglPlot(canvas);

  // Initialize WbglPolygonPlot
  const polygonPlot = new WbglPolygonPlot(wglp);

  // Initialize WbglLinePlot
  const linePlot = new WebglLinePlot(wglp, 2); // Corrected class name

  // Create Polygon Configurations
  const polygonConfigs: PolygonConfig[] = [];

  // Triangle examples
  polygonConfigs.push(
    WbglPolygonPlot.createTriangle({
      center: [-0.8, 0.7],
      radius: 0.1,
      fillColor: [1, 0, 0, 0.5], // Red, semi-transparent
      isFilled: true,
      isStroked: true,
      strokeColor: [0, 0, 0, 1],
      strokeWeight: 2,
    })
  );

  polygonConfigs.push(
    WbglPolygonPlot.createTriangle({
      center: [-0.6, 0.7],
      radius: 0.08,
      rotation: Math.PI / 4, // 45 degrees
      fillColor: [1, 0.5, 0, 0.7], // Orange
      isFilled: true,
      isStroked: false,
      offset: [0, 0.1], // Shifted up slightly
    })
  );

  // Square examples
  polygonConfigs.push(
    WbglPolygonPlot.createSquare({
      center: [-0.2, 0.5],
      size: 0.2,
      fillColor: [0, 1, 0, 0.6], // Green
      isFilled: true,
      strokeColor: [0.1, 0.1, 0.1, 1],
      strokeWeight: 3,
      isStroked: true,
    })
  );

  polygonConfigs.push(
    WbglPolygonPlot.createSquare({
      center: [0.1, 0.5],
      size: 0.15,
      rotation: Math.PI / 6, // 30 degrees
      isFilled: false, // Stroke only
      isStroked: true,
      strokeColor: [0, 0, 1, 1], // Blue
      strokeWeight: 4,
      scale: [1.5, 1], // Stretched horizontally
    })
  );

  // Circle examples
  polygonConfigs.push(
    WbglPolygonPlot.createCircle({
      center: [0.5, 0.6],
      radius: 0.1,
      fillColor: [1, 0, 1, 0.7], // Magenta
      isFilled: true,
      isStroked: true,
      strokeColor: [0.2, 0.2, 0.2, 1],
      strokeWeight: 1,
    })
  );

  polygonConfigs.push(
    WbglPolygonPlot.createCircle({
      center: [0.8, 0.6],
      radius: 0.07,
      segments: 8, // Octagon
      fillColor: [0.5, 0.5, 1, 0.8], // Light blue
      isFilled: true,
      isStroked: false,
      offset: [0, -0.1],
      enabled: true,
    })
  );

  // A larger, more complex polygon (e.g., a star or custom shape)
  const starPoints = new Float32Array(
    [
      0.0,
      0.3, // Top point
      0.07,
      0.1,
      0.25,
      0.1,
      0.1,
      -0.05,
      0.15,
      -0.25,
      0.0,
      -0.15,
      -0.15,
      -0.25,
      -0.1,
      -0.05,
      -0.25,
      0.1,
      -0.07,
      0.1,
    ].map((p) => p * 0.7)
  ); // Scaled down a bit

  polygonConfigs.push({
    points: starPoints,
    fillColor: [1, 1, 0, 0.7], // Yellow
    isFilled: true,
    strokeColor: [0.5, 0.5, 0, 1],
    strokeWeight: 2,
    isStroked: true,
    offset: [-0.5, -0.4], // Adjusted Y-offset for star
    scale: [1, 1],
  });

  // Initialize Polygons in WbglPolygonPlot
  polygonPlot.initPolygons(polygonConfigs);

  // Create LineConfig for a demo line (e.g., a sine wave)
  const numPoints = 200;
  const sineWavePoints = new Float32Array(numPoints * 2);
  for (let i = 0; i < numPoints; i++) {
    const x = -0.9 + (i / (numPoints - 1)) * 1.8; // X range from -0.9 to 0.9
    const y = Math.sin(x * Math.PI * 2) * 0.2 - 0.7; // Sine wave, scaled and positioned lower
    sineWavePoints[i * 2] = x;
    sineWavePoints[i * 2 + 1] = y;
  }

  const lineConfigs: LineConfig[] = [
    {
      points: sineWavePoints,
      color: [0.2, 0.6, 1, 1], // Light Blue
      thickness: 3,
      // scale, offset, enabled can use defaults
    },
  ];

  // Initialize Lines
  linePlot.initLines(lineConfigs);

  // Render Loop
  function animate() {
    wglp.clear(); // Clear the canvas (background color is set in WebglPlot constructor or default)

    linePlot.draw();
    polygonPlot.draw();

    requestAnimationFrame(animate);
  }

  // Start the animation
  animate();

  // Example of updating a polygon after a delay
  setTimeout(() => {
    if (polygonConfigs.length > 0) {
      polygonPlot.updatePolygonStyle(0, { fillColor: [0, 1, 1, 0.7] }); // Change first polygon's fill to cyan
      polygonPlot.updatePolygonTransform(
        1,
        [1.5, 1.5],
        polygonConfigs[1].offset || [0, 0]
      );
      // polygonConfigs[1].scale = [1.5,1.5]; // also update the source array if we re-init later

      console.log(
        "Updated first polygon style and second polygon transform after 2 seconds."
      );
    }
  }, 2000);
});
