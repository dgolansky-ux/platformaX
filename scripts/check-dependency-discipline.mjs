import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

function readFileSafe(path) {
  try { return readFileSync(path, "utf-8"); } catch { return null; }
}

const packageJsonPath = join(ROOT, "package.json");
const lockfilePath = join(ROOT, "pnpm-lock.yaml");

const packageJson = JSON.parse(readFileSafe(packageJsonPath) || "{}");
const allDeps = {
  ...packageJson.dependencies || {},
  ...packageJson.devDependencies || {},
};

const KNOWN_APPROVED_DEPS = new Set([
  "react", "react-dom", "react-router-dom",
  "@supabase/supabase-js",
  "typescript", "vite", "vitest", "eslint",
  "@vitejs/plugin-react", "@eslint/js", "typescript-eslint", "globals",
  "@types/react", "@types/react-dom",
  "@testing-library/react", "@testing-library/jest-dom",
  "jsdom", "husky", "lint-staged",
  "@commitlint/cli", "@commitlint/config-conventional",
  "adm-zip",
]);

const DUPLICATE_CATEGORIES = [
  { category: "HTTP client", packages: ["axios", "got", "node-fetch", "ky", "superagent"] },
  { category: "state management", packages: ["redux", "zustand", "jotai", "recoil", "mobx", "valtio"] },
  { category: "CSS-in-JS", packages: ["styled-components", "emotion", "@emotion/react", "linaria", "vanilla-extract"] },
  { category: "date library", packages: ["moment", "dayjs", "date-fns", "luxon"] },
  { category: "form library", packages: ["formik", "react-hook-form", "@tanstack/react-form"] },
  { category: "validation", packages: ["zod", "yup", "joi", "ajv", "io-ts"] },
  { category: "animation", packages: ["framer-motion", "react-spring", "gsap", "animejs"] },
  { category: "toast/notification UI", packages: ["react-toastify", "react-hot-toast", "notistack", "sonner"] },
];

let violations = 0;

for (const { category, packages } of DUPLICATE_CATEGORIES) {
  const found = packages.filter(p => allDeps[p]);
  if (found.length > 1) {
    console.error(`DEPENDENCY_VIOLATION: duplicate ${category} libraries: ${found.join(", ")} — pick one`);
    violations++;
  }
}

const HEAVY_FOR_SIMPLE = [
  { pkg: "lodash", reason: "use native methods or lodash-es submodules" },
  { pkg: "moment", reason: "use date-fns or Intl API" },
  { pkg: "jquery", reason: "not needed in React" },
  { pkg: "underscore", reason: "use native methods" },
  { pkg: "bluebird", reason: "native promises are sufficient" },
  { pkg: "request", reason: "deprecated, use fetch" },
];

for (const { pkg, reason } of HEAVY_FOR_SIMPLE) {
  if (allDeps[pkg]) {
    console.error(`DEPENDENCY_VIOLATION: heavy package "${pkg}" — ${reason}`);
    violations++;
  }
}

if (existsSync(lockfilePath)) {
  const lockContent = readFileSafe(lockfilePath);
  if (lockContent) {
    const depsInJson = Object.keys(allDeps);
    for (const dep of depsInJson) {
      if (!lockContent.includes(dep) && !KNOWN_APPROVED_DEPS.has(dep)) {
        console.error(`DEPENDENCY_VIOLATION: "${dep}" in package.json but not found in lockfile — run pnpm install`);
        violations++;
      }
    }
  }
} else {
  console.error("DEPENDENCY_VIOLATION: pnpm-lock.yaml not found — lockfile required");
  violations++;
}

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const CLIENT_SCAN = ["client/src/app-v2", "client/src/features-v2"];
const BACKEND_ONLY_PACKAGES = ["express", "fastify", "koa", "hapi", "drizzle-orm"];

for (const scanDir of CLIENT_SCAN) {
  const absDir = join(ROOT, scanDir);
  if (!existsSync(absDir)) continue;
  const files = walk(absDir).filter(f => /\.(ts|tsx)$/.test(f));
  for (const fp of files) {
    const content = readFileSafe(fp);
    if (!content) continue;
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    for (const pkg of BACKEND_ONLY_PACKAGES) {
      if (new RegExp(`from\\s+["']${pkg}`).test(content)) {
        console.error(`DEPENDENCY_VIOLATION: backend-only package "${pkg}" imported in frontend file ${rel}`);
        violations++;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-dependency-discipline: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_DEPENDENCY_DISCIPLINE_PASS");
