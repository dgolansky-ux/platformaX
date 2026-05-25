import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const SCAN_DIRS = ["server/domains-v2", "client/src/features-v2", "client/src/app-v2", "shared"];
const EXCEPTION_MARKER = "SCALABILITY_EXCEPTION:";
const SAFE_MARKERS = ["MOCK_LOCAL_ONLY", "TEST_FIXTURE", "UI_ONLY", "FIXED_CAP"];

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

function hasExceptionComment(lines, lineIdx) {
  for (let i = Math.max(0, lineIdx - 2); i <= lineIdx; i++) {
    if (lines[i] && lines[i].includes(EXCEPTION_MARKER)) {
      const afterMarker = lines[i].split(EXCEPTION_MARKER)[1];
      if (afterMarker && afterMarker.trim().length > 5) return true;
    }
  }
  return false;
}

const checks = [
  {
    id: "unbounded-list",
    label: "list/search/feed without limit/cursor/fixed cap",
    test(content, lines, rel) {
      const violations = [];
      const listPatterns = [/\.findMany\s*\(/, /\.findAll\s*\(/, /getList\s*\(/, /fetchList\s*\(/, /getFeed\s*\(/, /searchAll\s*\(/, /queryAll\s*\(/];
      const paginationMarkers = ["limit", "cursor", "take", "maxLimit", "fixedCap", "pageSize", "FIXED_CAP"];
      for (let i = 0; i < lines.length; i++) {
        for (const pat of listPatterns) {
          if (pat.test(lines[i])) {
            if (hasExceptionComment(lines, i)) continue;
            const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 5)).join(" ");
            const hasPagination = paginationMarkers.some(m => context.includes(m));
            if (!hasPagination) {
              violations.push({ line: i + 1, msg: `"${lines[i].trim().substring(0, 60)}" without limit/cursor` });
            }
          }
        }
      }
      return violations;
    }
  },
  {
    id: "promise-all-unbounded",
    label: "Promise.all on potentially unbounded list without cap",
    test(content, lines, rel) {
      const violations = [];
      const pat = /Promise\.all\s*\(/;
      for (let i = 0; i < lines.length; i++) {
        if (pat.test(lines[i])) {
          if (hasExceptionComment(lines, i)) continue;
          const context = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 3)).join(" ");
          const hasCap = /\.slice\(|\.substring\(|MAX_|maxLimit|BATCH_SIZE|\.take\(|limit/i.test(context);
          if (!hasCap) {
            violations.push({ line: i + 1, msg: "Promise.all without visible cap on input array" });
          }
        }
      }
      return violations;
    }
  },
  {
    id: "await-in-loop",
    label: "await in loop with DB/network pattern",
    test(content, lines, rel) {
      const violations = [];
      let inLoop = false;
      let loopDepth = 0;
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (/^(for|while)\s*\(/.test(trimmed) || /\.forEach\s*\(/.test(trimmed) || /for\s+.*\s+of\s+/.test(trimmed)) {
          inLoop = true;
          loopDepth++;
        }
        if (inLoop) {
          for (const ch of lines[i]) {
            if (ch === "{") loopDepth++;
            if (ch === "}") { loopDepth--; if (loopDepth <= 0) { inLoop = false; loopDepth = 0; } }
          }
          if (/await\s+/.test(trimmed)) {
            const isDbNetwork = /supabase|fetch|axios|prisma|db\.|repository|\.query|\.insert|\.update|\.delete|\.select/.test(trimmed);
            if (isDbNetwork) {
              if (hasExceptionComment(lines, i)) continue;
              violations.push({ line: i + 1, msg: "await in loop with DB/network call — use batch/parallel" });
            }
          }
        }
      }
      return violations;
    }
  },
  {
    id: "select-star",
    label: "select('*') or overly broad select without mapper/DTO",
    test(content, lines, rel) {
      const violations = [];
      for (let i = 0; i < lines.length; i++) {
        if (/\.select\(\s*['"`]\*['"`]\s*\)/.test(lines[i]) || /\.select\(\s*\*\s*\)/.test(lines[i])) {
          if (hasExceptionComment(lines, i)) continue;
          violations.push({ line: i + 1, msg: "select('*') — use explicit columns with mapper/DTO" });
        }
      }
      return violations;
    }
  },
  {
    id: "n-plus-1",
    label: "N+1 pattern — fetching related data in a loop",
    test(content, lines, rel) {
      const violations = [];
      let inLoop = false;
      let loopStart = -1;
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (/\.(map|forEach|for)\s*\(/.test(trimmed) || /^for\s/.test(trimmed)) {
          inLoop = true;
          loopStart = i;
        }
        if (inLoop && i - loopStart > 30) {
          inLoop = false;
        }
        if (inLoop) {
          const isRelatedFetch = /getComments|getReactions|getProfile|getUser|getCount|fetchProfile|fetchComments/.test(trimmed);
          if (isRelatedFetch) {
            if (hasExceptionComment(lines, i)) continue;
            violations.push({ line: i + 1, msg: "potential N+1 — fetching related data in loop, use batch" });
          }
        }
      }
      return violations;
    }
  },
  {
    id: "sync-fanout",
    label: "sync fanout notifications/search/indexing in request path",
    test(content, lines, rel) {
      if (!rel.includes("router") && !rel.includes("service")) return [];
      const violations = [];
      const fanoutPatterns = [/sendNotification/,/notifyAll/,/indexDocument/,/reindexAll/,/broadcastTo/,/fanout/];
      for (let i = 0; i < lines.length; i++) {
        for (const pat of fanoutPatterns) {
          if (pat.test(lines[i])) {
            if (hasExceptionComment(lines, i)) continue;
            const context = lines.slice(Math.max(0, i - 3), i + 1).join(" ");
            if (!/emit|queue|outbox|event|async.*background|job/i.test(context)) {
              violations.push({ line: i + 1, msg: "sync fanout in request path — use events/outbox" });
            }
          }
        }
      }
      return violations;
    }
  },
  {
    id: "offset-pagination",
    label: "offset pagination without justification",
    test(content, lines, rel) {
      const violations = [];
      for (let i = 0; i < lines.length; i++) {
        if (/\.offset\s*\(/.test(lines[i]) || /OFFSET\s+\d/.test(lines[i])) {
          if (hasExceptionComment(lines, i)) continue;
          const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 2)).join(" ");
          if (!/admin|report|export|backfill/i.test(context)) {
            violations.push({ line: i + 1, msg: "offset pagination — prefer cursor-based for user-facing lists" });
          }
        }
      }
      return violations;
    }
  },
  {
    id: "missing-stable-order",
    label: "sort/order without stable tie-breaker id/createdAt",
    test(content, lines, rel) {
      if (!rel.includes("repository") && !rel.includes("service")) return [];
      const violations = [];
      for (let i = 0; i < lines.length; i++) {
        if (/\.order(By)?\s*\(/.test(lines[i]) || /ORDER\s+BY/i.test(lines[i])) {
          const context = lines.slice(i, Math.min(lines.length, i + 4)).join(" ");
          if (!/id|createdAt|created_at|uuid|_id/.test(context)) {
            if (hasExceptionComment(lines, i)) continue;
            violations.push({ line: i + 1, msg: "orderBy without stable tie-breaker (id/createdAt)" });
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
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(fp)) continue;
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    if (/\.(test|spec|fixture)\./.test(rel)) continue;
    if (rel.includes("__tests__/")) continue;
    if (rel.includes("fixtures")) continue;

    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    if (SAFE_MARKERS.some(m => content.includes(m))) continue;

    const lines = content.split("\n");

    for (const check of checks) {
      const results = check.test(content, lines, rel);
      for (const v of results) {
        console.error(`SCALABILITY_VIOLATION [${check.id}]: ${rel}:${v.line} — ${v.msg}`);
        totalViolations++;
      }
    }
  }
}

if (totalViolations > 0) {
  console.error(`\ncheck-scalability-patterns: ${totalViolations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_SCALABILITY_PATTERNS_PASS");
