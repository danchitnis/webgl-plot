import { clearCanvas, setupCanvasAndWebGL, WebglLineThick } from "../src/webglplot";
import { createLiveTypeScriptEditor, functionBodyToTypeScript } from "./live-ts-editor";

type DemoApi = {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    WebglLineThick: typeof WebglLineThick;
    clearCanvas: typeof clearCanvas;
};

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Canvas element not found");

const editorHost = document.getElementById("tsEditor") as HTMLDivElement | null;
if (!editorHost) throw new Error("Editor host element not found");

const statusEl = document.getElementById("runStatus") as HTMLSpanElement | null;
if (!statusEl) throw new Error("Status element not found");

const gl = setupCanvasAndWebGL(canvas, {
    backgroundColor: [0, 0, 0, 1],
    antialias: true,
});

if (!(gl instanceof WebGL2RenderingContext)) {
    throw new Error("This demo requires WebGL2");
}

const api: DemoApi = { canvas, gl, WebglLineThick, clearCanvas };

function defaultDemo(api: DemoApi) {
    const plotLine = new api.WebglLineThick(api.gl, 1);

    // 45-degree line with 100 points from 0.1 to 1.0
    const numPoints = 100;
    const points = new Float32Array(numPoints * 2);

    for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);
        const value = 0.1 + t * (1.0 - 0.1);
        points[i * 2] = value;
        points[i * 2 + 1] = value;
    }

    plotLine.initLines([
        {
            points,
            scale: [1, 1],
            offset: [0, 0],
            color: [0, 1, 0, 1],
            thickness: 15,
        },
    ]);

    api.clearCanvas(api.gl);
    plotLine.draw();
}

const DEFAULT_TS =
    "// Runs on every edit (debounced).\n" +
    "// Available as globals: api.canvas, api.gl, api.WebglLineThick, api.clearCanvas\n\n" +
    functionBodyToTypeScript(defaultDemo);

createLiveTypeScriptEditor({
    editorParent: editorHost,
    statusEl,
    api,
    initialTypeScript: DEFAULT_TS,
});
