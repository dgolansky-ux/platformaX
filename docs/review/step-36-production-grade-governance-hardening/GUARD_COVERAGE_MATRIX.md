# Step 36 — Guard Coverage Matrix

## Full Coverage After Step 36

| Rule ID | Title | Guard Script | Automated? |
|---|---|---|---|
| PX-GOV-001 | No fake DONE | check-fake-done, check-status-truth-consistency | YES |
| PX-GOV-002 | No weakened guards | check-script-safety, manual_gate | YES+MANUAL |
| PX-GOV-003 | No --no-verify | check-ai-agent-permissions, manual_gate | YES+MANUAL |
| PX-GOV-004 | No direct push to main | branch-protection, check-ai-agent-permissions | YES |
| PX-ARCH-001 | V2-first | check-no-legacy-imports, check-removed-product-areas, check-build-artifacts | YES |
| PX-ARCH-002 | Legacy source material only | check-no-legacy-imports | YES |
| PX-ARCH-003 | Cross-domain via public-api only | audit-domain-boundaries | YES |
| PX-ARCH-004 | No domain internals imports | audit-domain-boundaries | YES |
| PX-ARCH-005 | Domain ownership source of truth | check-domain-registry, manual_gate | YES+MANUAL |
| PX-ARCH-006 | app-v2 composition layer | audit-domain-boundaries | YES |
| PX-ARCH-007 | features-v2 isolation | audit-domain-boundaries | YES |
| **PX-ARCH-008** | **No circular domain deps** | **check-architecture-import-graph** | **YES** |
| **PX-ARCH-009** | **Import graph matches ownership** | **check-architecture-import-graph** | **YES** |
| PX-STATUS-001 | Status truth required | check-domain-status, check-fake-done, check-status-truth-consistency | YES |
| PX-STATUS-002 | No VISUAL_DONE without evidence | check-fake-done, manual_gate | YES+MANUAL |
| PX-STATUS-003 | No BACKEND_DONE without evidence | check-fake-done, check-runtime-readiness-status, manual_gate | YES+MANUAL |
| **PX-RUNTIME-001** | **PARTIAL requires runtime evidence** | **check-runtime-readiness-status** | **YES** |
| **PX-RUNTIME-002** | **IMPLEMENTED requires full evidence** | **check-runtime-readiness-status** | **YES** |
| PX-SEC-001 | No public PII | check-public-dto-pii, check-logging-pii-security | YES |
| PX-SEC-002 | No secrets in repo/logs/ZIP | check-env-safety, check-secret-scan, check-local-secret-scan, check-diff-safety | YES |
| PX-MEDIA-001 | No base64 runtime uploads | check-media-base64 | YES |
| PX-LIST-001 | Lists require limit/cursor | check-pagination, check-scalability-patterns | YES |
| PX-PROFILE-001 | Profile visual parity 1:1 | manual_gate | MANUAL |
| PX-PROFILE-002 | Professional is identity layer | manual_gate | MANUAL |
| PX-INFRA-001 | No Railway without decision | check-ai-agent-permissions, manual_gate | YES+MANUAL |
| PX-INFRA-002 | No live db push without decision | check-supabase-migrations-safety, check-ai-agent-permissions | YES |
| PX-AI-001 | Agent reads governance first | manual_gate | MANUAL |
| PX-AI-002 | Agent self-audit before DONE | check-self-audit-evidence | YES |
| PX-AI-003 | Agent BLOCKED when rules conflict | manual_gate | MANUAL |
| **PX-DB-001** | **No live db push without decision** | **check-migration-safety, manual_gate** | **YES+MANUAL** |
| **PX-DB-002** | **Migrations require safety review** | **check-migration-safety** | **YES** |
| **PX-DB-003** | **No destructive migration without approval** | **check-migration-safety** | **YES** |
| **PX-DEPS-001** | **No dependency changes without decision** | **check-dependency-change-policy** | **YES** |
| **PX-ADR-001** | **Architecture changes require ADR** | **check-adr-required** | **YES** |
| **PX-OBS-001** | **No unsafe console logging in runtime** | **check-observability-logging** | **YES** |
| **PX-OBS-002** | **No PII in logs/errors/audit** | **check-observability-logging** | **YES** |
| **PX-EXC-001** | **Exceptions require full metadata** | **check-exception-expiry** | **YES** |
| **PX-EXC-002** | **Expired exceptions fail gates** | **check-exception-expiry** | **YES** |
| **PX-DTO-001** | **Public DTO privacy classification** | **check-dto-privacy-classification** | **YES** |
| **PX-SCALE-001** | **No sync fanout in request path** | **check-scalability-hot-paths** | **YES** |
| **PX-SCALE-002** | **No unbounded hot-path loops** | **check-scalability-hot-paths** | **YES** |
| **PX-SCALE-003** | **No full scans for runtime lists** | **check-scalability-hot-paths** | **YES** |

## Summary

- **Total rules:** 42
- **Fully automated:** 34
- **Automated + manual gate:** 4
- **Manual gate only:** 4
- **Total guards:** 46 (37 existing + 9 new)
