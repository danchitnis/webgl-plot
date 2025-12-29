import { setupCanvasAndWebGL, clearCanvas, WebglLinePlot, WebglLine, ColorRGBA, type LineConfig } from "@lib/webglplot";

const canvas = document.getElementById("my_canvas") as HTMLCanvasElement | null;
const fpsElem = document.getElementById("fps");
const btClick = document.getElementById("btClick");
const inNum = document.getElementById("inNum") as HTMLInputElement | null;

if (!canvas) {
    throw new Error("Canvas element not found");
}

const numX = 1000; // Fixed size to keep buffer work predictable
const gl = setupCanvasAndWebGL(canvas, {
    backgroundColor: [0, 0, 0, 1]
});

let lines: WebglLine[] = [];
let plotLine: WebglLinePlot;
let newYData = new Float32Array(numX);

const baseXY = new Float32Array(numX * 2);
for (let i = 0; i < numX; i++) {
    baseXY[i * 2] = (2 * i) / numX - 1;
    baseXY[i * 2 + 1] = 0;
}

function createLines(num: number) {
    const start = performance.now();

    lines = Array.from({ length: num }, () => new WebglLine());
    lines.forEach((line) => {
        line.setColor(new ColorRGBA(255, 255, 0, 1));
        line.lineSpaceX(numX);
    });

    plotLine = new WebglLinePlot(gl, lines.length);

    const lineConfigs: LineConfig[] = lines.map(() => ({
        points: new Float32Array(baseXY),
        color: [Math.random(), Math.random(), Math.random(), 1],
        thickness: 1,
        scale: [1, 1],
        offset: [0, 0],
        enabled: true,
    }));

    plotLine.initLines(lineConfigs);
    newYData = new Float32Array(numX);

    if (fpsElem) {
        fpsElem.textContent = "FPS: --";
    }

    const elapsed = performance.now() - start;
    console.log(`Created ${num} line(s) in ${elapsed.toFixed(2)} ms`);
}

createLines(1);

let frame = 0;
let prevTime = performance.now();

function newFrame() {
    clearCanvas(gl);

    const t = performance.now() * 0.0001;

    for (let i = 0; i < lines.length; i++) {
        const y0 = i / lines.length + t;
        for (let j = 0; j < numX; j++) {
            const y = y0 + (j * 0.1) / numX;
            const yy = y - Math.floor(y);
            newYData[j] = yy * 2 - 1;
        }
        plotLine.updateLineY(i, newYData);
    }

    plotLine.draw();

    const now = performance.now();
    if (now - prevTime > 1000) {
        if (fpsElem) {
            fpsElem.textContent = `FPS: ${frame}`;
        }
        frame = 0;
        prevTime = now;
    } else {
        frame++;
    }

    requestAnimationFrame(newFrame);
}
requestAnimationFrame(newFrame);

btClick?.addEventListener("click", () => {
    const numLine = parseInt(inNum?.value ?? "1", 10);
    const safeNum = Number.isFinite(numLine) && numLine > 0 ? numLine : 1;
    createLines(safeNum);
});
