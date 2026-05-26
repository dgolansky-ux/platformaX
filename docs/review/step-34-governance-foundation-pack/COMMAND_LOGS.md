# STEP 34 — Command Logs

## Gate Results

| Gate | Command | Exit Code | Notes |
|---|---|---|---|
| TypeScript check | `pnpm check` | 0 | PASS |
| ESLint | `pnpm lint` | 0 | PASS, --max-warnings=0 |
| Tests | `pnpm test` | 0 | 447/447 tests PASS |
| Build | `pnpm build` | 0 | PASS, 3 chunks |
| Rules check | `pnpm rules:check` | 0 | 33/33 guards PASS |

## New Guard Scripts

| Guard | Exit Code | Output |
|---|---|---|
| check-governance-registry.mjs | 0 | 25 rules validated |
| check-guards-registry.mjs | 0 | 37 guards validated |
| check-rules-to-guards-coverage.mjs | 0 | 20 P0 active rules checked |
| check-domain-status-registry.mjs | 0 | 15 domains validated |
| check-ai-agent-permissions.mjs | 0 | PASS with 6 warnings |

## Branch Info

```
Branch: chore/governance-foundation-pack
Base: main (5d8d394)
```
