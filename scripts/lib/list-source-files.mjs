// PX-GOV-002 helper — portable source-file listing for guard scripts.
//
// Why this exists: several guards used `git ls-files` directly, which returns
// an empty list when run outside a git working tree (audit ZIPs, fresh clones,
// reviewer sandboxes). That silently turns "no violations" into "nothing was
// scanned" — a guard that cannot fail closed. This helper enforces a real
// scan in either environment.
//
// Behavior:
//   1. Try `git ls-files <root>` for each requested root.
//   2. If git is missing OR returns an empty set, fall back to a filesystem
//      walk rooted at the same paths.
//   3. Always exclude vendored / generated / non-source directories.
//   4. Always normalize separators to `/` so callers can match with regex.
//   5. Real `.env` files are never returned. `.env*.example` is allowed so
//      audit pipelines can verify the example shape.
//
// Public API: `listSourceFiles({ roots, extensions })` returns string[].

import { execSync } from "node:child_process";
import { readdirSync, statSync, existsSync } from "node:fs";
import { join, sep } from "node:path";

const DEFAULT_ROOTS = ["."];
const DEFAULT_EXTENSIONS = [".ts", ".tsx", ".mjs", ".js", ".cjs", ".md", ".sql", ".yml", ".yaml", ".json", ".css"];

const EXCLUDED_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".cache",
  ".next",
  ".vite",
  "ZIPY",
  "Starykod",
]);

const EXCLUDED_PATH_FRAGMENTS = [
  "/.git/",
  "/node_modules/",
  "/dist/",
  "/build/",
  "/coverage/",
  "/.turbo/",
  "/.cache/",
  "/.next/",
  "/.vite/",
  "/ZIPY/",
  "/Starykod/",
];

function normalizePath(p) {
  return p.split(sep).join("/").replace(/^\.\//, "");
}

function isRealEnvFile(name) {
  if (!name.startsWith(".env")) return false;
  // `.env.example`, `.env.test.example`, `.env*.example` are sample files — keep them.
  if (name.endsWith(".example")) return false;
  return true;
}

function shouldExcludeByPath(path) {
  const withSlashes = `/${path}/`;
  for (const fragment of EXCLUDED_PATH_FRAGMENTS) {
    if (withSlashes.includes(fragment)) return true;
  }
  return false;
}

function matchesExtension(file, extensions) {
  if (!extensions || extensions.length === 0) return true;
  const lower = file.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext.toLowerCase()));
}

function gitLsFiles(root, cwd) {
  try {
    const out = execSync(`git ls-files ${root}`, {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out
      .split(/\r?\n/)
      .filter((line) => line.length > 0)
      .map(normalizePath);
  } catch {
    return null;
  }
}

function fsWalk(root, cwd) {
  const out = [];
  const startAbsolute = join(cwd, root);
  if (!existsSync(startAbsolute)) return out;

  const stack = [{ absolute: startAbsolute, relative: root === "." ? "" : root }];
  while (stack.length > 0) {
    const { absolute, relative } = stack.pop();
    let entries;
    try {
      entries = readdirSync(absolute, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const name = entry.name;
      if (EXCLUDED_DIR_NAMES.has(name)) continue;
      const childAbs = join(absolute, name);
      const childRel = relative ? `${relative}/${name}` : name;
      if (entry.isDirectory()) {
        stack.push({ absolute: childAbs, relative: childRel });
        continue;
      }
      if (!entry.isFile() && !entry.isSymbolicLink()) continue;
      let isFile = entry.isFile();
      if (!isFile) {
        try {
          isFile = statSync(childAbs).isFile();
        } catch {
          continue;
        }
      }
      if (!isFile) continue;
      out.push(normalizePath(childRel));
    }
  }
  return out;
}

export function listSourceFiles(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const roots = options.roots ?? DEFAULT_ROOTS;
  const extensions = options.extensions ?? DEFAULT_EXTENSIONS;

  const collected = new Set();

  for (const root of roots) {
    const normalizedRoot = root === "" ? "." : root;
    let files = gitLsFiles(normalizedRoot, cwd);
    if (!files || files.length === 0) {
      files = fsWalk(normalizedRoot, cwd);
    }
    for (const file of files) {
      if (!file) continue;
      const norm = normalizePath(file);
      if (shouldExcludeByPath(norm)) continue;
      const base = norm.split("/").pop() ?? norm;
      if (isRealEnvFile(base)) continue;
      if (!matchesExtension(norm, extensions)) continue;
      collected.add(norm);
    }
  }

  return [...collected].sort();
}

export const __test__ = {
  EXCLUDED_DIR_NAMES,
  EXCLUDED_PATH_FRAGMENTS,
  isRealEnvFile,
  shouldExcludeByPath,
  matchesExtension,
  normalizePath,
  fsWalk,
};
