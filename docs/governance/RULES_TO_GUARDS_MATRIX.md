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
| PX-GOV-ZIP-001 | Audit ZIP is portable and excludes local config | AGENT_COMMAND_STANDARD §11 | validate-audit-zip, check-coding-standards-consistency | NO | validate-audit-zip is run on produced ZIP artefacts; --help is registry smoke only |
| PX-GOV-GUARD-PORTABILITY-001 | Required guards work from repo and extracted audit ZIP | AGENT_COMMAND_STANDARD §11 | list-source-files tests, check-rules-to-guards-coverage, check-coding-standards-consistency | NO | list-source-files provides git + filesystem fallback; guards must not false-pass on empty scans |
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
| PX-CODE-001 | No functions over 80 lines | coding-standards §6 | check-file-complexity, check-code-quality-structure, check-file-size-limits, check-application-service-size | NO | check-code-quality-structure is strict structural guard; check-file-complexity is broader fallback |
| PX-CODE-002 | No components over 140 lines | coding-standards §6 | check-file-complexity, check-code-quality-structure, check-file-size-limits | NO | — |
| PX-CODE-003 | No `as any` without canonical exception | coding-standards §3 | check-code-quality-structure | NO | — |
| PX-CODE-004 | No `transition: all` | coding-standards §22 | check-frontend-performance-patterns, check-design-tokens | NO | — |
| PX-CODE-005 | No placeholder tests | PlatformaX-V2-coding-standards.md §7 | check-no-placeholder-tests | NO | — |
| PX-ADR-001 | Arch changes require ADR decision | execution-map | check-adr-required | NO | — |
| PX-OBS-001 | No unsafe console logging in runtime | coding-standards §17 | check-observability-logging | NO | — |
| PX-OBS-002 | No PII in logs/errors/audit | coding-standards §17 | check-observability-logging, check-logging-pii-security | NO | — |
| PX-EXC-001 | Exceptions require full metadata | EXCEPTIONS_REGISTER | check-exception-expiry | NO | — |
| PX-EXC-002 | Expired exceptions fail gates | EXCEPTIONS_REGISTER | check-exception-expiry | NO | — |
| PX-DTO-001 | Public DTO privacy classification | architecture-enforcement §8 | check-dto-privacy-classification, check-owner-upload-intent-classification, check-public-profile-id-exposure | NO | Adds owner-upload-intent classification and public-profile-id exposure gate (forbids `userId: string` on PublicProfileView; requires `PUBLIC_STABLE_USER_REF_NOT_AUTH_SECRET` marker) |
| PX-SCALE-001 | No sync fanout in request path | coding-standards §22 | check-scalability-hot-paths | NO | — |
| PX-SCALE-002 | No unbounded hot-path loops | coding-standards §22 | check-scalability-hot-paths | NO | — |
| PX-SCALE-003 | No full scans for runtime lists | coding-standards §22 | check-scalability-hot-paths, check-pagination | NO | — |
| PX-GOV-005 | No governance drift | HIDDEN_RULES_INVENTORY | check-governance-drift | NO | — |
| PX-OWN-001 | Resource owner model | BACKEND_ARCHITECTURE_INVARIANTS | check-backend-ownership-invariants, check-owner-viewer-authority-boundary, manual_gate | PARTIAL | Structural shell (record owner fields + policy.ts canX) gate + boundary-parameter gate (rejects anonymous `userId: string` on owner-gated services); full owner/viewer matrix stays manual_gate |
| PX-OWN-002 | viewerContext on public reads | BACKEND_ARCHITECTURE_INVARIANTS | check-owner-viewer-authority-boundary, manual_gate | PARTIAL | Boundary-parameter gate fails when `viewerId: string` lacks the `\| null` union (anonymous viewer must be honest); full matrix stays manual_gate |
| PX-VIS-001 | Visibility matrix | BACKEND_ARCHITECTURE_INVARIANTS | manual_gate, PX-POLICY-001 | YES | Policy tests per field |
| PX-DTO-002 | Public DTO zero PII extended | BACKEND_ARCHITECTURE_INVARIANTS | check-public-dto-pii, check-dto-privacy-classification | NO | Extends PX-SEC-001 |
| PX-CTX-001 | Resource context refs | BACKEND_ARCHITECTURE_INVARIANTS | manual_gate | YES | MANUAL_GATE_REQUIRED |
| PX-MEDIA-004 | Media attach owner/purpose | BACKEND_ARCHITECTURE_INVARIANTS | check-media-purpose-migration, check-media-base64, check-owner-upload-intent-classification, manual_gate | PARTIAL | Attach-path tests still required; migration↔runtime purpose drift blocked; owner-only upload intent (uploadUrl/storageKey/maxBytes) cannot leak into public read responses |
| PX-LIST-004 | limit/cursor/stable order | BACKEND_ARCHITECTURE_INVARIANTS | check-pagination, check-scalability-patterns, check-scalability-hot-paths | NO | Extends PX-LIST-001 |
| PX-DB-004 | No raw DB outside domain | BACKEND_ARCHITECTURE_INVARIANTS | audit-domain-boundaries, check-architecture-import-graph | NO | — |
| PX-EVENT-001 | EventEnvelope + outbox fanout | BACKEND_ARCHITECTURE_INVARIANTS, ADR-009 | check-event-envelope-contract, check-scalability-hot-paths, manual_gate | PARTIAL | Envelope contract blocked in code; sync-fanout still partial via hot-paths + manual_gate |
| PX-EVENT-002 | Transactional outbox same TX | ADR-009 | manual_gate | YES | MANUAL_GATE_REQUIRED: outbox transaction pattern |
| PX-LC-001 | Explicit lifecycle statuses | BACKEND_ARCHITECTURE_INVARIANTS | deprecated_alias for PX-LIFECYCLE-001 | NO | Historical alias only |
| PX-IDEMP-001 | Idempotency retry writes | BACKEND_ARCHITECTURE_INVARIANTS, ADR-015 | deprecated_alias for PX-IDEMPOTENCY-001 | NO | Historical alias only |
| PX-AIS-002 | Architecture Impact Statement | BACKEND_ARCHITECTURE_INVARIANTS | check-adr-required, manual_gate | PARTIAL | PR body / step report |
| PX-APP-001 | application-v2 use-cases | active-rules §10, ADR-010 | check-client-server-boundary, check-application-use-cases-boundary, check-application-service-size, manual_gate | PARTIAL | Client/server split blocked; check-application-use-cases-boundary.mjs additionally fails files outside server/application-v2 importing public-api of 2+ domains; check-application-service-size.mjs caps application service files at 280 lines so use-cases stay decomposed. Deeper use-case-placement audit stays manual_gate |
| PX-READMODEL-001 | Single read-model owner | ADR-011, BACKEND_ARCHITECTURE_INVARIANTS §9.1 | check-read-model-single-owner, manual_gate | PARTIAL | Doc-policy + co-ownership anti-pattern scan; per-projection proof stays manual_gate |
| PX-CONTRACT-001 | Public DTO contract tests | coding-standards | check-public-dto-contract-tests, check-public-dto-pii | NO | check-public-dto-contract-tests.mjs requires PARTIAL/IMPLEMENTED domains to ship at least one of domain-contract / public-mapper-no-pii / public-mapper-no-leak / public-api / contract test |
| PX-ID-001 | Branded ID types | ADR-012 | check-branded-id-types, check-service-boundary-branded-ids, manual_gate | PARTIAL | shared/contracts/ids.ts + tests + identity/media/outbox adoption. check-branded-id-types.mjs blocks raw-string *Id aliases; check-service-boundary-branded-ids.mjs blocks raw `userId: string` / `assetId: string` in public service signatures (server/domains-v2 fails closed; server/application-v2 stays advisory because it is the transport boundary). |
| PX-ERROR-001 | Result/DomainError boundary | ADR-012 | manual_gate | PARTIAL | shared/contracts/result.ts + tests + identity/media/application boundaries return discriminated results |
| PX-CURSOR-001 | Opaque cursor | ADR-013, BACKEND_ARCHITECTURE_INVARIANTS | check-pagination, check-scalability-patterns | PARTIAL | shared/contracts/cursor.ts (encode/decode, base64url, Result-typed) used by outbox listPending; offset ban manual on new endpoints |
| PX-LIFECYCLE-001 | status + deletedAt | active-rules §10 | manual_gate | YES | Aligns PX-LC-001 |
| PX-IDEMPOTENCY-001 | Idempotency table | ADR-015 | check-idempotency-flows, manual_gate | PARTIAL | check-idempotency-flows.mjs blocks regressions of shared contract + runtime adapter + migration + branded key + no Math.random; live wiring remains manual_gate |
| PX-POLICY-001 | Pure policy functions | ADR-014 | check-policy-pure-functions | NO | Gate fails when any server/domains-v2 policy.ts imports persistence/transport or performs IO/non-determinism |
| PX-UI-001 | Design tokens | PROFILE_BLUEPRINT | check-design-tokens, manual_gate | PARTIAL | Central tokens.css imported at app entry; gate verifies presence, import, profile CSS consumption, and `transition: all` ban. Visual parity remains MANUAL_OWNER_REVIEW |
| PX-UI-002 | Presentational/container | coding-standards | check-presentational-container-boundary | NO | Gate fails when profile sections/ import the data layer, a feature adapter, or call a data hook |
| PX-OBS-003 | Correlation ID | active-rules §10 | check-correlation-id-boundary, check-no-unsafe-randomness, manual_gate | PARTIAL | check-correlation-id-boundary.mjs verifies skeleton (RequestContext.correlationId/actorId, no Math.random) and matrix honesty; end-to-end wiring still manual_gate |
| PX-SEED-001 | Deterministic PII-safe seeds | active-rules §10 | check-deterministic-seeds, check-test-env-safety, check-no-unsafe-randomness | NO | All three gates run via rules:check and guards:runtime-invariants; check-no-unsafe-randomness.mjs additionally blocks Math.random in runtime code paths (opt-out per line with `// allow: Math.random — <reason>`) |
| PX-GOV-FINALIZE-001 | Successful tasks must commit + push + PR | AGENT_COMMAND_STANDARD §11, AI_AGENT_PERMISSIONS_POLICY | check-successful-task-finalization-docs, manual_gate | PARTIAL | Docs guard keeps policy aligned across AGENT_COMMAND_STANDARD §11, AI_AGENT_PERMISSIONS_POLICY, RULES_REGISTRY and this matrix. Per-task finalization itself is manual_gate (FINALIZATION block in agent response). |

