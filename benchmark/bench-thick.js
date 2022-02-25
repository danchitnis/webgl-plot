import { WebglPlot, ColorRGBA, WebglThickLine } from "../dist/webglplot.esm.js";

const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const numX = canvas.width;

const wglp = new WebglPlot(canvas, { powerPerformance: "high-performance" });

const createLines = (num) => {
  wglp.removeAllLines();
  for (let i = 0; i < num; i++) {
    const color = new ColorRGBA(Math.random(), Math.random(), Math.random(), 1);
    const thickLine = new WebglThickLine(color, numX, 0.01);
    thickLine.lineSpaceX(-1, 2 / numX);
    thickLine.offsetY = (i - Math.floor(num / 2)) / num;
    wglp.addThickLine(thickLine);
  }
};

createLines(1);

let frame = 0;
let prevTime = new Date();

const newFrame = () => {
  //const timeStrat = +new Date();
  update();
  wglp.update();
  const timeNow = new Date();
  if (timeNow - prevTime > 1000) {
    console.log(frame);
    frame = 0;
    prevTime = timeNow;
  } else {
    frame++;
  }

  requestAnimationFrame(newFrame);
};
requestAnimationFrame(newFrame);

const update = () => {
  const freq = 0.001;
  const amp = 0.5;
  const noise = 0.01;

  let yFinal = new Float32Array(numX);

  for (let i = 0; i < yFinal.length; i++) {
    const ySin = Math.sin(Math.PI * i * freq * Math.PI * 2);
    const yNoise = Math.random() - 0.5;
    yFinal[i] = ySin * amp + yNoise * noise;
  }
  //console.log(yFinal);

  wglp.thickLines.forEach((line) => {
    for (let i = 0; i < yFinal.length; i++) {
      line.setY(i, yFinal[i]);
    }
  });
};

const btClick = document.getElementById("btClick");
const inNum = document.getElementById("inNum");
btClick.addEventListener("click", () => {
  const numLine = inNum.value;
  const timeStart = new Date();
  createLines(numLine);
  const timeEnd = new Date();
  console.log(`Created ${numLine} in ${timeEnd - timeStart} milliseconds`);
});
