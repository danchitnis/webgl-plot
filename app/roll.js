import { ColorRGBA, WebglPlot, WebglLineRoll } from "../dist/webglplot.esm.mjs";

const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

console.log("canvas.width", canvas.width, "canvas.height", canvas.height);
console.log("devicePixelRatio", devicePixelRatio);

const screenRatio = canvas.width / canvas.height;
console.log("screenRatio", screenRatio);

const wglp = new WebglPlot(canvas);
wglp.gScaleX = 1;
wglp.gScaleY = screenRatio;

const numLines = 100;

const roll = new WebglLineRoll(wglp, canvas.width, numLines);

const y = Array(numLines).fill(0);

for (let i = 0; i < numLines; i++) {
  roll.setLineColor(
    new ColorRGBA(Math.random() * 255, Math.random() * 255, Math.random() * 255, 1),
    i
  );
}

const getNewY = () => {
  for (let i = 0; i < y.length; i++) {
    y[i] = y[i] + (Math.random() - 0.5) * 0.05;
    y[i] = Math.min(Math.max(y[i], -0.9), 0.9);
    //y[i] = Math.sin(Date.now() / 1000 + i);
  }
};

const render = () => {
  getNewY();

  for (let i = 0; i < 10; i++) {
    roll.addPoint(y);
  }
  wglp.clear();
  roll.draw();

  requestAnimationFrame(render);
};

requestAnimationFrame(render);
