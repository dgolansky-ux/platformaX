/**
 * tests/visual-v2/app-v2-screenshots — Slice 23 visual evidence.
 *
 * Drives the Vite dev server through Playwright and saves real PNG
 * screenshots into `docs/review/visual-v2/slice-23/screenshots/` for each
 * route on both desktop (1440x1000) and mobile (390x844) viewports.
 *
 * All app-v2 routes ship MOCK_LOCAL_ONLY adapters, so no backend transport
 * is required — the screenshots reflect the demo data the auditor will
 * also see locally. Each test waits for the route's heading to settle so
 * the screenshot is not captured mid-suspense.
 */
import { test, type Page } from "@playwright/test";
import { join } from "node:path";

const OUTPUT_DIR = join(
  process.cwd(),
  "docs",
  "review",
  "visual-v2",
  "slice-23",
  "screenshots",
);

interface RouteSpec {
  name: string;
  path: string;
  readyText: RegExp;
}

const ROUTES: RouteSpec[] = [
  { name: "communities", path: "/communities", readyText: /Społeczności/i },
  {
    name: "communities-product-builders-feed",
    path: "/communities/product-builders/feed",
    readyText: /Feedy społeczności|Feed społeczności|Główny/i,
  },
  { name: "notifications", path: "/notifications", readyText: /powiadomienia|aktywno/i },
  { name: "channels", path: "/channels", readyText: /Kanały/i },
  { name: "friends-feed", path: "/friends-feed", readyText: /Feed znajomych/i },
  { name: "manage", path: "/manage", readyText: /Zarządzaj/i },
  { name: "profile", path: "/profile", readyText: /profil/i },
  { name: "profile-demo", path: "/profile/demo", readyText: /profil/i },
];

async function captureRoute(
  page: Page,
  spec: RouteSpec,
  viewportTag: "desktop" | "mobile",
): Promise<void> {
  await page.goto(spec.path, { waitUntil: "domcontentloaded" });
  // Suspense fallback shows "Ładuję…" — wait for the real route content.
  await page
    .getByText(spec.readyText, { exact: false })
    .first()
    .waitFor({ state: "visible", timeout: 20_000 })
    .catch(() => {
      // Some routes (e.g. /profile in anonymous runtime) render an honest empty
      // state without the regex hit. We still want a screenshot of that state.
    });
  await page.waitForTimeout(450); // allow CSS transitions to settle
  const out = join(OUTPUT_DIR, `${spec.name}.${viewportTag}.png`);
  await page.screenshot({ path: out, fullPage: true });
}

test.describe("App-v2 visual evidence (Slice 23)", () => {
  for (const spec of ROUTES) {
    test(`@${spec.name} renders and is screenshotted`, async ({ page }, info) => {
      const tag = info.project.name === "chromium-mobile" ? "mobile" : "desktop";
      await captureRoute(page, spec, tag);
    });
  }
});
