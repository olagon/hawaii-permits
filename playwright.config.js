import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  retries: process.env.CI ? 1 : 0,
  use: { ...devices['Pixel 7'], baseURL: 'http://localhost:4173/ala/', serviceWorkers: 'allow' },
  webServer: { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173/ala/', reuseExistingServer: !process.env.CI, timeout: 60000 },
  projects: [{ name: 'chromium-mobile', use: { ...devices['Pixel 7'] } }],
});
