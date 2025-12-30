import {
    setupCanvasAndWebGL,
    clearCanvas,
    ColorRGBA,
    WebglScatterAcc,
} from "../src/webglplot";

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
if (!canvas) {
    throw new Error("Canvas element not found");
}

const gl = setupCanvasAndWebGL(canvas, {
    powerPerformance: "high-performance",
    backgroundColor: [0, 0, 0, 1],
});

const maxSquares = 1_000_000;
const newDataSize = 1_000;

const scatter = new WebglScatterAcc(gl, maxSquares);
scatter.setSquareSize(0.001);
scatter.setColor(new ColorRGBA(255, 255, 0, 255));
scatter.setScale(1, canvas.width / canvas.height);
scatter.setOffset(0, 0);

function render() {
    // newDataSize should be divisible by maxSquares
    const positions = new Float32Array(
        Array.from({ length: newDataSize * 2 }, () => Math.random() * 2 - 1)
    );
    const colors = new Uint8Array(
        Array.from({ length: newDataSize * 3 }, () => Math.random() * 255)
    );

    scatter.addSquare(positions, colors);
    clearCanvas(gl);
    scatter.draw();

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
