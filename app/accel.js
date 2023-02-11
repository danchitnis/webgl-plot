import { ColorRGBA, WebglScatterAcc, WebglAux, WebglPlot } from "../dist/webglplot.esm.mjs";

const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const screenRatio = canvas.width / canvas.height;

const wglp = new WebglPlot(canvas);
wglp.gScaleX = 1;
wglp.gScaleY = screenRatio;

const aux = new WebglAux(wglp);
aux.addLine({ xy: [-1, 0, 1, 0], color: new ColorRGBA(255, 255, 0, 1) });
aux.addLine({ xy: [0, -1, 0, 1], color: new ColorRGBA(255, 255, 0, 1) });
aux.addLine({ xy: [-1, -1, 1, 1], color: new ColorRGBA(255, 0, 0, 1) });

const sqSize = 0.01;

const sqAcc = new WebglScatterAcc(wglp, 100);
sqAcc.setSquareSize(sqSize);

let countX = 0;
let countY = 0;

let countColor = 0;

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
  sqAcc.draw();
  aux.drawLines();
  requestAnimationFrame(render);
};

requestAnimationFrame(render);
