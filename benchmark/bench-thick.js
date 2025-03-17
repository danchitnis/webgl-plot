import {
  ColorRGBA,
  WebglPlot,
  WebglLineThick,
  WebglLine,
} from "../dist/webglplot.mjs";

const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

//const numX = canvas.width;

const numX = 1000;

console.log("numX", numX);

const wglp = new WebglPlot(canvas);

let line;
let plotLine;
let newYData = [];

const createLines = () => {
  line = new WebglLine();

  line.setColor(new ColorRGBA(255, 255, 0, 1)); //color not working
  line.lineSpaceX(numX);

  plotLine = new WebglLineThick(wglp, line, 10);
  newYData = Array(line.getSize()).fill(0);
};

createLines(1);

console.log(line.xy);

//console.log("newYData", newYData);

let frame = 0;
let prevTime = new Date();

function newFrame() {
  wglp.clear();

  const array = new Float32Array(numX * 2);

  for (let i = 0; i < 1; i++) {
    const per = window.performance.now() * 0.0005 * numX;
    //const per = 0;
    //const y0 = i / 1 + per;
    for (let j = 0; j < numX; j++) {
      const x = (j / numX) * canvas.width;
      const y = ((j + per) / numX) * canvas.height;

      const yy = y - Math.floor(y / canvas.height) * canvas.height;
      //newYData[j] = yy * 2 - 1;
      //console.log(j, numX, per, y0, y, yy, newYData[j]);
      array[j * 2] = Math.round(x);
      array[j * 2 + 1] = Math.round(yy);
    }
    //line.setYs(newYData);

    //const array = new Float32Array(line.xy);
    /*array.forEach((element, index) => {
      if (index % 2 === 0) array[index] = ((element + 1) / 2) * canvas.width;
      else array[index] = ((-element + 1) / 2) * canvas.height;
    });*/
    plotLine.updateLine(array);
  }

  plotLine.draw();

  const timeNow = new Date();
  if (timeNow - prevTime > 1000) {
    console.log(frame);
    //fpsElem.innerHTML = `Current fps: ${frame}`;
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
