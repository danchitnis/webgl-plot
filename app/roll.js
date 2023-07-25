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

const numLines = 10; //7500 max on 4090

const newDataSize = 1;

const roll = new WebglLineRoll(wglp, canvas.width, numLines);

for (let i = 0; i < numLines; i++) {
  roll.setLineColor(
    new ColorRGBA(Math.random() * 255, Math.random() * 255, Math.random() * 255, 1),
    i
  );
}
//roll.setLineColor(new ColorRGBA(255, 255, 0, 1), 0);

let counter = 0;

const getNewY = (k) => {
  const y = Array(newDataSize).fill(0);
  counter++;

  for (let i = 0; i < y.length; i++) {
    //y[i] = -1 + counter / 50;
    //counter = counter % 100;
    //y[i] = y[i] + (x - 0.5) * 0.05;
    //y[i] = Math.min(Math.max(y[i], -0.9), 0.9);
    y[i] = Math.sin(counter / ((numLines * 1000) / newDataSize) + k / 10);
    //counter++;
  }
  return y;
};

const render = () => {
  //roll.addPoints([getNewY(0), getNewY(5), getNewY(10)]);

  const ys = Array(numLines).fill(0);
  //const counterOld = counter;
  for (let i = 0; i < numLines; i++) {
    ys[i] = getNewY(i * 5);
  }
  //counter = counterOld + newDataSize;
  roll.addPoints(ys);

  wglp.clear();
  roll.draw();

  requestAnimationFrame(render);
};

requestAnimationFrame(render);
