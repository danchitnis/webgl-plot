import {
  ColorRGBA,
  WebglPlot,
  WebglLineThick,
  WebglLine,
} from "../dist/webglplot";

const fpsElem = document.getElementById("fps");
const btClick = document.getElementById("btClick");
const inNum = document.getElementById("inNum");

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas element not found");
}

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

//const numX = canvas.width;

const numX = 10000;

console.log("numX", numX);

const wglp = new WebglPlot(canvas);

const line = new WebglLine();

line.setColor(new ColorRGBA(255, 255, 0, 1)); //color not working
line.lineSpaceX(numX);

const plotLine = new WebglLineThick(wglp, 10);
//newYData = Array(line.getSize()).fill(0);

//console.log("newYData", newYData);

let frame = 0;
let prevTime = new Date();

const array = new Float32Array(numX * 2);

type Array = {
  points: Float32Array;
  scale: [number, number];
  offset: [number, number];
};

const arrays: Array[] = [];

const maxLines = 5;

for (let i = 0; i < maxLines; i++) {
  //const per = 0;
  //const y0 = i / 1 + per;
  for (let j = 0; j < numX; j++) {
    const x = (j / numX) * canvas!.width;
    const y = (Math.sin(j * 0.005) * 0.2 + 0.5) * canvas!.height;

    //const yy = y - Math.floor(y / canvas!.height) * canvas!.height;
    //newYData[j] = yy * 2 - 1;
    //console.log(j, numX, per, y0, y, yy, newYData[j]);
    array[j * 2] = x;
    array[j * 2 + 1] = y;
  }
  //line.setYs(newYData);

  //const array = new Float32Array(line.xy);
  /*array.forEach((element, index) => {
      if (index % 2 === 0) array[index] = ((element + 1) / 2) * canvas.width;
      else array[index] = ((-element + 1) / 2) * canvas.height;
    });*/
  arrays.push({
    points: new Float32Array(array),
    scale: [1, 1],
    offset: [0, -canvas.height / 2 + (i / (maxLines - 1)) * canvas.height],
  });
}

plotLine.updateLines(arrays);

let offset = 0;

function newFrame() {
  wglp.clear();

  offset = offset + 0.003;
  if (offset > 1) {
    offset = -1;
  }

  for (let i = 0; i < maxLines; i++) {
    const baseOffset =
      -canvas!.height / 2 + (i / (maxLines - 1)) * canvas!.height;
    plotLine.updateLineTransform(
      i,
      [1, 1],
      [0, baseOffset + offset * canvas!.height]
    );
  }

  plotLine.draw();

  const timeNow = new Date();
  if (timeNow.getTime() - prevTime.getTime() > 1000) {
    console.log(frame);
    fpsElem!.innerHTML = `Current fps: ${frame}`;
    frame = 0;
    prevTime = timeNow;
  } else {
    frame++;
  }

  //requestAnimationFrame(newFrame);
}
requestAnimationFrame(newFrame);

btClick!.addEventListener("click", () => {
  const numLine = (inNum as HTMLInputElement).value;
  const timeStart = new Date();
  const timeEnd = new Date();
  console.log(
    `Created ${numLine} in ${
      timeEnd.getTime() - timeStart.getTime()
    } milliseconds`
  );
});
