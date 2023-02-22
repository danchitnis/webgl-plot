import { ColorRGBA, WebglPlot, WebglLineRoll } from "../dist/webglplot.esm.mjs";

const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

console.log("devicePixelRatio", devicePixelRatio);

const screenRatio = canvas.width / canvas.height;
console.log("screenRatio", screenRatio);

const wglp = new WebglPlot(canvas);
wglp.gScaleX = 1;
wglp.gScaleY = screenRatio;

const numLines = 1000;

const roll = new WebglLineRoll(wglp, 1920, numLines);

const y = Array(numLines).fill(0);

const colors = [];
for (let i = 0; i < numLines; i++) {
  colors.push(new ColorRGBA(Math.random(), Math.random(), Math.random(), 1));
}
roll.setColors(colors);

const getNewY = () => {
  for (let i = 0; i < y.length; i++) {
    y[i] = y[i] + (Math.random() - 0.5) * 0.05;
    y[i] = Math.min(Math.max(y[i], -0.9), 0.9);
    //y[i] = Math.sin(Date.now() / 1000 + i);
  }
};

const render = () => {
  getNewY();
  roll.addPoint(y);

  wglp.clear();
  roll.draw();

  requestAnimationFrame(render);
};

requestAnimationFrame(render);
