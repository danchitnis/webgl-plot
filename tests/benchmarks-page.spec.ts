import { expect, test } from '@playwright/test';

type BenchmarkLink = {
  href: string;
  title: string;
};

const WAIT_AFTER_LOAD_MS = 500;

test.describe.serial('WebGL Plot benchmarks', () => {
  test('all benchmark pages load without runtime errors', async ({ page }) => {
    const errorLog: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        const text = message.text();
        errorLog.push(`console: ${text}`);
        console.log(`[console error] ${text}`);
      }
    });

    page.on('pageerror', (error) => {
      errorLog.push(`pageerror: ${error.message}`);
      console.log(`[pageerror] ${error.message}`);
    });

    await page.goto('/index.html');

    const benchmarks = await page.$$eval('.benchmark-link', (anchors) =>
      anchors.map((anchor) => {
        const href = anchor.getAttribute('href') || '';
        const title =
          anchor.parentElement?.querySelector('.benchmark-title')?.textContent?.trim() ||
          anchor.textContent?.trim() ||
          href;
        return { href, title } as BenchmarkLink;
      })
    );

    expect(benchmarks.length).toBeGreaterThan(0);
    console.log(`Discovered ${benchmarks.length} benchmark entries`);

    for (const benchmark of benchmarks) {
      await test.step(`Check ${benchmark.title}`, async () => {
        const cleanHref = benchmark.href.replace(/^\.\//, '');
        const preErrorCount = errorLog.length;
        console.log(`Opening ${cleanHref}`);

        await page.goto(`/${cleanHref}`);

        await page.waitForSelector('canvas', { timeout: 7000 });

        const renderInfo = await page.evaluate(() => {
          const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
          const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
          return {
            hasCanvas: !!canvas,
            canvasId: canvas?.id || '',
            glReady: !!gl,
            size: canvas ? [canvas.width, canvas.height] : null,
          };
        });

        expect(renderInfo.hasCanvas).toBe(true);
        expect(renderInfo.glReady).toBe(true);

        await page.waitForTimeout(WAIT_AFTER_LOAD_MS);

        const newErrors = errorLog.slice(preErrorCount);
        expect(newErrors).toEqual([]);

        console.log(
          `[PASS] ${benchmark.title} (href: ${cleanHref}) canvas=${renderInfo.canvasId || 'unnamed'} size=${renderInfo.size?.join('x') ?? 'unknown'}`
        );
      });
    }
  });
});
