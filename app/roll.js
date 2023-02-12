import {
  ColorRGBA,
  WebglScatterAcc,
  WebglAux,
  WebglPlot,
  WebglAuxLine,
  WebglLineRoll,
} from "../dist/webglplot.esm.mjs";

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

let i = 0;

const render = () => {
  roll.addPoint(Math.sin(i));
  i += 0.01;

  roll.draw();

  requestAnimationFrame(render);
};

requestAnimationFrame(render);
