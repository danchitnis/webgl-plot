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

const newDataSize = 1;

const roll = new WebglLineRoll(wglp, 500, 1);

const y = Array(newDataSize).fill(0);

/*for (let i = 0; i < 1; i++) {
  roll.setLineColor(
    new ColorRGBA(Math.random() * 255, Math.random() * 255, Math.random() * 255, 1),
    i
  );
}*/
roll.setLineColor(new ColorRGBA(255, 255, 0, 1), 0);

let counter = 0;

const getNewY = () => {
  const x = Math.random();
  //const x = Date.now();
  counter++;
  for (let i = 0; i < y.length; i++) {
    //y[i] = -1 + counter / 50;
    //counter = counter % 100;
    //y[i] = y[i] + (x - 0.5) * 0.05;
    //y[i] = Math.min(Math.max(y[i], -0.9), 0.9);
    y[i] = Math.sin(counter / 10);
  }
};

let frame = 0;
const render = () => {
  if (frame++ % 1 === 0) {
    getNewY();

    //const y2 = Array.from({ length: 10 }, () => y);
    roll.addPoints([y]);
    //roll.addPoint([y[0]]);
    wglp.clear();
    roll.drawOld();
  }
  requestAnimationFrame(render);
  frame++;
};

requestAnimationFrame(render);
