import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'list',
    webServer: {
        command: 'npm run test:html',
        url: 'http://localhost:5175',
        reuseExistingServer: !process.env.CI,
    },
    use: {
        baseURL: 'http://localhost:5175',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
