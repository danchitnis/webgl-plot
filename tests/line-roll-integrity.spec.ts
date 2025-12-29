import { expect, test } from '@playwright/test';

// Run headed to ensure GPU rendering path.
test.use({ headless: false });

type Analysis = {
  width: number;
  height: number;
  r2: number;
  slope: number;
  intercept: number;
  sampleCount: number;
  varY: number;
  bgLumMid: number;
  bgLumCorner: number;
  clearColor: [number, number, number, number];
  darkPixelCount: number;
};

type WaveStats = { min: number; max: number };
type VertexStats = { minY: number; maxY: number; firstYs: number[] };

test('LineRoll v2 integrity (single line, no wrap chord)', async ({ page }, testInfo) => {
  await page.goto('/internal/bench-line-roll-integrity-v2.html');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Let it run long enough to wrap multiple times.
  await page.waitForFunction(() => typeof (window as any).__analyzeLine === 'function');
  await page.waitForFunction(() => typeof (window as any).__getFrameCount === 'function');
  await page.waitForFunction(() => (window as any).__getFrameCount() > 30, { timeout: 5000 });
  await page.waitForTimeout(500);

  // Always attach a screenshot for debugging/reporting.
  const shot = await canvas.screenshot();
  await testInfo.attach('canvas', { body: shot, contentType: 'image/png' });

  const analysis = await page.evaluate<Analysis>(() => (window as any).__analyzeLine());
  const wave = await page.evaluate<WaveStats>(() => (window as any).__getWaveStats());
  const vtx = await page.evaluate<VertexStats>(() => (window as any).__debugVertexStats());
  console.log(`Wave stats: [${wave.min.toFixed(3)}, ${wave.max.toFixed(3)}]`);
  console.log(`Vertex Y stats: [${vtx.minY.toFixed(3)}, ${vtx.maxY.toFixed(3)}], firstYs=${vtx.firstYs.map(v => v.toFixed(3)).join(',')}`);
  console.log(
    `Integrity analysis: r2=${analysis.r2.toFixed(4)} varY=${analysis.varY.toFixed(2)} samples=${analysis.sampleCount} ` +
      `bgMid=${analysis.bgLumMid} bgCorner=${analysis.bgLumCorner} clear=${analysis.clearColor.map(v => v.toFixed(2)).join(',')} darkPixels=${analysis.darkPixelCount}`
  );

  // If an unintended long straight chord is present, the per-column "darkest pixel" path
  // tends to become almost perfectly linear, yielding a very high R^2.
  // With the intended multi-cycle sine wave, R^2 should be much lower.
  expect(analysis.sampleCount).toBeGreaterThan(50);
  expect(analysis.r2).toBeLessThan(0.9);
});
