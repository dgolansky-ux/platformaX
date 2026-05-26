# PlatformaX V2 — Governance Index

Status: `ACTIVE`
Owner: Architecture / Governance

## Purpose

Central map of all governance rules, organized by category. Every rule has a stable ID in `RULES_REGISTRY.yml`.

---

## P0 Hard Rules (non-negotiable)

| ID | Rule | Source |
|---|---|---|
| PX-GOV-001 | No fake DONE | PlatformaX-V2-active-rules.md §7 |
| PX-GOV-002 | No weakened guards | PlatformaX-V2-active-rules.md §9 |
| PX-GOV-003 | No --no-verify | PlatformaX-V2-coding-standards.md §15 |
| PX-GOV-004 | No direct push to main | PlatformaX-V2-coding-standards.md §15 |
| PX-SEC-001 | No public PII | PlatformaX-V2-active-rules.md §2 |
| PX-SEC-002 | No secrets in repo/logs/ZIP | SECRET_HANDLING_POLICY.md |
| PX-MEDIA-001 | No base64/dataUrl/readAsDataURL runtime uploads | PlatformaX-V2-active-rules.md §2 |
| PX-AI-001 | Agent must read governance first | AGENT_OPERATING_STANDARD.md §2 |
| PX-AI-002 | Agent must self-audit before DONE | AGENT_SELF_AUDIT_PROTOCOL.md |
| PX-AI-003 | Agent must stop as BLOCKED when rules conflict | AI_FORBIDDEN_ACTIONS.md §2 |

## Architecture Rules

| ID | Rule | Source |
|---|---|---|
| PX-ARCH-001 | V2-first: no legacy runtime | PlatformaX-V2-active-rules.md §5 |
| PX-ARCH-002 | Legacy is source material only | PlatformaX-V2-legacy-containment.md §2 |
| PX-ARCH-003 | Cross-domain only via public-api/contracts/events/outbox | PlatformaX-V2-active-rules.md §3 |
| PX-ARCH-004 | No domain internals imports | PlatformaX-V2-architecture-enforcement.md §5 |
| PX-ARCH-005 | Domain ownership is source of truth | PlatformaX-V2-active-rules.md §4 |
| PX-ARCH-006 | app-v2 is composition layer only | PlatformaX-V2-architecture-enforcement.md §6 |
| PX-ARCH-007 | features-v2 isolation: no cross-feature internals | PlatformaX-V2-architecture-enforcement.md §6 |

## Coding Standards

| ID | Rule | Source |
|---|---|---|
| PX-CODE-001 | No functions over 80 lines | PlatformaX-V2-coding-standards.md §6 |
| PX-CODE-002 | No components over 140 lines | PlatformaX-V2-coding-standards.md §6 |
| PX-CODE-003 | No `as any` without exception block | PlatformaX-V2-coding-standards.md §3 |
| PX-CODE-004 | No `transition: all` | PlatformaX-V2-coding-standards.md §22 |

## Status / Evidence Rules

| ID | Rule | Source |
|---|---|---|
| PX-STATUS-001 | Status truth required — status must match evidence | PlatformaX-V2-domain-status.md §1 |
| PX-STATUS-002 | No VISUAL_DONE without screenshots/manual evidence | PlatformaX-V2-domain-status.md §3 |
| PX-STATUS-003 | No BACKEND_DONE without runtime evidence | PlatformaX-V2-domain-status.md §3 |

## Domain Rules

| ID | Rule | Source |
|---|---|---|
| PX-LIST-001 | Runtime lists/feed/search require limit/cursor/fixed cap | PlatformaX-V2-active-rules.md §2 |

## Profile Rules

| ID | Rule | Source |
|---|---|---|
| PX-PROFILE-001 | Profile personal/professional visual parity 1:1 | PROFILE_BLUEPRINT_MOBILE_FIRST.md §1.1 |
| PX-PROFILE-002 | Professional profile is layer of personal profile in identity | PROFILE_BLUEPRINT_MOBILE_FIRST.md §0 |

## Infrastructure Rules

