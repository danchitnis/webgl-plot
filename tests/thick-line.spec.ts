import { test, expect } from '@playwright/test';

type MeasureParams = {
    orientation: 'horizontal' | 'vertical';
    scaleX: number;
    scaleY: number;
    thickness?: number;
};

// Measures line thickness in pixels by scanning perpendicular to the line's axis.
async function renderAndMeasure(page: import('@playwright/test').Page, params: MeasureParams) {
    const { orientation, scaleX, scaleY, thickness = 16 } = params;
    return page.evaluate(({ orientation, scaleX, scaleY, thickness }: MeasureParams) => {
        // Expect plotLineThick to be exposed by bench-thick-improvements.ts
        const plot = (window as any).plotLineThick;
        if (!plot) throw new Error('plotLineThick missing on window');
        const canvas = document.getElementById('my_canvas') as HTMLCanvasElement | null;
        if (!canvas) throw new Error('canvas missing');

        const gl: WebGL2RenderingContext | null = (plot as any).gl || canvas.getContext('webgl2');
        if (!gl) throw new Error('gl missing');

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const isHorizontal = orientation === 'horizontal';
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

        function longestRun(buffer: Uint8Array, length: number, channelIndex: number) {
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
    }, { orientation, scaleX, scaleY, thickness });
}

// Run headed to ensure GPU rendering path.
test.use({ headless: false });

test.describe('Thick line thickness invariance', () => {


    test.beforeEach(async ({ page }: { page: import('@playwright/test').Page }) => {
        await page.goto('/bench-thick-improvements.html');
        await page.waitForSelector('#my_canvas');
        await page.waitForFunction(() => !!(window as any).plotLineThick);
    });

    test('thickness stays constant under anisotropic zoom', async ({ page }: { page: import('@playwright/test').Page }) => {
        const baselineH = await renderAndMeasure(page, { orientation: 'horizontal', scaleX: 1, scaleY: 1 });
        const baselineV = await renderAndMeasure(page, { orientation: 'vertical', scaleX: 1, scaleY: 1 });

        const zoomXH = await renderAndMeasure(page, { orientation: 'horizontal', scaleX: 5, scaleY: 1 });
        const zoomXV = await renderAndMeasure(page, { orientation: 'vertical', scaleX: 5, scaleY: 1 });

        const zoomYH = await renderAndMeasure(page, { orientation: 'horizontal', scaleX: 1, scaleY: 5 });
        const zoomYV = await renderAndMeasure(page, { orientation: 'vertical', scaleX: 1, scaleY: 5 });

        expect(zoomXH).toBe(baselineH);
        expect(zoomXV).toBe(baselineV);
        expect(zoomYH).toBe(baselineH);
        expect(zoomYV).toBe(baselineV);
        await page.waitForTimeout(3000);
    });
});
