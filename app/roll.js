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

const roll = new WebglLineRoll(wglp, 600);

let y = 0;

const getNewY = () => {
  y = y + (Math.random() - 0.5) * 0.1;
  y = Math.min(Math.max(y, -0.9), 0.9);
  return y;
};

const render = () => {
  roll.addPoint(getNewY());

  wglp.clear();
  roll.draw();

  requestAnimationFrame(render);
};

requestAnimationFrame(render);
