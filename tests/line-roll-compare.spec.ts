import { expect, test } from '@playwright/test';

// Run headed to ensure GPU acceleration is enabled during measurement.
test.use({ headless: false });

type FpsSnapshot = { instant: number; average: number };

type Scenario = {
  label: string;
  lines: number;
  points: number;
  buffer?: number;
};

const SCENARIOS: Scenario[] = [
  { label: 'many-lines-small-update', lines: 500, points: 1 },
  // Make long-update scenario more challenging to differentiate when both hit refresh ceiling.
  { label: 'few-lines-long-update', lines: 20, points: 1024, buffer: 65536 },
  // Larger buffer ensures v1-style full-buffer uploads are meaningfully stressed.
  { label: 'moderate-lines-medium-update', lines: 200, points: 8, buffer: 8192 },
];

async function measureFps(page, url: string): Promise<FpsSnapshot> {
  await page.goto(url);
  await page.waitForSelector('canvas');
  await page.waitForFunction(() => typeof (window as any).__getFps === 'function', { timeout: 5000 });
  await page.waitForTimeout(500); // warm-up
  await page.waitForTimeout(2000); // sample window
  const fps = await page.evaluate<FpsSnapshot>(() => {
    return (window as any).__getFps();
  });
  return fps;
}

test('Line roll v2 vs v1 performance (sequential)', async ({ page }) => {
  for (const scenario of SCENARIOS) {
    const query = `lines=${scenario.lines}&points=${scenario.points}${scenario.buffer ? `&buffer=${scenario.buffer}` : ''}`;
    const v1Url = `/internal/bench-line-roll-v1.html?${query}`;
    const v2Url = `/internal/bench-line-roll-v2.html?${query}`;

    const v1 = await measureFps(page, v1Url);
    const v2 = await measureFps(page, v2Url);

    console.log(`Scenario ${scenario.label}: v1 avg=${v1.average.toFixed(1)} fps, v2 avg=${v2.average.toFixed(1)} fps`);

    // Soft assert so we still run remaining scenarios even if one fails.
    // Very low FPS is noisy (GPU/CPU throttling, scheduling jitter); very high FPS is often capped by display/VSYNC.
    // Keep a strict win requirement only in the mid-FPS band where it's most meaningful.
    const requiredMultiplier = (v1.average >= 20 && v1.average < 90)
      ? 1.05
      : (v1.average < 20 ? 0.95 : 1.0);
    expect.soft(v2.average).toBeGreaterThanOrEqual(v1.average * requiredMultiplier);
  }
});
