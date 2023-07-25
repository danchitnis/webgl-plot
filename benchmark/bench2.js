import {
  ColorRGBA,
  WebglPlot,
  WebglLinePlot,
  WebglAux,
  WebglLine,
} from "../dist/webglplot.esm.mjs";

const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const numX = canvas.width;

console.log("numX", numX);

const wglp = new WebglPlot(canvas);

let lines = [];
let plotLine;
let newYData = [];

const createLines = (num) => {
  lines = Array.from({ length: num }, () => new WebglLine());
  lines.forEach((line) => {
    line.setColor(new ColorRGBA(255, 255, 0, 1)); //color not working
    line.lineSpaceX(numX);
  });

  plotLine = new WebglLinePlot(wglp, lines);
  newYData = Array(lines[0].getSize()).fill(0);
}

createLines(1);





let frame = 0;
let prevTime = new Date();


function newFrame() {
  wglp.clear();

  for (let i = 0; i < lines.length; i++) {
    
    const y0 = (i / lines.length) + (window.performance.now() * 0.0001)
    for (let j = 0; j < numX; j++) {
      const y = y0 + j * 0.1 / numX;
      const yy = y - Math.floor(y);
      newYData[j] = yy * 2 - 1;

    }
    lines[i].setYs(newYData);
    plotLine.updateLine(i);
  }

  plotLine.draw();



  const timeNow = new Date();
  if (timeNow - prevTime > 1000) {
    console.log(frame);
    fpsElem.innerHTML = `Current fps: ${frame}`
    frame = 0;
    prevTime = timeNow;
  } else {
    frame++;
  }

  requestAnimationFrame(newFrame);
}
requestAnimationFrame(newFrame);


const fpsElem = document.getElementById("fps");
const btClick = document.getElementById("btClick");
const inNum = document.getElementById("inNum");
btClick.addEventListener("click", () => {
  const numLine = inNum.value;
  const timeStart = new Date();
  createLines(numLine);
  const timeEnd = new Date();
  console.log(`Created ${numLine} in ${timeEnd - timeStart} milliseconds`);
});