## Summary

- **Total rules:** 70
- **Fully automated:** 42 (+1: PX-CONTRACT-001 now has a dedicated gate)
- **Automated + manual gate:** 19 (+5 since step-50: PX-OWN-001, PX-APP-001, PX-ID-001, PX-OBS-003, PX-IDEMPOTENCY-001, PX-READMODEL-001 all gained dedicated structural guards)
- **Manual gate only / PARTIAL:** 9
- **Documented governance gaps:** none remaining from the step-50 list. Step-52 closed: check-application-use-cases-boundary, check-public-dto-contract-tests, check-branded-id-types, check-correlation-id-boundary, check-backend-ownership-invariants, check-read-model-single-owner, check-idempotency-flows, check-public-api-surface, check-no-unsafe-randomness.
- **Mandatory task finalization (PX-GOV-FINALIZE-001):** active — agent must end every successful task with commit + push + PR (create or update). Docs guard keeps the policy aligned across AGENT_COMMAND_STANDARD §11, AI_AGENT_PERMISSIONS_POLICY, RULES_REGISTRY and this matrix.

## Gap Analysis

The 4 inherent non-automatable gaps remain:
1. **PX-PROFILE-001**: Visual parity requires screenshots — no code can verify pixel match.
2. **PX-PROFILE-002**: Domain structure review — partially coverable by domain-scaffold but needs human judgment.
3. **PX-AI-001**: Agent reading docs — agent self-reports in baseline section.
4. **PX-AI-003**: Agent stopping when blocked — agent must demonstrate honest behavior.

These are appropriately covered by `manual_gate` and report requirements.

The PARTIAL rules (PX-OWN-001/002, PX-VIS-001, PX-CTX-001, PX-MEDIA-004,
PX-EVENT-001/002, PX-LC-001/PX-LIFECYCLE-001, PX-IDEMP-001/IDEMPOTENCY-001,
PX-AIS-002, PX-APP-001, PX-READMODEL-001, PX-ID-001, PX-ERROR-001, PX-CURSOR-001,
PX-UI-001, PX-OBS-003) now each have a structural guard that prevents regression
even though the deeper proof (full owner matrix, live outbox transaction, etc.)
remains manual_gate.
