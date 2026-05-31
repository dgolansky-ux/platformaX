/**
 * Playwright config — Slice 23 visual evidence tooling.
 *
 * Used by `pnpm screenshots:v2` to drive the dev server and capture
 * desktop + mobile screenshots of the app-v2 routes into
 * `docs/review/visual-v2/slice-23/screenshots/`. The dev server is started
 * automatically; if it cannot bind a port the run reports `ENV_BLOCKED`
 * rather than faking screenshots.
 */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/visual-v2",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    trace: "off",
  },
  webServer: {
    command: "pnpm dev --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        viewport: { width: 1440, height: 1000 },
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
    },
    {
      name: "chromium-mobile",
      use: {
        viewport: { width: 390, height: 844 },
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        isMobile: true,
      },
    },
  ],
});
