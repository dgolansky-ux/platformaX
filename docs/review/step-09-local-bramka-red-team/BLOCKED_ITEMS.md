# Step 09 — Blocked Items

```
RED_TEAM_BLOCKERS_FOUND
```

## Blocker 1: check-no-legacy-imports — relative paths not caught

- **Test:** RT2
- **Guard:** `check-no-legacy-imports.mjs`
- **Expected:** FAIL on `import { something } from "../../../features/legacy-example"`
- **Actual:** PASS — guard only matches absolute-style paths like `from "client/src/features/"`
- **Mitigation:** `audit-domain-boundaries.mjs` catches `features/` keyword in app-v2 imports (arch:check:v2 DID fail)
- **Recommended fix:** Add relative path resolution or keyword matching (`/features/`, `/pages/`, `/legacy/`) in import strings regardless of absolute vs relative format

## Blocker 2: audit-domain-boundaries — relative cross-domain paths not caught

- **Test:** RT4
- **Guard:** `audit-domain-boundaries.mjs`
- **Expected:** FAIL on `import { something } from "../social/repository"`
- **Actual:** PASS — guard only matches `domains-v2/<other>/repository` regex in import strings
- **Mitigation:** Absolute-style imports ARE caught. Project convention requires absolute-style imports for cross-domain.
- **Recommended fix:** Parse relative imports and resolve them to detect cross-domain access, or add keyword matching for `../` + blocked module names (`repository`, `service`, `policy`, etc.)

## Blocker 3: check-env-safety — "example" keyword bypass

- **Test:** RT7
- **Guard:** `check-env-safety.mjs`
- **Expected:** FAIL on `DATABASE_URL=postgresql://example`
- **Actual:** PASS — guard skips all lines containing "example" to allow `.env.example` documentation
- **Mitigation:** Real-looking secrets without "example" ARE caught
- **Recommended fix:** Only skip "example" allowlist in `.env.example` and `.env.test.example` files, not in arbitrary source files. Or check that the value is actually a placeholder format (e.g., `YOUR_DATABASE_URL_HERE`) rather than a keyword match.

## Blocker 4: check-pagination — generic ORM/SQL not caught

- **Test:** RT9
- **Guard:** `check-pagination.mjs`
- **Expected:** FAIL on `db.select().from(users)` without limit/cursor
- **Actual:** PASS — guard only detects specific list indicator keywords (`findAll`, `findMany`, `getList`, etc.)
- **Mitigation:** Common ORM patterns like `findAll` ARE caught
- **Recommended fix:** Add `select().from(`, `.query(`, `.execute(` to the LIST_INDICATORS array, or use a broader heuristic that checks for table access patterns returning unbounded result sets.

## Severity assessment

These are **partial blockers**, not full bypasses:
- Blockers 1 and 2: violations ARE caught by overlapping guards (boundary check catches legacy imports; absolute imports ARE enforced). The gap is only with relative path format.
- Blocker 3: real secrets ARE caught. Only the specific word "example" in a value causes a false-negative.
- Blocker 4: common ORM list patterns ARE caught. Only raw SQL/query builder patterns slip through.

None of these allow a violation to pass through ALL gates undetected in the normal workflow (pre-commit + pre-push + rules:check + arch:check:v2).
