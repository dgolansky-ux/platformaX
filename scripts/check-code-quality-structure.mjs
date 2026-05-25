import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const SCAN_DIRS = ["client/src/app-v2", "client/src/features-v2", "server/domains-v2", "shared"];
const EXCEPTION_MARKER = "QUALITY_STRUCTURE_EXCEPTION";

const FILE_LIMITS = {
  routePage: { test: (r) => /app-v2\/.*\/(page|route|layout)\.(tsx|ts)$/.test(r) || /app-v2\/.*Route\.tsx$/.test(r) || /app-v2\/.*Page\.tsx$/.test(r) || /app-v2\/.*Flow\.tsx$/.test(r), limit: 280, label: "route/page" },
  cssModule: { test: (r) => r.endsWith(".module.css"), limit: 320, label: "CSS module" },
  backendService: { test: (r) => /domains-v2\/.*\/service\.ts$/.test(r), limit: 240, label: "backend service" },
  backendRepository: { test: (r) => /domains-v2\/.*\/repository\.ts$/.test(r), limit: 240, label: "backend repository" },
  backendPolicy: { test: (r) => /domains-v2\/.*\/policy\.ts$/.test(r), limit: 240, label: "backend policy" },
  backendRouter: { test: (r) => /domains-v2\/.*\/router\.ts$/.test(r), limit: 240, label: "backend router" },
  backendMapper: { test: (r) => /domains-v2\/.*\/mapper\.ts$/.test(r), limit: 240, label: "backend mapper" },
  regularTsx: { test: (r) => r.endsWith(".tsx") && !/\.(test|spec|fixture)\.tsx$/.test(r) && !/Route\.tsx$/.test(r) && !/Page\.tsx$/.test(r) && !/Flow\.tsx$/.test(r), limit: 220, label: "regular .tsx" },
};

const FUNCTION_MAX_LINES = 80;
const COMPONENT_MAX_LINES = 140;
const MAX_EXPORTS_PER_FILE = 15;
const MAX_PROPS = 12;

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage", "__tests__"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function countFunctionLines(content, isTsx) {
  const violations = [];
  const lines = content.split("\n");
  const funcPattern = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/;
  const arrowPattern = /^(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/;
  
  let braceDepth = 0;
  let currentFunc = null;
  let funcStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!currentFunc) {
      let match = funcPattern.exec(trimmed);
      if (!match) match = arrowPattern.exec(trimmed);
      if (match) {
        currentFunc = match[1];
        funcStart = i;
        braceDepth = 0;
      }
    }

    if (currentFunc) {
      for (const ch of line) {
        if (ch === "{") braceDepth++;
        if (ch === "}") braceDepth--;
      }
      if (braceDepth <= 0 && i > funcStart) {
        const length = i - funcStart + 1;
        const isComponent = /^[A-Z]/.test(currentFunc);
        if (isComponent && isTsx) {
          // Components handled by countComponentLines with 140 limit
        } else if (length > FUNCTION_MAX_LINES) {
          violations.push({ name: currentFunc, start: funcStart + 1, length });
        }
        currentFunc = null;
        funcStart = -1;
        braceDepth = 0;
      }
    }
  }
  return violations;
}

function countComponentLines(content) {
  const violations = [];
  const lines = content.split("\n");
  const componentPattern = /^(?:export\s+)?(?:const|function)\s+([A-Z]\w+)/;
  
  let braceDepth = 0;
  let currentComp = null;
  let compStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!currentComp) {
      const match = componentPattern.exec(trimmed);
      if (match && (content.includes("React") || content.includes("jsx") || content.includes("tsx") || line.includes("=>") || content.includes("return ("))) {
        currentComp = match[1];
        compStart = i;
        braceDepth = 0;
      }
    }

    if (currentComp) {
      for (const ch of line) {
        if (ch === "{") braceDepth++;
        if (ch === "}") braceDepth--;
      }
      if (braceDepth <= 0 && i > compStart) {
        const length = i - compStart + 1;
        if (length > COMPONENT_MAX_LINES) {
          violations.push({ name: currentComp, start: compStart + 1, length });
        }
        currentComp = null;
        compStart = -1;
        braceDepth = 0;
      }
    }
  }
  return violations;
}

