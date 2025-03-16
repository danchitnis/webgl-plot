import { WebglPlot, ColorRGBA, WebglScatterAcc } from "../dist/webglplot.mjs";

const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const maxSquare = 1_000_000;
const newDataSize = 1_000;

const wglp = new WebglPlot(canvas, { powerPerformance: "high-performance" });

const sqAcc = new WebglScatterAcc(wglp, maxSquare);
sqAcc.setSquareSize(0.001);
sqAcc.setColor(new ColorRGBA(255, 255, 0, 255));
sqAcc.setScale(1, canvas.width / canvas.height);
sqAcc.setOffset(0, 0);

const render = () => {
  // newDataSize shouuld be divisible by maxSquare

  const sqPos = new Float32Array(
    Array.from({ length: newDataSize * 2 }, () => Math.random() * 2 - 1)
  );
  const sqColor = new Uint8Array(
    Array.from({ length: newDataSize * 3 }, () => Math.random() * 255)
  );
  sqAcc.addSquare(sqPos, sqColor);
  wglp.clear();
  sqAcc.draw();
  requestAnimationFrame(render);
};

requestAnimationFrame(render);
