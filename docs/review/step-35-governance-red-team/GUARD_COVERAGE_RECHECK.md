# Step 35 — Guard Coverage Recheck

## P0 Rules Coverage (all must have guard or manual_gate)

| Rule ID | Title | Severity | Has guard? | Has manual_gate? | Coverage OK? |
|---|---|---|---|---|---|
| PX-GOV-001 | No fake DONE | P0 | check-fake-done, check-status-truth-consistency | — | YES |
| PX-GOV-002 | No weakened guards | P0 | check-script-safety | manual_gate | YES |
| PX-GOV-003 | No --no-verify | P0 | check-ai-agent-permissions | manual_gate | YES |
| PX-GOV-004 | No direct push to main | P0 | branch-protection, check-ai-agent-permissions | — | YES |
| PX-ARCH-001 | V2-first no legacy | P0 | check-no-legacy-imports, check-removed-product-areas, check-build-artifacts | — | YES |
| PX-ARCH-002 | Legacy source only | P0 | check-no-legacy-imports | — | YES |
| PX-ARCH-003 | Cross-domain public-api | P0 | audit-domain-boundaries | — | YES |
| PX-ARCH-004 | No domain internals | P0 | audit-domain-boundaries | — | YES |
| PX-STATUS-001 | Status truth required | P0 | check-domain-status, check-fake-done, check-status-truth-consistency | — | YES |
| PX-STATUS-002 | No VISUAL_DONE w/o evidence | P0 | check-fake-done | manual_gate | YES |
| PX-STATUS-003 | No BACKEND_DONE w/o evidence | P0 | check-fake-done | manual_gate | YES |
| PX-SEC-001 | No public PII | P0 | check-public-dto-pii, check-logging-pii-security | — | YES |
| PX-SEC-002 | No secrets in repo | P0 | check-env-safety, check-secret-scan, check-local-secret-scan, check-diff-safety | — | YES |
| PX-MEDIA-001 | No base64 uploads | P0 | check-media-base64 | — | YES |
| PX-LIST-001 | Lists require limit | P0 | check-pagination, check-scalability-patterns | — | YES |
| PX-INFRA-001 | No Railway w/o decision | P0 | check-ai-agent-permissions | manual_gate | YES |
| PX-INFRA-002 | No live db push | P0 | check-supabase-migrations-safety, check-ai-agent-permissions | manual_gate | YES |
| PX-AI-001 | Agent reads governance | P0 | — | manual_gate | YES |
| PX-AI-002 | Agent self-audit | P0 | check-self-audit-evidence | — | YES |
| PX-AI-003 | Agent BLOCKED on conflict | P0 | — | manual_gate | YES |

## Summary

- **P0 rules:** 20
- **P0 with automated guard:** 17
- **P0 with manual_gate only:** 3 (PX-AI-001, PX-AI-003, PX-GOV-002 partial)
- **P0 without any enforcement:** 0
- **Guard coverage:** 100%

## Guards strengthened in step-35

| Guard | Change |
|---|---|
| `check-ai-agent-permissions.mjs` | Wildcards → violation (was warning) |
| `check-domain-status-registry.mjs` | Cross-validates domain-registry.ts statuses |
