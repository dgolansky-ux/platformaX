import AdmZip from "adm-zip";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, relative } from "path";
import { createHash } from "crypto";

const ROOT = process.cwd();
const outZip = process.argv[2];
const outSha = process.argv[3];

if (!outZip || !outSha) {
  console.error("Usage: node create-evidence-zip.mjs <zip-path> <sha-path>");
  process.exit(1);
}

const EXCLUDE = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".git",
  ".cache",
  ".turbo",
  "ZIPY",
  "Starykod",
]);

// Files inside .claude/ that should be excluded from the evidence ZIP. The
// tracked example is the audit reference; the local override is gitignored
// and may carry developer-only allowlist entries we don't want in the ZIP.
const EXCLUDE_FILES = new Set([
  ".claude/settings.local.json",
]);

function toZipPath(p) {
  return p.replace(/\\/g, "/");
}

function isRealEnvFile(rel) {
  // Include only .env*.example; exclude real .env* (secrets risk).
  if (!rel.startsWith(".env")) return false;
  return !rel.endsWith(".example");
}

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    const rel = toZipPath(relative(ROOT, fullPath));
    if (EXCLUDE_FILES.has(rel)) continue;
    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else {
      if (isRealEnvFile(rel)) continue;
      if (
        entry.name.endsWith(".zip") ||
        entry.name.endsWith(".sha256") ||
        entry.name.endsWith(".sha256.txt")
      )
        continue;
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk(ROOT);
const zip = new AdmZip();

for (const f of files) {
  const rel = toZipPath(relative(ROOT, f));
  zip.addFile(rel, readFileSync(f));
}

const entryNames = zip.getEntries().map((e) => e.entryName).sort();
const manifest = {
  version: 1,
  createdAt: new Date().toISOString(),
  root: ".",
  entryCount: entryNames.length,
  entries: entryNames,
};
zip.addFile("audit-manifest.json", Buffer.from(JSON.stringify(manifest, null, 2), "utf-8"));

zip.writeZip(outZip);

const buf = readFileSync(outZip);
const hash = createHash("sha256").update(buf).digest("hex").toUpperCase();
writeFileSync(outSha, `${hash}  ${outZip.replace(/.*[/\\]/, "")}\n`, "utf-8");

console.log(`ZIP: ${outZip}`);
console.log(`Files: ${files.length} (+ audit-manifest.json)`);
console.log(`SHA256: ${hash}`);
