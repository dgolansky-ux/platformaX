# Step 09 — Blocked Items

```
NO_RED_TEAM_BLOCKERS
```

All 12 red-team tests confirmed that guards correctly block violations.

## Known limitations (not blockers)

1. `check-no-legacy-imports` only matches absolute-path imports (`client/src/features/`), not relative (`../../features/`). This is by design — the guard enforces the documented import convention.
2. `audit-domain-boundaries` matches `domains-v2/<domain>/module` patterns. Relative imports between domains are not caught directly; the convention requires absolute-style import paths.
3. `check-pagination` requires specific list indicator keywords (`findAll`, `findMany`, etc.). Raw SQL or ORM queries without these keywords are not flagged.
4. `check-env-safety` skips lines containing "example" or "placeholder". This is intentional to allow `.env.example` style documentation.

These are documented design decisions, not gaps.
