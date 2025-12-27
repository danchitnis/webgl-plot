/* global require */
const { chromium } = require("playwright");

// Render a single line (horizontal or vertical) with a given transform and measure its pixel thickness.
async function renderAndMeasure(
  page,
  { orientation, scaleX, scaleY, thickness = 16 }
) {
  return page.evaluate(
    ({ orientation, scaleX, scaleY, thickness }) => {
      const plot = window.plotLineThick;
      if (!plot) throw new Error("plotLineThick missing");
      const gl =
        plot.gl || document.getElementById("my_canvas").getContext("webgl2");

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const isHorizontal = orientation === "horizontal";
      const points = isHorizontal
        ? new Float32Array([-0.8, 0, 0.8, 0])
        : new Float32Array([0, -0.8, 0, 0.8]);
      const color = isHorizontal ? [1, 0, 0, 1] : [0, 1, 0, 1];

      plot.initLines([{ points, color, thickness }]);
      plot.setGlobalTransform([scaleX, scaleY], [0, 0]);
      plot.draw();

      const width = gl.canvas.width;
      const height = gl.canvas.height;
      gl.finish();

      function longestRun(buffer, length, channelIndex) {
        let best = 0;
        let current = 0;
        for (let i = 0; i < length; i++) {
          const v = buffer[i * 4 + channelIndex];
          if (v > 10) {
            current++;
            if (current > best) best = current;
          } else {
            current = 0;
          }
        }
        return best;
      }

      if (isHorizontal) {
        const x = Math.floor(width * 0.5);
        const col = new Uint8Array(height * 4);
        gl.readPixels(x, 0, 1, height, gl.RGBA, gl.UNSIGNED_BYTE, col);
        return longestRun(col, height, 0); // red channel
      }

      const y = Math.floor(height * 0.5);
      const row = new Uint8Array(width * 4);
      gl.readPixels(0, y, width, 1, gl.RGBA, gl.UNSIGNED_BYTE, row);
      return longestRun(row, width, 1); // green channel
    },
    { orientation, scaleX, scaleY, thickness }
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  await page.goto("http://localhost:5175/bench-thick-improvements.html");
  await page.waitForSelector("#my_canvas");
  await page.waitForFunction(() => !!window.plotLineThick);

  const baselineH = await renderAndMeasure(page, {
    orientation: "horizontal",
    scaleX: 1,
    scaleY: 1,
  });
  const baselineV = await renderAndMeasure(page, {
    orientation: "vertical",
    scaleX: 1,
    scaleY: 1,
  });

  const zoomXH = await renderAndMeasure(page, {
    orientation: "horizontal",
    scaleX: 5,
    scaleY: 1,
  });
  const zoomXV = await renderAndMeasure(page, {
    orientation: "vertical",
    scaleX: 5,
    scaleY: 1,
  });

  const zoomYH = await renderAndMeasure(page, {
    orientation: "horizontal",
    scaleX: 1,
    scaleY: 5,
  });
  const zoomYV = await renderAndMeasure(page, {
    orientation: "vertical",
    scaleX: 1,
    scaleY: 5,
  });

  function assertClose(label, a, b, tol = 1) {
    if (Math.abs(a - b) > tol) {
      throw new Error(`${label} expected ${a} +/-${tol} but got ${b}`);
    }
  }

  assertClose("zoomX horizontal thickness", baselineH, zoomXH);
  assertClose("zoomX vertical thickness", baselineV, zoomXV);
  assertClose("zoomY horizontal thickness", baselineH, zoomYH);
  assertClose("zoomY vertical thickness", baselineV, zoomYV);

  const result = { baselineH, baselineV, zoomXH, zoomXV, zoomYH, zoomYV };
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
