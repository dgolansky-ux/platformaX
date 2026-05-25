import AdmZip from "adm-zip";
import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
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
  "node_modules", "dist", "build", "coverage", ".git",
  ".env", ".env.local", ".env.production", ".cache", ".turbo",
]);

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else {
      if (entry.name.endsWith(".zip") || entry.name.endsWith(".sha256") || entry.name.endsWith(".sha256.txt")) continue;
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk(ROOT);
const zip = new AdmZip();

for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, "/");
  const dirPart = rel.includes("/") ? rel.substring(0, rel.lastIndexOf("/")) : "";
  zip.addLocalFile(f, dirPart);
}

zip.writeZip(outZip);

const buf = readFileSync(outZip);
const hash = createHash("sha256").update(buf).digest("hex").toUpperCase();
writeFileSync(outSha, `${hash}  ${outZip.replace(/.*[/\\]/, "")}\n`, "utf-8");

console.log(`ZIP: ${outZip}`);
console.log(`Files: ${files.length}`);
console.log(`SHA256: ${hash}`);