| ID | Rule | Source |
|---|---|---|
| PX-INFRA-001 | No Railway without separate decision | AI_FORBIDDEN_ACTIONS.md §2 |
| PX-INFRA-002 | No live db push/migration without separate decision | AI_FORBIDDEN_ACTIONS.md §2 |

## AI Agent Rules

| ID | Rule | Source |
|---|---|---|
| PX-AI-001 | Agent must read governance first | AGENT_OPERATING_STANDARD.md §2 |
| PX-AI-002 | Agent must self-audit before DONE | AGENT_SELF_AUDIT_PROTOCOL.md |
| PX-AI-003 | Agent must stop as BLOCKED when rules conflict | AI_FORBIDDEN_ACTIONS.md §2 |

## Architecture Import Graph Rules

| ID | Rule | Source |
|---|---|---|
| PX-ARCH-008 | No circular domain dependencies | PlatformaX-V2-architecture-enforcement.md §5 |
| PX-ARCH-009 | Import graph must match domain ownership | DOMAIN_OWNERSHIP_MATRIX.md |

## Runtime Readiness Status Rules

| ID | Rule | Source |
|---|---|---|
| PX-RUNTIME-001 | PARTIAL requires real runtime evidence | PlatformaX-V2-domain-status.md §6 |
| PX-RUNTIME-002 | IMPLEMENTED requires full runtime evidence | PlatformaX-V2-domain-status.md §6 |

## Database / Migration Safety Rules

| ID | Rule | Source |
|---|---|---|
| PX-DB-001 | No live db push without separate decision | AI_AGENT_PERMISSIONS_POLICY.md |
| PX-DB-002 | Migrations require safety review | AI_AGENT_PERMISSIONS_POLICY.md |
| PX-DB-003 | No destructive migration without manual approval | AI_AGENT_PERMISSIONS_POLICY.md |

## Dependency Change Policy Rules

| ID | Rule | Source |
|---|---|---|
| PX-DEPS-001 | No dependency changes without dependency decision | PlatformaX-V2-coding-standards.md §22 |

## ADR Required Rules

| ID | Rule | Source |
|---|---|---|
| PX-ADR-001 | Architecture-impacting changes require ADR decision | PlatformaX-V2-execution-map.md |

## Observability / Logging Safety Rules

| ID | Rule | Source |
|---|---|---|
| PX-OBS-001 | No unsafe console logging in runtime code | PlatformaX-V2-coding-standards.md §17 |
| PX-OBS-002 | No PII in logs/errors/audit output | PlatformaX-V2-coding-standards.md §17 |

## Exception Expiry Rules

| ID | Rule | Source |
|---|---|---|
| PX-EXC-001 | Exceptions require owner, reason, expiry, risk, evidence | EXCEPTIONS_REGISTER.md |
| PX-EXC-002 | Expired exceptions fail gates | EXCEPTIONS_REGISTER.md |

## DTO Privacy Classification Rules

| ID | Rule | Source |
|---|---|---|
| PX-DTO-001 | Public DTO fields require privacy classification | PlatformaX-V2-architecture-enforcement.md §8 |

## Scalability Hot Path Rules

| ID | Rule | Source |
|---|---|---|
| PX-SCALE-001 | No sync fanout in request path | PlatformaX-V2-coding-standards.md §22 |
| PX-SCALE-002 | No unbounded hot-path loops | PlatformaX-V2-coding-standards.md §22 |
| PX-SCALE-003 | No full scans for runtime list/feed/search | PlatformaX-V2-coding-standards.md §22 |

## AI PR Merge Policy

| ID | Rule | Source |
|---|---|---|
| PX-GOV-006 | Controlled AI PR merge — requires explicit owner instruction and green gates | AI_AGENT_PERMISSIONS_POLICY.md |

## Governance Anti-Drift Rules

| ID | Rule | Source |
|---|---|---|
| PX-GOV-005 | No governance drift — normative rules require Rule ID or link | HIDDEN_RULES_INVENTORY.md |

## Gates / CI Rules

See `GUARDS_REGISTRY.yml` for full guard inventory.
See `RULES_TO_GUARDS_MATRIX.md` for coverage gaps.

## Exceptions

See `EXCEPTIONS_REGISTER.md`. Default: no active exceptions.
