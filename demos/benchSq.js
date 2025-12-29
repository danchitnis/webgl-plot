import { setupCanvasAndWebGL, clearCanvas, ColorRGBA, WebglScatterAcc } from "../dist/webglplot.mjs";

const canvas = document.getElementById("my_canvas");

const maxSquare = 1_000_000;
const newDataSize = 1_000;

const gl = setupCanvasAndWebGL(canvas, { 
  powerPerformance: "high-performance",
  backgroundColor: [0, 0, 0, 1]
});

const sqAcc = new WebglScatterAcc(gl, maxSquare);
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
  clearCanvas(gl);
  sqAcc.draw();
  requestAnimationFrame(render);
};

requestAnimationFrame(render);
