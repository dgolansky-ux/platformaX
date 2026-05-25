# Step 12 — New Workflow Rules

## Branch + PR workflow (effective immediately)

1. **Every change goes through a branch.** No direct commits to `main`.
2. **Agent does not push directly to main.** Agent creates feature/governance branches.
3. **After changes: local gates must PASS.**
   - `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`
   - `pnpm rules:check`, `pnpm arch:check:v2`
   - `pnpm guards:domains`, `pnpm guards:commit`, `pnpm guards:bundle`, `pnpm guards:all-local`
4. **Push only to feature/governance branch.** Never push to `main`.
5. **Merge to main only through PR.**
6. **PR must have green GitHub Actions check:** `Check / Lint / Test / Build / Guards`
7. **PR must include Architecture Impact Statement** (from PR template).
8. **PR must be approved by code owner** (@dgolansky-ux).
9. **All conversations must be resolved** before merge.
10. **BRAMKA_COMPLETE is still forbidden** until the full acceptance matrix passes.

## Branch naming convention

- `governance/*` — governance/guard/policy changes
- `feat/*` — new domain features (when allowed)
- `fix/*` — bug fixes
- `repair/*` — guard/infrastructure repairs
- `test/*` — test additions
- `docs/*` — documentation changes

## Commit message convention

Type(scope): description

Allowed types: feat, fix, refactor, test, docs, chore, repair
Allowed scopes: v2, governance, guards, architecture, routing, identity, social, content, media, system, ci, docs
