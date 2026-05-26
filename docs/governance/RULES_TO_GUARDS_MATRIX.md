# PlatformaX V2 — Rules to Guards Coverage Matrix

Status: `ACTIVE`
Owner: Governance

## Purpose

Maps every rule to its enforcement mechanism. Identifies coverage gaps.

## Matrix

| Rule ID | Rule Title | Source Doc | Enforced By | Gap? | Required Improvement |
|---|---|---|---|---|---|
| PX-GOV-001 | No fake DONE | active-rules §7 | check-fake-done, check-status-truth-consistency | NO | — |
| PX-GOV-002 | No weakened guards | active-rules §9 | check-script-safety, manual_gate | NO | — |
| PX-GOV-003 | No --no-verify | coding-standards §15 | check-ai-agent-permissions, manual_gate | NO | — |
| PX-GOV-004 | No direct push to main | coding-standards §15 | branch-protection, check-ai-agent-permissions | NO | — |
| PX-ARCH-001 | V2-first | active-rules §5 | check-no-legacy-imports, check-removed-product-areas, check-build-artifacts | NO | — |
| PX-ARCH-002 | Legacy source material only | legacy-containment §2 | check-no-legacy-imports | NO | — |
| PX-ARCH-003 | Cross-domain via public-api only | active-rules §3 | audit-domain-boundaries | NO | — |
| PX-ARCH-004 | No domain internals imports | architecture-enforcement §5 | audit-domain-boundaries | NO | — |
| PX-ARCH-005 | Domain ownership source of truth | active-rules §4 | check-domain-registry, manual_gate | NO | — |
| PX-ARCH-006 | app-v2 composition layer | architecture-enforcement §6 | audit-domain-boundaries | NO | — |
| PX-ARCH-007 | features-v2 isolation | architecture-enforcement §6 | audit-domain-boundaries | NO | — |
| PX-STATUS-001 | Status truth required | domain-status §1 | check-domain-status, check-fake-done, check-status-truth-consistency | NO | — |
| PX-STATUS-002 | No VISUAL_DONE without evidence | domain-status §3 | check-fake-done, manual_gate | NO | — |
| PX-STATUS-003 | No BACKEND_DONE without evidence | domain-status §3 | check-fake-done, manual_gate | NO | — |
| PX-SEC-001 | No public PII | active-rules §2 | check-public-dto-pii, check-logging-pii-security | NO | — |
| PX-SEC-002 | No secrets in repo/logs/ZIP | SECRET_HANDLING_POLICY | check-env-safety, check-secret-scan, check-local-secret-scan, check-diff-safety | NO | — |
| PX-MEDIA-001 | No base64 runtime uploads | active-rules §2 | check-media-base64 | NO | — |
| PX-LIST-001 | Lists require limit/cursor | active-rules §2 | check-pagination, check-scalability-patterns | NO | — |
| PX-PROFILE-001 | Profile visual parity 1:1 | PROFILE_BLUEPRINT | manual_gate | YES | Requires manual visual comparison — no automated guard possible |
| PX-PROFILE-002 | Professional is identity layer | PROFILE_BLUEPRINT §0 | manual_gate | YES | Structural review — could add domain-scaffold check |
| PX-INFRA-001 | No Railway without decision | AI_FORBIDDEN_ACTIONS | check-ai-agent-permissions, manual_gate | NO | — |
| PX-INFRA-002 | No live db push without decision | AI_FORBIDDEN_ACTIONS | check-supabase-migrations-safety, check-ai-agent-permissions | NO | — |
| PX-AI-001 | Agent reads governance first | AGENT_OPERATING_STANDARD | manual_gate | YES | Cannot be automated — agent must self-report |
| PX-AI-002 | Agent self-audit before DONE | AGENT_SELF_AUDIT_PROTOCOL | check-self-audit-evidence | NO | — |
| PX-AI-003 | Agent BLOCKED when rules conflict | AI_FORBIDDEN_ACTIONS | manual_gate | YES | Cannot be automated — agent must self-report |

| PX-ARCH-008 | No circular domain dependencies | architecture-enforcement §5 | check-architecture-import-graph | NO | — |
| PX-ARCH-009 | Import graph matches domain ownership | DOMAIN_OWNERSHIP_MATRIX | check-architecture-import-graph | NO | — |
| PX-RUNTIME-001 | PARTIAL requires runtime evidence | domain-status §6 | check-runtime-readiness-status | NO | — |
| PX-RUNTIME-002 | IMPLEMENTED requires full evidence | domain-status §6 | check-runtime-readiness-status | NO | — |
| PX-DB-001 | No live db push without decision | AI_FORBIDDEN_ACTIONS | check-migration-safety, manual_gate | NO | — |
| PX-DB-002 | Migrations require safety review | AI_AGENT_PERMISSIONS | check-migration-safety | NO | — |
| PX-DB-003 | No destructive migration without approval | AI_AGENT_PERMISSIONS | check-migration-safety | NO | — |
| PX-DEPS-001 | No dependency changes without decision | coding-standards §22 | check-dependency-change-policy | NO | — |
| PX-ADR-001 | Arch changes require ADR decision | execution-map | check-adr-required | NO | — |
| PX-OBS-001 | No unsafe console logging in runtime | coding-standards §17 | check-observability-logging | NO | — |
| PX-OBS-002 | No PII in logs/errors/audit | coding-standards §17 | check-observability-logging, check-logging-pii-security | NO | — |
| PX-EXC-001 | Exceptions require full metadata | EXCEPTIONS_REGISTER | check-exception-expiry | NO | — |
| PX-EXC-002 | Expired exceptions fail gates | EXCEPTIONS_REGISTER | check-exception-expiry | NO | — |
| PX-DTO-001 | Public DTO privacy classification | architecture-enforcement §8 | check-dto-privacy-classification | NO | — |
| PX-SCALE-001 | No sync fanout in request path | coding-standards §22 | check-scalability-hot-paths | NO | — |
| PX-SCALE-002 | No unbounded hot-path loops | coding-standards §22 | check-scalability-hot-paths | NO | — |
| PX-SCALE-003 | No full scans for runtime lists | coding-standards §22 | check-scalability-hot-paths, check-pagination | NO | — |

## Summary

- **Total rules:** 42
- **Fully automated:** 34
- **Automated + manual gate:** 4
- **Manual gate only:** 4
- **Gaps requiring improvement:** 4 (all inherently manual — visual parity, agent behavior)

## Gap Analysis

The 4 gaps are inherently non-automatable:
1. **PX-PROFILE-001**: Visual parity requires screenshots — no code can verify pixel match.
2. **PX-PROFILE-002**: Domain structure review — partially coverable by domain-scaffold but needs human judgment.
3. **PX-AI-001**: Agent reading docs — agent self-reports in baseline section.
4. **PX-AI-003**: Agent stopping when blocked — agent must demonstrate honest behavior.

These are appropriately covered by `manual_gate` and report requirements.
