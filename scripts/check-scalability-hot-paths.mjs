import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const SCAN_DIRS = ["server/domains-v2"];
const EXCEPTION_MARKER = "SCALABILITY_HOT_PATH_EXCEPTION:";

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

function hasExceptionComment(lines, lineIdx) {
  for (let i = Math.max(0, lineIdx - 2); i <= lineIdx; i++) {
    if (lines[i] && lines[i].includes(EXCEPTION_MARKER)) return true;
  }
  return false;
}

const checks = [
  {
    id: "sync-fanout-loop",
    label: "sync fanout loop over recipients/users/members in service/router/public-api",
    test(content, lines, rel) {
      if (!rel.includes("service") && !rel.includes("router") && !rel.includes("public-api")) return [];
      const violations = [];
      const fanoutPatterns = [
        /for\s*\(\s*(?:const|let|var)\s+\w+\s+of\s+(?:recipients|users|members|subscribers|followers)/,
        /\.forEach\s*\(\s*(?:\(?\s*(?:recipient|user|member|subscriber|follower))/,
        /\.map\s*\(\s*(?:\(?\s*(?:recipient|user|member|subscriber|follower))/,
      ];
      for (let i = 0; i < lines.length; i++) {
        for (const pat of fanoutPatterns) {
          if (pat.test(lines[i])) {
            if (hasExceptionComment(lines, i)) continue;
            const context = lines.slice(i, Math.min(lines.length, i + 5)).join(" ");
            if (/await\s/.test(context) && !/outbox|queue|emit|batch|event/i.test(context)) {
              violations.push({ line: i + 1, msg: `sync fanout loop: ${lines[i].trim().substring(0, 60)}` });
            }
          }
        }
      }
      return violations;
    }
  },
  {
    id: "unbounded-hot-loop",
    label: "unbounded loop without cap/batch/outbox",
    test(content, lines, rel) {
      if (!rel.includes("service") && !rel.includes("router") && !rel.includes("public-api")) return [];
      const violations = [];
      const loopPatterns = [
        /for\s*\(\s*(?:const|let|var)\s+\w+\s+of\s+(?:all|every|entire)/i,
        /\.forEach\s*\(/,
      ];
      for (let i = 0; i < lines.length; i++) {
        for (const pat of loopPatterns) {
          if (pat.test(lines[i])) {
            if (hasExceptionComment(lines, i)) continue;
            const context = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 8)).join(" ");
            const hasNetworkCall = /await\s+.*(?:send|notify|index|update|insert|delete|fetch|post|put|patch)/i.test(context);
            const hasCap = /\.slice\(|BATCH_SIZE|MAX_|limit|cap|chunk|outbox|queue/i.test(context);
            if (hasNetworkCall && !hasCap) {
              violations.push({ line: i + 1, msg: `unbounded hot-path loop without cap/batch: ${lines[i].trim().substring(0, 60)}` });
            }
          }
        }
      }
      return violations;
    }
  },
  {
    id: "full-scan-runtime",
    label: "full scan in runtime list/feed/search",
    test(content, lines, rel) {
      if (!rel.includes("service") && !rel.includes("repository") && !rel.includes("public-api") && !rel.includes("router")) return [];
      const violations = [];
      const listPatterns = [
        /getAll\s*\(/,
        /findAll\s*\(/,
        /fetchAll\s*\(/,
        /listAll\s*\(/,
        /searchAll\s*\(/,
        /\.select\(\s*\)\s*(?!\.limit|\.take)/,
      ];
      const paginationMarkers = ["limit", "cursor", "take", "maxLimit", "fixedCap", "pageSize", "FIXED_CAP", "offset"];
      for (let i = 0; i < lines.length; i++) {
        for (const pat of listPatterns) {
          if (pat.test(lines[i])) {
            if (hasExceptionComment(lines, i)) continue;
            const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 5)).join(" ");
            const hasPagination = paginationMarkers.some(m => context.includes(m));
            if (!hasPagination) {
              violations.push({ line: i + 1, msg: `full scan without limit/cursor: ${lines[i].trim().substring(0, 60)}` });
            }
          }
        }
      }
      return violations;
    }
  },
  {
    id: "missing-stable-order",
    label: "list/feed without stable order",
    test(content, lines, rel) {
      if (!rel.includes("repository") && !rel.includes("service")) return [];
      const violations = [];
      const listFuncPatterns = [/list\w*\s*\(/i, /feed\w*\s*\(/i, /search\w*\s*\(/i, /getPage\w*\s*\(/i];
      for (let i = 0; i < lines.length; i++) {
        for (const pat of listFuncPatterns) {
          if (pat.test(lines[i]) && /(?:async\s+)?(?:function|=>|\()/.test(lines[i])) {
            if (hasExceptionComment(lines, i)) continue;
            const funcBlock = lines.slice(i, Math.min(lines.length, i + 20)).join(" ");
            const hasOrder = /order|sort|createdAt|created_at|\.orderBy/.test(funcBlock);
            const hasPagination = /limit|cursor|take|pageSize/.test(funcBlock);
            if (hasPagination && !hasOrder) {
              violations.push({ line: i + 1, msg: `paginated function without stable order` });
            }
          }
        }
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
    if (!/\.(ts|tsx|js|mjs)$/.test(fp)) continue;
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    if (/\.(test|spec|fixture)\./.test(rel)) continue;
    if (rel.includes("__tests__/")) continue;

    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    const lines = content.split("\n");

    for (const check of checks) {
      const results = check.test(content, lines, rel);
      for (const v of results) {
        console.error(`HOT_PATH_VIOLATION [${check.id}]: ${rel}:${v.line} — ${v.msg}`);
        totalViolations++;
      }
    }
  }
}

if (totalViolations > 0) {
  console.error(`\ncheck-scalability-hot-paths: ${totalViolations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_SCALABILITY_HOT_PATHS_PASS");
