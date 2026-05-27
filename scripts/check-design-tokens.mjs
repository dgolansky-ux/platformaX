/**
 * Guard: design tokens are centralized and used by the profile.
 *
 * Rule: PX-UI-001 / PX-CODE-004. Verifies:
 *  1. the central tokens file exists and defines the core token contract,
 *  2. it is imported once at the app entry (client/src/main.tsx),
 *  3. profile CSS consumes core token vars (not only hardcoded values),
 *  4. no `transition: all` anywhere under client CSS.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const TOKENS_FILE = join(ROOT, "client/src/app-v2/styles/tokens.css");
const MAIN_FILE = join(ROOT, "client/src/main.tsx");
const PROFILE_STYLES = join(ROOT, "client/src/app-v2/profile/styles");
const CLIENT_DIR = join(ROOT, "client/src");

const REQUIRED_TOKENS = [
  "--color-primary",
  "--color-text",
  "--color-surface",
  "--color-border",
  "--radius-md",
  "--shadow-soft",
  "--profile-avatar-ring",
];

let violations = 0;
function fail(msg) {
  console.error(`DESIGN_TOKENS_VIOLATION: ${msg}`);
  violations++;
}

function walkCss(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) continue;
      out.push(...walkCss(full));
    } else if (entry.name.endsWith(".css")) {
      out.push(full);
    }
  }
  return out;
}

if (!existsSync(TOKENS_FILE)) {
  fail("client/src/app-v2/styles/tokens.css does not exist");
} else {
  const tokens = readFileSync(TOKENS_FILE, "utf-8");
  if (!tokens.includes(":root")) fail("tokens.css must define tokens on :root");
  for (const t of REQUIRED_TOKENS) {
    if (!tokens.includes(`${t}:`)) fail(`tokens.css is missing required token "${t}"`);
  }
}

if (!existsSync(MAIN_FILE)) {
  fail("client/src/main.tsx does not exist");
} else {
  const main = readFileSync(MAIN_FILE, "utf-8");
  if (!/styles\/tokens\.css/.test(main)) {
    fail("tokens.css must be imported once at the app entry (client/src/main.tsx)");
  }
}

// Profile CSS must consume core token vars (not only hardcoded values).
const profileCss = walkCss(PROFILE_STYLES);
const profileUsesTokens = profileCss.some((fp) =>
  /var\(--color-(primary|text|border|surface)/.test(readFileSync(fp, "utf-8")),
);
if (!profileUsesTokens) {
  fail("no profile CSS module consumes core color tokens via var(--color-*)");
}

// No `transition: all` anywhere under client CSS.
for (const fp of walkCss(CLIENT_DIR)) {
  const content = readFileSync(fp, "utf-8");
  if (/transition:\s*all\b/.test(content)) {
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    fail(`${rel} uses "transition: all" — list explicit properties instead`);
  }
}

if (violations > 0) {
  console.error(`\ncheck-design-tokens: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_DESIGN_TOKENS_PASS");
