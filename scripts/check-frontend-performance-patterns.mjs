import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const SCAN_DIRS = ["client/src/app-v2", "client/src/features-v2"];
const EXCEPTION_MARKER = "FRONTEND_PERF_EXCEPTION:";

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

function hasException(lines, lineIdx) {
  for (let i = Math.max(0, lineIdx - 2); i <= lineIdx; i++) {
    if (lines[i] && lines[i].includes(EXCEPTION_MARKER)) return true;
  }
  return false;
}

const tsxChecks = [
  {
    id: "key-index",
    label: "key={index} in list mapping",
    severity: "FAIL",
    test(lines) {
      const violations = [];
      for (let i = 0; i < lines.length; i++) {
        if (/key\s*=\s*\{\s*\b(index|idx)\b\s*\}/.test(lines[i]) && /\.map\s*\(/.test(lines.slice(Math.max(0, i - 5), i + 1).join("\n"))) {
          if (!hasException(lines, i)) {
            violations.push({ line: i + 1, msg: "key={index} — use stable unique id" });
          }
        }
      }
      return violations;
    }
  },
  {
    id: "missing-key",
    label: "list mapping without key prop",
    severity: "FAIL",
    test(lines) {
      const violations = [];
      for (let i = 0; i < lines.length; i++) {
        if (/\.map\s*\(\s*\(/.test(lines[i])) {
          const block = lines.slice(i, Math.min(lines.length, i + 10)).join("\n");
          if (/<[A-Z]\w/.test(block) && !/key\s*=/.test(block) && !/<Fragment/.test(block)) {
            if (!hasException(lines, i)) {
              violations.push({ line: i + 1, msg: "list .map() renders component without key prop" });
            }
          }
        }
      }
      return violations;
    }
  },
  {
    id: "event-listener-no-cleanup",
    label: "event listener without cleanup in useEffect",
    severity: "FAIL",
    test(lines) {
      const violations = [];
      const content = lines.join("\n");
      const effectPattern = /useEffect\s*\(\s*\(\)\s*=>\s*\{/g;
      let match;
      while ((match = effectPattern.exec(content)) !== null) {
        const startIdx = match.index;
        let braceDepth = 0;
        let effectEnd = startIdx;
        let foundBrace = false;
        for (let c = startIdx; c < content.length; c++) {
          if (content[c] === "{") { braceDepth++; foundBrace = true; }
          if (content[c] === "}") { braceDepth--; if (foundBrace && braceDepth === 0) { effectEnd = c; break; } }
        }
        const effectBody = content.substring(startIdx, effectEnd);
        if (/addEventListener/.test(effectBody) && !/removeEventListener/.test(effectBody)) {
          const lineNum = content.substring(0, startIdx).split("\n").length;
          if (!hasException(lines, lineNum - 1)) {
            violations.push({ line: lineNum, msg: "addEventListener without removeEventListener cleanup" });
          }
        }
      }
      return violations;
    }
  },
  {
    id: "timer-no-cleanup",
    label: "setInterval/setTimeout without cleanup in useEffect",
    severity: "FAIL",
    test(lines) {
      const violations = [];
      const content = lines.join("\n");
      const effectPattern = /useEffect\s*\(\s*\(\)\s*=>\s*\{/g;
      let match;
      while ((match = effectPattern.exec(content)) !== null) {
        const startIdx = match.index;
        let braceDepth = 0;
        let effectEnd = startIdx;
        let foundBrace = false;
        for (let c = startIdx; c < content.length; c++) {
          if (content[c] === "{") { braceDepth++; foundBrace = true; }
          if (content[c] === "}") { braceDepth--; if (foundBrace && braceDepth === 0) { effectEnd = c; break; } }
        }
        const effectBody = content.substring(startIdx, effectEnd);
        if (/setInterval\s*\(/.test(effectBody) && !/clearInterval/.test(effectBody)) {
          const lineNum = content.substring(0, startIdx).split("\n").length;
          if (!hasException(lines, lineNum - 1)) {
            violations.push({ line: lineNum, msg: "setInterval without clearInterval cleanup" });
          }
        }
        if (/setTimeout\s*\(/.test(effectBody) && !/clearTimeout/.test(effectBody)) {
          const lineNum = content.substring(0, startIdx).split("\n").length;
          if (!hasException(lines, lineNum - 1)) {
            violations.push({ line: lineNum, msg: "setTimeout without clearTimeout cleanup" });
          }
        }
      }
      return violations;
    }
  },
  {
    id: "setState-in-loop",
    label: "setState call inside a loop",
    severity: "WARN",
    test(lines) {
      const violations = [];
      let inLoop = false;
      let loopDepth = 0;
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (/^(for|while)\s*\(/.test(trimmed) || /\.forEach\s*\(/.test(trimmed)) {
          inLoop = true;
          loopDepth = 1;
        }
        if (inLoop) {
          for (const ch of lines[i]) {
            if (ch === "{") loopDepth++;
            if (ch === "}") { loopDepth--; if (loopDepth <= 0) { inLoop = false; } }
          }
          if (/set[A-Z]\w*\s*\(/.test(trimmed) && !/\/\//.test(trimmed.split("set")[0])) {
            if (!hasException(lines, i)) {
              violations.push({ line: i + 1, msg: "setState in loop — batch state updates" });
            }
          }
        }
      }
      return violations;
    }
  },
  {
    id: "large-fixture-in-component",
    label: "large array fixture defined inside component file",
    severity: "FAIL",
    test(lines) {
      const violations = [];
      const content = lines.join("\n");
      const arrayPattern = /(?:const|let)\s+\w+\s*(?::\s*\w+(?:<[^>]+>)?\[\])?\s*=\s*\[/g;
      let match;
      while ((match = arrayPattern.exec(content)) !== null) {
        const startIdx = match.index;
        let bracketDepth = 0;
        let arrayEnd = startIdx;
        for (let c = startIdx; c < content.length; c++) {
          if (content[c] === "[") bracketDepth++;
          if (content[c] === "]") { bracketDepth--; if (bracketDepth === 0) { arrayEnd = c; break; } }
        }
        const arrayContent = content.substring(startIdx, arrayEnd);
        const arrayLines = arrayContent.split("\n").length;
        if (arrayLines > 20) {
          const lineNum = content.substring(0, startIdx).split("\n").length;
          if (!hasException(lines, lineNum - 1)) {
            violations.push({ line: lineNum, msg: `large inline array (${arrayLines} lines) — extract to fixture file` });
          }
        }
      }
      return violations;
    }
  },
  {
    id: "missing-lazy-loading",
    label: "images without loading='lazy' in list/card context",
    severity: "WARN",
    test(lines) {
      const violations = [];
      const content = lines.join("\n");
      if (!(/\.map\s*\(/.test(content) || /List|Card|Feed|Grid/i.test(content))) return violations;
      for (let i = 0; i < lines.length; i++) {
        if (/<img\s/.test(lines[i]) && !/loading\s*=/.test(lines[i])) {
          const context = lines.slice(Math.max(0, i - 5), i + 1).join(" ");
          if (/map|card|list|feed|grid/i.test(context)) {
            if (!hasException(lines, i)) {
              violations.push({ line: i + 1, msg: "img in list/card without loading='lazy'" });
            }
          }
        }
      }
      return violations;
    }
  },
];

const cssChecks = [
  {
    id: "transition-all",
    label: "transition: all in CSS modules",
    severity: "FAIL",
    test(lines) {
      const violations = [];
      for (let i = 0; i < lines.length; i++) {
        if (/transition\s*:\s*all\b/.test(lines[i]) || /transition\s*:\s*\d.*all/.test(lines[i])) {
          if (!hasException(lines, i)) {
            violations.push({ line: i + 1, msg: "transition: all — specify exact properties" });
          }
        }
      }
      return violations;
    }
  },
  {
    id: "missing-reduced-motion",
    label: "animation/transition without prefers-reduced-motion",
    severity: "WARN",
    test(lines, content) {
      const violations = [];
      const hasAnimation = /animation\s*:/.test(content) || /transition\s*:/.test(content) || /@keyframes/.test(content);
      if (hasAnimation && !/prefers-reduced-motion/.test(content)) {
        violations.push({ line: 1, msg: "file has animations but no prefers-reduced-motion media query" });
      }
      return violations;
    }
  },
];

let totalViolations = 0;

for (const scanDir of SCAN_DIRS) {
  const absDir = join(ROOT, scanDir);
  const files = walk(absDir);
  for (const fp of files) {
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    if (/\.(test|spec|fixture)\./.test(rel)) continue;
    if (rel.includes("__tests__/")) continue;

    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    if (content.includes("TEST_FIXTURE") || content.includes("MOCK_LOCAL_ONLY")) continue;

    const lines = content.split("\n");

    if (/\.tsx$/.test(fp)) {
      for (const check of tsxChecks) {
        const results = check.test(lines);
        for (const v of results) {
          if (check.severity === "FAIL") {
            console.error(`FRONTEND_PERF_VIOLATION [${check.id}]: ${rel}:${v.line} — ${v.msg}`);
            totalViolations++;
          }
        }
      }
    }

    if (/\.module\.css$/.test(fp)) {
      for (const check of cssChecks) {
        const results = check.test(lines, content);
        for (const v of results) {
          if (check.severity === "FAIL") {
            console.error(`FRONTEND_PERF_VIOLATION [${check.id}]: ${rel}:${v.line} — ${v.msg}`);
            totalViolations++;
          }
        }
      }
    }
  }
}

if (totalViolations > 0) {
  console.error(`\ncheck-frontend-performance-patterns: ${totalViolations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_FRONTEND_PERFORMANCE_PATTERNS_PASS");
