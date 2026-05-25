# Step 14 — Domain Boundary Red-Team Report

Generated: 2026-05-25T09:24Z

## Repository state

| Item | Value |
|---|---|
| Branch | `main` |
| Latest commit | `f7a6232 docs(architecture): verify full domain baseline after CI repair` |
| Working tree | clean |

## Red-team summary: 12/12 PASS

All 12 domain boundary tests caught their violations:

| # | Test | Guard | Caught |
|---|---|---|---|
| 1 | Unknown backend domain | check-domain-registry | YES |
| 2 | Registry entry without folder | check-domain-registry | YES |
| 3 | Missing required file | check-domain-scaffold | YES |
| 4 | Fake status BACKEND_DONE | check-fake-done | YES |
| 5 | Cross-domain repository import | audit-domain-boundaries | YES |
| 6 | Allowed public-api import | audit-domain-boundaries | YES (correctly PASS) |
| 7 | public-hub ownership violation | audit-domain-boundaries | YES |
| 8 | modules scope violation | audit-domain-boundaries | YES |
| 9 | Frontend cross-domain internal | audit-domain-boundaries | YES |
| 10 | shared-ui domain logic | check-feature-registry | YES |
| 11 | app-v2 legacy routes | check-removed-product-areas | YES |
| 12 | content-v2 god-domain risk | audit-domain-boundaries | YES |

## Guards coverage

| Guard | Tests covered | Result |
|---|---|---|
| check-domain-registry.mjs | 1, 2 | Both caught |
| check-domain-scaffold.mjs | 3 | Caught |
| check-fake-done.mjs | 4 | Caught |
| audit-domain-boundaries.mjs | 5, 6, 7, 8, 9, 12 | All caught (6 correctly allowed) |
| check-feature-registry.mjs | 10 | Caught |
| check-removed-product-areas.mjs | 11 | Caught (3 violations) |

## Blockers

```
NO_DOMAIN_BOUNDARY_BLOCKERS
```

## Final status

```
DOMAIN_BOUNDARY_RED_TEAM_PASSED
```
