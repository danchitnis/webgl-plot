import { expect, test, type Page, type TestInfo } from '@playwright/test';
import * as fs from 'node:fs/promises';

// Run headed so the GPU is actually exercised.
test.use({ headless: false });

type FpsSnapshot = { instant: number; average: number };

type CapacitySample = { lines: number; fps: number };

type CapacityResultCase = {
  label: string;
  buffer: number;
  points: number;
  targetFps: number;
  maxLines: number;
  samples: CapacitySample[];
};

type CapacityResults = {
  info: Record<string, unknown>;
  cases: CapacityResultCase[];
};

type CapacityCase = {
  label: string;
  buffer: number;
  points: number;
  targetFps: number;
  maxLinesCap: number;
};

async function measureFps(page: Page, url: string): Promise<FpsSnapshot> {
  await page.goto(url);
  await page.waitForSelector('canvas');
  await page.waitForFunction(() => typeof (window as any).__getFps === 'function', { timeout: 5000 });
  await page.waitForFunction(() => typeof (window as any).__resetFps === 'function', { timeout: 5000 });

  // Warmup
  await page.waitForTimeout(500);
  await page.evaluate(() => (window as any).__resetFps());

  // Sample window
  await page.waitForTimeout(2000);
  const fps = await page.evaluate<FpsSnapshot>(() => (window as any).__getFps());
  return fps;
}

async function getWebGLInfo(page: Page): Promise<Record<string, unknown>> {
  await page.waitForFunction(() => typeof (window as any).__getWebGLInfo === 'function', { timeout: 5000 });
  return await page.evaluate(() => (window as any).__getWebGLInfo());
}

function format(n: number) {
  return Number.isFinite(n) ? n.toFixed(1) : String(n);
}

async function findMaxLinesForTarget(
  page: Page,
  opts: { buffer: number; points: number; targetFps: number; maxLinesCap: number }
): Promise<{ maxLines: number; samples: CapacitySample[] }> {
  const { buffer, points, targetFps, maxLinesCap } = opts;

  const samples: CapacitySample[] = [];

  // Exponential search
  let lo = 1;
  let hi = 1;
  while (hi < maxLinesCap) {
    const url = `/benchmarks/bench-line-roll-capacity-v2.html?lines=${hi}&points=${points}&buffer=${buffer}`;
    const fps = await measureFps(page, url);
    samples.push({ lines: hi, fps: fps.average });

    if (fps.average < targetFps) {
      break;
    }
    lo = hi;
    hi = Math.min(maxLinesCap, hi * 2);
  }

  // If even max cap passes, return cap.
  if (hi === maxLinesCap) {
    const last = samples[samples.length - 1];
    if (last && last.fps >= targetFps) {
      return { maxLines: maxLinesCap, samples };
    }
  }

  // Binary search between lo (pass) and hi (fail). If hi==lo it means it already failed at 1.
  let left = lo;
  let right = hi;
  while (right - left > 1) {
    const mid = Math.floor((left + right) / 2);
    const url = `/benchmarks/bench-line-roll-capacity-v2.html?lines=${mid}&points=${points}&buffer=${buffer}`;
    const fps = await measureFps(page, url);
    samples.push({ lines: mid, fps: fps.average });

    if (fps.average >= targetFps) {
      left = mid;
    } else {
      right = mid;
    }
  }

  return { maxLines: left, samples };
}

test('LineRoll v2 capacity benchmark (hardware dependent)', async ({ page }, testInfo) => {
  test.setTimeout(10 * 60 * 1000);

  // Load once to read info.
  await page.goto('/benchmarks/bench-line-roll-capacity-v2.html?lines=1&points=1&buffer=2048');
  const info = await getWebGLInfo(page);
  console.log('WebGL info:', info);

  const cases: CapacityCase[] = [
    { label: 'tiny-update', buffer: 8192, points: 1, targetFps: 55, maxLinesCap: 5000 },
    { label: 'small-batch', buffer: 8192, points: 8, targetFps: 55, maxLinesCap: 5000 },
    { label: 'medium-batch', buffer: 8192, points: 32, targetFps: 55, maxLinesCap: 5000 },
    { label: 'large-history', buffer: 65536, points: 8, targetFps: 55, maxLinesCap: 5000 },
  ];

  const results: CapacityResults = {
    info,
    cases: [],
  };

  for (const c of cases) {
    console.log(`\nCase ${c.label}: buffer=${c.buffer} points=${c.points} target=${c.targetFps}fps`);
    const r = await findMaxLinesForTarget(page, c);
    // Sort samples by line count for readability.
    r.samples.sort((a, b) => a.lines - b.lines);

    console.log(`  maxLines @>=${c.targetFps}fps: ${r.maxLines}`);
    for (const s of r.samples) {
      console.log(`    lines=${s.lines} avgFps=${format(s.fps)}`);
    }

    results.cases.push({
      label: c.label,
      buffer: c.buffer,
      points: c.points,
      targetFps: c.targetFps,
      maxLines: r.maxLines,
      samples: r.samples,
    });

    // Basic sanity: we should get a numeric fps for at least one sample.
    expect(r.samples.length).toBeGreaterThan(0);
    expect(Number.isFinite(r.samples[0].fps)).toBeTruthy();
  }

  const resultsJson = JSON.stringify(results, null, 2);

  // Always persist results to disk (works with any reporter).
  const outPath = (testInfo as TestInfo).outputPath('capacity-results.json');
  await fs.writeFile(outPath, resultsJson, 'utf-8');
  console.log('Capacity results written to:', outPath);

  // Also attach for HTML/reporters that display attachments.
  await (testInfo as TestInfo).attach('capacity-results.json', {
    body: Buffer.from(resultsJson, 'utf-8'),
    contentType: 'application/json',
  });
});
