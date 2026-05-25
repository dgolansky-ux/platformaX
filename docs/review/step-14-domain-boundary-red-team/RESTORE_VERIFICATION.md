# Step 14 — Restore Verification

All 12 red-team violations were injected temporarily and restored immediately after each test.

## Restore confirmation

| Test | Violation injected | Restored | Guard PASS after restore |
|---|---|---|---|
| 1 | random-new-domain folder | Deleted | check-domain-registry PASS |
| 2 | ghost-domain in registry | Reverted | check-domain-registry PASS |
| 3 | channels/public-api.ts renamed | Restored | check-domain-scaffold PASS |
| 4 | channels README BACKEND_DONE | Reverted | check-fake-done PASS |
| 5 | identity imports social/repository | Reverted | audit-domain-boundaries PASS |
| 6 | identity imports social/public-api | Reverted (allowed test) | audit-domain-boundaries PASS |
| 7 | public-hub imports modules/repository | Reverted | audit-domain-boundaries PASS |
| 8 | modules imports events/repository | Reverted | audit-domain-boundaries PASS |
| 9 | content-v2 feature imports social/repository | Reverted | audit-domain-boundaries PASS |
| 10 | shared-ui imports identity/repository | Reverted | check-feature-registry PASS |
| 11 | app-v2 legacy routes | Deleted | check-removed-product-areas PASS |
| 12 | content-v2 imports communities-v2/service | Reverted | audit-domain-boundaries PASS |

## Final state

```
$ git status
nothing to commit, working tree clean
```

All line-ending artifacts from PowerShell Set-Content were cleaned with `git checkout --`.

## Final gates after full restore

All gates PASS: rules:check (17/17), arch:check:v2 (9/9), guards:domains, guards:all-local.
