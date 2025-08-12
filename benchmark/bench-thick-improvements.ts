import { WebglPlot, WebglLineThick, LineConfig } from "../src/webglplot";

const fpsElem = document.getElementById("fps");
const statusElem = document.getElementById("status");

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas element not found");
}

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const wglp = new WebglPlot(canvas);
const plotLine = new WebglLineThick(wglp, 10);

let frameCount = 0;
let lastTime = performance.now();

function updateFPS() {
  const now = performance.now();
  frameCount++;
  
  if (now - lastTime >= 1000) {
    if (fpsElem) fpsElem.innerHTML = `FPS: ${frameCount}`;
    frameCount = 0;
    lastTime = now;
  }
}

// Test 1: High-density sine waves with different frequencies
function testHighDensitySine() {
  const numPoints = 2000; // Very high density
  const lines: LineConfig[] = [];
  
  for (let lineId = 0; lineId < 5; lineId++) {
    const points = new Float32Array(numPoints * 2);
    const frequency = 0.02 + lineId * 0.01; // Different frequencies
    const amplitude = 0.15;
    const offset = -0.6 + lineId * 0.3;
    
    for (let i = 0; i < numPoints; i++) {
      const x = -1 + (2 * i) / (numPoints - 1);
      const y = Math.sin(i * frequency * 10) * amplitude + offset;
      
      points[i * 2] = x;
      points[i * 2 + 1] = y;
    }
    
    lines.push({
      points,
      color: [Math.random(), Math.random(), Math.random(), 1],
      thickness: 8 + lineId * 2, // Varying thickness
    });
  }
  
  plotLine.initLines(lines);
  if (statusElem) statusElem.innerHTML = 'Status: High-density sine waves loaded';
}

// Test 2: Sharp angles that previously caused thickness issues
function testSharpAngles() {
  const lines: LineConfig[] = [];
  
  // Create zigzag pattern with very sharp angles
  const points1 = new Float32Array(20 * 2);
  for (let i = 0; i < 10; i++) {
    const x = -0.8 + (i * 0.16);
    points1[i * 4] = x;
    points1[i * 4 + 1] = i % 2 === 0 ? 0.3 : -0.3;
    points1[i * 4 + 2] = x + 0.08;
    points1[i * 4 + 3] = i % 2 === 0 ? -0.3 : 0.3;
  }
  
  // Create spiral with varying angles
  const points2 = new Float32Array(100 * 2);
  for (let i = 0; i < 100; i++) {
    const angle = (i / 100) * Math.PI * 8;
    const radius = 0.4 * (1 - i / 100);
    points2[i * 2] = Math.cos(angle) * radius;
    points2[i * 2 + 1] = Math.sin(angle) * radius + 0.5;
  }
  
  lines.push(
    { points: points1, color: [1, 0.2, 0.2, 1], thickness: 12 },
    { points: points2, color: [0.2, 1, 0.2, 1], thickness: 8 }
  );
  
  plotLine.initLines(lines);
  if (statusElem) statusElem.innerHTML = 'Status: Sharp angles test loaded';
}

// Test 3: Straight lines at various angles to check for gaps
function testStraightLines() {
  const lines: LineConfig[] = [];
  
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI;
    const length = 0.7;
    const points = new Float32Array(100 * 2); // High density straight line
    
    for (let j = 0; j < 100; j++) {
      const t = (j / 99) * length;
      points[j * 2] = Math.cos(angle) * t;
      points[j * 2 + 1] = Math.sin(angle) * t;
    }
    
    lines.push({
      points,
      color: [Math.random(), Math.random(), Math.random(), 1],
      thickness: 6,
    });
  }
  
  plotLine.initLines(lines);
  if (statusElem) statusElem.innerHTML = 'Status: Straight lines test loaded';
}

// Test 4: Lines with varying thickness to check consistency
function testVaryingThickness() {
  const numPoints = 500;
  const lines: LineConfig[] = [];
  
  for (let lineId = 0; lineId < 6; lineId++) {
    const points = new Float32Array(numPoints * 2);
    const frequency = 0.01 + lineId * 0.005;
    const yOffset = -0.75 + lineId * 0.25;
    
    for (let i = 0; i < numPoints; i++) {
      const x = -1 + (2 * i) / (numPoints - 1);
      const y = Math.sin(i * frequency * 20) * 0.1 + yOffset;
      
      points[i * 2] = x;
      points[i * 2 + 1] = y;
    }
    
    lines.push({
      points,
      color: [0.2 + lineId * 0.15, 0.8, 1 - lineId * 0.15, 1],
      thickness: 2 + lineId * 4, // 2, 6, 10, 14, 18, 22
    });
  }
  
  plotLine.initLines(lines);
  if (statusElem) statusElem.innerHTML = 'Status: Varying thickness test loaded';
}

function animate() {
  wglp.clear();
  plotLine.draw();
  updateFPS();
  requestAnimationFrame(animate);
}

// Add controls to the page
const controlsContainer = document.createElement('div');
controlsContainer.innerHTML = `
  <div style="margin: 10px 0; color: white;">
    <button onclick="testHighDensitySine()" style="margin: 5px; padding: 8px 12px; background: #555; color: white; border: none; cursor: pointer;">High-Density Sine Waves</button>
    <button onclick="testSharpAngles()" style="margin: 5px; padding: 8px 12px; background: #555; color: white; border: none; cursor: pointer;">Sharp Angles Test</button>
    <button onclick="testStraightLines()" style="margin: 5px; padding: 8px 12px; background: #555; color: white; border: none; cursor: pointer;">Straight Lines Test</button>
    <button onclick="testVaryingThickness()" style="margin: 5px; padding: 8px 12px; background: #555; color: white; border: none; cursor: pointer;">Varying Thickness</button>
  </div>
`;

// Add controls before the canvas
canvas.parentNode?.insertBefore(controlsContainer, canvas);

// Make functions available globally
(window as any).testHighDensitySine = testHighDensitySine;
(window as any).testSharpAngles = testSharpAngles;
(window as any).testStraightLines = testStraightLines;
(window as any).testVaryingThickness = testVaryingThickness;

// Start with high-density sine wave test
testHighDensitySine();
animate();

if (statusElem) statusElem.innerHTML = 'Status: Ready - Use buttons to test different scenarios';