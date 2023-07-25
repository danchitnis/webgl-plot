import {
  ColorRGBA,
  WebglScatterAcc,
  WebglAux,
  WebglPlot,
  WebglLine,
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

/*const aux = new WebglAux(wglp);

aux.addLine(new W([-1, 0, 1, 0], new ColorRGBA(255, 255, 0, 1)));
aux.addLine(new WebglAux([0, -1, 0, 1], new ColorRGBA(255, 255, 0, 1)));
aux.addLine(new WebglAux([-1, -1, 1, 1], new ColorRGBA(255, 0, 0, 1)));

cursors();*/

const sqSize = 0.01;

const sqAcc = new WebglScatterAcc(wglp, 100);
sqAcc.setSquareSize(sqSize);

let countX = 0;
let countY = 0;

let countColor = 0;

const render = () => {
  // newDataSize shouuld be divisible by MaxSquare
  const newDataSize = 10;

  const pos = Array(newDataSize * 2);
  const colors = Array(newDataSize * 3);

  for (let i = 0; i < newDataSize; i++) {
    countX = countX + sqSize * 2.1;
    countX = countX > 1 ? -1 : countX;
    countY = countX === -1 ? countY + sqSize * 2.1 : countY;
    countY = countY > 1 / screenRatio ? -1 / screenRatio : countY;

    countColor = countColor > 1 ? -1 : countColor + 0.01;

    pos[i * 2] = countX;
    pos[i * 2 + 1] = countY + Math.random() * sqSize * 0.1;

    const rgb = GetMatlabRgb(countColor);
    colors[i * 3] = rgb[0];
    colors[i * 3 + 1] = rgb[1];
    colors[i * 3 + 2] = rgb[2];
  }

  sqAcc.addSquare(new Float32Array(pos), new Uint8Array(colors));
  wglp.clear();
  sqAcc.draw();
  //aux.draw();
  requestAnimationFrame(render);
};

requestAnimationFrame(render);

/*function cursors() {
  const LineCursorX = new WebglAux([0, 0, 0, 0], new ColorRGBA(0, 250, 0, 1));
  const LineCursorY = new WebglAux([0, 0, 0, 0], new ColorRGBA(0, 250, 0, 1));
  aux.addLine(LineCursorX);
  aux.addLine(LineCursorY);

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * devicePixelRatio;
    const y = (e.clientY - rect.top) * devicePixelRatio;

    const xNorm = ((x / canvas.width) * 2 - 1) / wglp.gScaleX;
    const yNorm = ((y / canvas.height) * 2 - 1) / wglp.gScaleY;

    LineCursorX.xy = [xNorm, -1, xNorm, 1];
    LineCursorY.xy = [-1, -yNorm, 1, -yNorm];
  });
}*/

// https://stackoverflow.com/questions/7706339/grayscale-to-red-green-blue-matlab-jet-color-scale
function GetMatlabRgb(ordinal) {
  const triplet = Array([0, 0, 0]);
  triplet[0] = ordinal < 0.0 ? 0 : ordinal >= 0.5 ? 255 : (ordinal / 0.5) * 255;
  triplet[1] =
    ordinal < -0.5
      ? ((ordinal + 1) / 0.5) * 255
      : ordinal > 0.5
      ? 255 - ((ordinal - 0.5) / 0.5) * 255
      : 255;
  triplet[2] = ordinal > 0.0 ? 0 : ordinal <= -0.5 ? 255 : ((ordinal * -1.0) / 0.5) * 255;
  return triplet;
}
