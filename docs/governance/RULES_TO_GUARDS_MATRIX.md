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
| PX-CODE-001 | No functions over 80 lines | coding-standards | check-file-complexity, check-code-quality-structure, check-file-size-limits | NO | — |
| PX-CODE-002 | No components over 140 lines | coding-standards | check-file-complexity, check-code-quality-structure, check-file-size-limits | NO | — |
| PX-CODE-003 | No as any without exception | coding-standards | check-code-quality-structure | NO | — |
| PX-CODE-004 | No transition all in CSS | coding-standards | check-frontend-performance-patterns | NO | — |
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
| PX-GOV-005 | No governance drift | HIDDEN_RULES_INVENTORY | check-governance-drift | NO | — |
| PX-OWN-001 | Resource owner model | BACKEND_ARCHITECTURE_INVARIANTS | manual_gate | YES | TODO_GUARD: check-backend-ownership-invariants |
| PX-OWN-002 | viewerContext on public reads | BACKEND_ARCHITECTURE_INVARIANTS | manual_gate | YES | MANUAL_GATE_REQUIRED |
| PX-VIS-001 | Visibility matrix | BACKEND_ARCHITECTURE_INVARIANTS | manual_gate, PX-POLICY-001 | YES | Policy tests per field |
| PX-DTO-002 | Public DTO zero PII extended | BACKEND_ARCHITECTURE_INVARIANTS | check-public-dto-pii, check-dto-privacy-classification | NO | Extends PX-SEC-001 |
| PX-CTX-001 | Resource context refs | BACKEND_ARCHITECTURE_INVARIANTS | manual_gate | YES | MANUAL_GATE_REQUIRED |
| PX-MEDIA-004 | Media attach owner/purpose | BACKEND_ARCHITECTURE_INVARIANTS | manual_gate, check-media-base64 | YES | Attach path tests required |
| PX-LIST-004 | limit/cursor/stable order | BACKEND_ARCHITECTURE_INVARIANTS | check-pagination, check-scalability-patterns, check-scalability-hot-paths | NO | Extends PX-LIST-001 |
| PX-DB-004 | No raw DB outside domain | BACKEND_ARCHITECTURE_INVARIANTS | audit-domain-boundaries, check-architecture-import-graph | NO | — |
| PX-EVENT-001 | EventEnvelope + outbox fanout | BACKEND_ARCHITECTURE_INVARIANTS, ADR-009 | check-scalability-hot-paths, manual_gate | PARTIAL | TODO_GUARD: check-event-envelope-contract |
| PX-EVENT-002 | Transactional outbox same TX | ADR-009 | manual_gate | YES | TODO_GUARD: outbox transaction pattern |
| PX-LC-001 | Explicit lifecycle statuses | BACKEND_ARCHITECTURE_INVARIANTS | manual_gate | YES | MANUAL_GATE_REQUIRED |
| PX-IDEMP-001 | Idempotency retry writes | BACKEND_ARCHITECTURE_INVARIANTS, ADR-015 | manual_gate | YES | TODO_GUARD: check-idempotency-flows |
| PX-AIS-002 | Architecture Impact Statement | BACKEND_ARCHITECTURE_INVARIANTS | check-adr-required, manual_gate | PARTIAL | PR body / step report |
| PX-APP-001 | application-v2 use-cases | active-rules §10, ADR-010 | manual_gate | YES | TODO_GUARD: check-application-use-cases-boundary |
| PX-READMODEL-001 | Single read-model owner | ADR-011 | manual_gate | YES | MANUAL_GATE_REQUIRED |
| PX-CONTRACT-001 | Public DTO contract tests | coding-standards | manual_gate, check-public-dto-pii | PARTIAL | TODO_GUARD: check-public-dto-contract-tests |
| PX-ID-001 | Branded ID types | ADR-012 | manual_gate | YES | TODO_GUARD: check-branded-id-types |
| PX-ERROR-001 | Result/DomainError boundary | ADR-012 | manual_gate | YES | MANUAL_GATE_REQUIRED |
| PX-CURSOR-001 | Opaque cursor | ADR-013, BACKEND_ARCHITECTURE_INVARIANTS | check-pagination, check-scalability-patterns | PARTIAL | Offset ban manual on new endpoints |
| PX-LIFECYCLE-001 | status + deletedAt | active-rules §10 | manual_gate | YES | Aligns PX-LC-001 |
| PX-IDEMPOTENCY-001 | Idempotency table | ADR-015 | manual_gate | YES | Aligns PX-IDEMP-001 |
| PX-POLICY-001 | Pure policy functions | ADR-014 | manual_gate | YES | TODO_GUARD: check-policy-pure-functions |
| PX-UI-001 | Design tokens | PROFILE_BLUEPRINT | manual_gate | YES | Visual review |
| PX-UI-002 | Presentational/container | coding-standards | manual_gate | YES | TODO_GUARD: presentational boundary |
| PX-OBS-003 | Correlation ID | active-rules §10 | manual_gate | YES | TODO_GUARD: check-correlation-id-boundary |
| PX-SEED-001 | Deterministic PII-safe seeds | active-rules §10 | check-test-env-safety, manual_gate | PARTIAL | TODO_GUARD: check-deterministic-seeds |

## Summary

- **Total rules:** 73
- **Fully automated (manual-gate column = NO):** 46
- **Manual gate only (YES):** 22
- **Partial automation (PARTIAL):** 5
- **Documented governance gaps (TODO_GUARD):** 11 — see rows marked TODO_GUARD; P0 rules retain manual_gate until guards land

## Gap Analysis

The 4 gaps are inherently non-automatable:
1. **PX-PROFILE-001**: Visual parity requires screenshots — no code can verify pixel match.
2. **PX-PROFILE-002**: Domain structure review — partially coverable by domain-scaffold but needs human judgment.
3. **PX-AI-001**: Agent reading docs — agent self-reports in baseline section.
4. **PX-AI-003**: Agent stopping when blocked — agent must demonstrate honest behavior.

These are appropriately covered by `manual_gate` and report requirements.
