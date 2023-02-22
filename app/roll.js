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

const numLines = 5;

const roll = new WebglLineRoll(wglp, 100, numLines);

const y = Array(numLines).fill(0);

const getNewY = () => {
  //y = y + (Math.random() - 0.5) * 0.1;
  //y = Math.min(Math.max(y, -0.9), 0.9);
  for (let i = 0; i < y.length; i++) {
    //y[i] = y[i] + (Math.random() - 0.5) * 0.1;
    //y[i] = Math.min(Math.max(y[i], -0.9), 0.9);
    y[i] = Math.sin(Date.now() / 1000 + i);
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
