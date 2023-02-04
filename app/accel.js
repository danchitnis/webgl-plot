import { ColorRGBA, WebglScatterAcc } from "../dist/webglplot.esm.mjs";

const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const sqAcc = new WebglScatterAcc(canvas, 100000);
sqAcc.setSquareSize(0.002);
sqAcc.setColor(new ColorRGBA(1, 1, 0, 1));
sqAcc.setScale(1, canvas.width / canvas.height);
sqAcc.setOffset(0, 0);

//sqAcc.addSquare(new Float32Array([0, 0]));
//sqAcc.addSquare(new Float32Array([0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5]));

const render = () => {
  // newDataSize shouuld be divisible by MaxSquare
  const newDataSize = 1000;
  sqAcc.addSquare(
    new Float32Array(Array.from({ length: newDataSize * 2 }, (_, i) => Math.random() * 2 - 1))
  );
  sqAcc.update();
  requestAnimationFrame(render);
};

requestAnimationFrame(render);