function countExports(content) {
  const exportPattern = /^export\s+(?:const|function|class|type|interface|enum|let|var|default|async)/gm;
  const matches = content.match(exportPattern);
  return matches ? matches.length : 0;
}

function countProps(content) {
  const violations = [];
  const propsPattern = /(?:type|interface)\s+(\w+Props)\s*=?\s*\{([^}]*)\}/gs;
  let match;
  while ((match = propsPattern.exec(content)) !== null) {
    const propsBlock = match[2];
    const propCount = propsBlock.split(/[;\n]/).filter(l => l.trim() && l.includes(":")).length;
    if (propCount > MAX_PROPS) {
      violations.push({ name: match[1], count: propCount });
    }
  }
  return violations;
}

function checkIndexInternals(content, rel) {
  if (!rel.endsWith("index.ts") && !rel.endsWith("index.tsx")) return [];
  const violations = [];
  const internalExports = [
    /export.*from\s+["'].*repository/i,
    /export.*from\s+["'].*\/service/i,
    /export.*from\s+["'].*router/i,
    /export.*from\s+["'].*mapper/i,
    /export.*from\s+["'].*cache-?keys/i,
    /export.*from\s+["'].*schema/i,
  ];
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;
    for (const pat of internalExports) {
      if (pat.test(trimmed)) {
        violations.push(`index exports domain internal (${pat.source})`);
      }
    }
  }
  return violations;
}

function checkUtilsMiscHelpers(rel, content) {
  if (!/\/(utils|misc|helpers)\.(ts|tsx|js)$/.test(rel)) return false;
  const lineCount = content.split("\n").length;
  return lineCount > 100;
}

let violations = 0;

for (const scanDir of SCAN_DIRS) {
  const absDir = join(ROOT, scanDir);
  const files = walk(absDir);
  for (const fp of files) {
    if (!/\.(ts|tsx|css)$/.test(fp)) continue;
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    if (/\.(test|spec|fixture)\./.test(rel)) continue;
    if (rel.includes("__tests__/")) continue;

    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    if (content.includes(EXCEPTION_MARKER)) continue;

    const lineCount = content.split("\n").length;

    for (const [, rule] of Object.entries(FILE_LIMITS)) {
      if (rule.test(rel) && lineCount > rule.limit) {
        console.error(`CODE_QUALITY_VIOLATION: ${rel} has ${lineCount} lines (${rule.label} limit: ${rule.limit})`);
        violations++;
        break;
      }
    }

    if (!/\.css$/.test(rel) && /\.(ts|tsx)$/.test(rel)) {
      const isTsx = rel.endsWith(".tsx");
      const funcViolations = countFunctionLines(content, isTsx);
      for (const v of funcViolations) {
        console.error(`CODE_QUALITY_VIOLATION: function "${v.name}" in ${rel}:${v.start} is ${v.length} lines (max: ${FUNCTION_MAX_LINES})`);
        violations++;
      }

      if (rel.endsWith(".tsx")) {
        const compViolations = countComponentLines(content);
        for (const v of compViolations) {
          console.error(`CODE_QUALITY_VIOLATION: component "${v.name}" in ${rel}:${v.start} is ${v.length} lines (max: ${COMPONENT_MAX_LINES})`);
          violations++;
        }
      }

      const exportCount = countExports(content);
      if (exportCount > MAX_EXPORTS_PER_FILE) {
        console.error(`CODE_QUALITY_VIOLATION: ${rel} has ${exportCount} exports (max: ${MAX_EXPORTS_PER_FILE})`);
        violations++;
      }

      const propsViolations = countProps(content);
      for (const v of propsViolations) {
        console.error(`CODE_QUALITY_VIOLATION: ${v.name} in ${rel} has ${v.count} props (max: ${MAX_PROPS})`);
        violations++;
      }

      const indexViolations = checkIndexInternals(content, rel);
      for (const msg of indexViolations) {
        console.error(`CODE_QUALITY_VIOLATION: ${rel} — ${msg}`);
        violations++;
      }

      if (checkUtilsMiscHelpers(rel, content)) {
        console.error(`CODE_QUALITY_VIOLATION: ${rel} is a generic utils/misc/helpers file exceeding 100 lines — split by domain responsibility`);
        violations++;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-code-quality-structure: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_CODE_QUALITY_STRUCTURE_PASS");
