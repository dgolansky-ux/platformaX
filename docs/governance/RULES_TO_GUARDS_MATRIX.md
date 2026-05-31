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
| PX-CODE-003 | No unsafe any or ts-ignore without registered exception | coding-standards, EXCEPTIONS_REGISTER | check-no-any-types, check-code-quality-structure, check-inline-exceptions-registered | NO | — |
| PX-CODE-004 | Frontend performance and list/render hygiene | coding-standards | check-frontend-performance-patterns | NO | — |
| PX-RUNTIME-001 | PARTIAL requires runtime evidence | domain-status §6 | check-runtime-readiness-status | NO | — |
| PX-RUNTIME-002 | IMPLEMENTED requires full evidence | domain-status §6 | check-runtime-readiness-status | NO | — |
| PX-DB-001 | No live db push without decision | AI_FORBIDDEN_ACTIONS | check-migration-safety, manual_gate | NO | — |
| PX-DB-002 | Migrations require safety review | AI_AGENT_PERMISSIONS | check-migration-safety | NO | — |
| PX-DB-003 | No destructive migration without approval | AI_AGENT_PERMISSIONS | check-migration-safety | NO | — |
| PX-DEPS-001 | No dependency changes without decision | coding-standards §22 | check-dependency-change-policy | NO | — |
| PX-ADR-001 | Arch changes require ADR decision | execution-map | check-adr-required | NO | — |
| PX-OBS-001 | No unsafe console logging in runtime | coding-standards §17 | check-observability-logging | NO | — |
| PX-OBS-002 | No PII in logs/errors/audit | coding-standards §17 | check-observability-logging, check-logging-pii-security | NO | — |
| PX-EXC-001 | Exceptions require full metadata | EXCEPTIONS_REGISTER | check-exception-expiry, check-inline-exceptions-registered | NO | — |
| PX-EXC-002 | Expired exceptions fail gates | EXCEPTIONS_REGISTER | check-exception-expiry, check-inline-exceptions-registered | NO | — |
| PX-DTO-001 | Public DTO privacy classification | architecture-enforcement §8 | check-dto-privacy-classification | NO | — |
| PX-SCALE-001 | No sync fanout in request path | coding-standards §22 | check-scalability-hot-paths | NO | — |
| PX-SCALE-002 | No unbounded hot-path loops | coding-standards §22 | check-scalability-hot-paths | NO | — |
| PX-SCALE-003 | No full scans for runtime lists | coding-standards §22 | check-scalability-hot-paths, check-pagination | NO | — |
| PX-GOV-005 | No governance drift | HIDDEN_RULES_INVENTORY | check-governance-drift | NO | — |
| PX-OWN-001 | Resource owner model | BACKEND_ARCHITECTURE_INVARIANTS | check-backend-ownership-invariants, manual_gate | NO | Slice 24 shipped guard. Pre-runtime files ACKed under EXC-016. |
| PX-OWN-002 | viewerContext on public reads | BACKEND_ARCHITECTURE_INVARIANTS | check-viewer-context-on-public-reads, manual_gate | NO | Slice 24 shipped guard. Three public-only read files ACKed under EXC-016. |
| PX-VIS-001 | Visibility matrix | BACKEND_ARCHITECTURE_INVARIANTS | check-visibility-matrix, check-policy-pure-functions, manual_gate | NO | Slice 24 shipped guard (predicate-name match). |
| PX-DTO-002 | Public DTO zero PII extended | BACKEND_ARCHITECTURE_INVARIANTS | check-public-dto-pii, check-dto-privacy-classification | NO | Extends PX-SEC-001 |
| PX-CTX-001 | Resource context refs | BACKEND_ARCHITECTURE_INVARIANTS | check-resource-context-refs, manual_gate | PARTIAL | Slice 25 shipped narrow token-presence guard. 28 pre-runtime files ACKed under EXC-016. Semantic field-presence check stays manual. |
| PX-MEDIA-004 | Media attach owner/purpose | BACKEND_ARCHITECTURE_INVARIANTS | check-media-attach-owner-purpose, check-media-base64, manual_gate | NO | Slice 24 shipped guard. identity/service.ts attach* ACKed under EXC-016. |
| PX-LIST-004 | limit/cursor/stable order | BACKEND_ARCHITECTURE_INVARIANTS | check-pagination, check-scalability-patterns, check-scalability-hot-paths | NO | Extends PX-LIST-001 |
| PX-DB-004 | No raw DB outside domain | BACKEND_ARCHITECTURE_INVARIANTS | audit-domain-boundaries, check-architecture-import-graph | NO | — |
| PX-EVENT-001 | EventEnvelope + outbox fanout | BACKEND_ARCHITECTURE_INVARIANTS, ADR-009 | check-event-envelope-contract, check-scalability-hot-paths, manual_gate | NO | Slice 24 shipped envelope-contract guard. social/moderation/notifications-v2 events.ts ACKed under EXC-016. |
| PX-EVENT-002 | Transactional outbox same TX | ADR-009 | check-transactional-outbox-pattern, manual_gate | NO | Slice 24 shipped narrow heuristic guard. |
| PX-LC-001 | Explicit lifecycle statuses | BACKEND_ARCHITECTURE_INVARIANTS | manual_gate | YES | MANUAL_GATE_REQUIRED |
| PX-IDEMP-001 | Idempotency retry writes | BACKEND_ARCHITECTURE_INVARIANTS, ADR-015 | check-idempotency-flows, manual_gate | NO | Slice 24 shipped guard. ~33 pre-runtime files ACKed under EXC-016. |
| PX-AIS-002 | Architecture Impact Statement | BACKEND_ARCHITECTURE_INVARIANTS | check-adr-required, manual_gate | PARTIAL | PR body / step report |
| PX-APP-001 | application-v2 use-cases | active-rules §10, ADR-010 | check-application-use-cases-boundary, manual_gate | NO | Slice 24 shipped guard. |
| PX-READMODEL-001 | Single read-model owner | ADR-011 | check-read-model-owner, manual_gate | NO | Slice 24 shipped guard. |
| PX-CONTRACT-001 | Public DTO contract tests | coding-standards | check-public-dto-contract-tests, check-public-dto-pii, manual_gate | NO | Slice 24 shipped guard. 4 scaffold domains ACKed under EXC-016. |
| PX-ID-001 | Branded ID types | ADR-012 | check-branded-id-types, manual_gate | PARTIAL | Slice 25 shipped narrow guard. Files declaring raw `<name>Id: string` on public-api.ts must import branded-ids or carry a PX-ID-001-ACK marker. |
| PX-ERROR-001 | Result/DomainError boundary | ADR-012 | check-domain-result-errors, manual_gate | PARTIAL | Slice 25 shipped narrow guard. server/domains-v2/media/service.ts ACKed under EXC-016. |
| PX-CURSOR-001 | Opaque cursor | ADR-013, BACKEND_ARCHITECTURE_INVARIANTS | check-pagination, check-scalability-patterns | PARTIAL | Offset ban manual on new endpoints |
| PX-LIFECYCLE-001 | status + deletedAt | active-rules §10 | manual_gate | YES | Aligns PX-LC-001 |
| PX-IDEMPOTENCY-001 | Idempotency table | ADR-015 | check-idempotency-flows, manual_gate | NO | Same guard as PX-IDEMP-001 (command-side). Table-side coverage stays manual until the idempotency table lands. |
| PX-POLICY-001 | Pure policy functions | ADR-014 | check-policy-pure-functions, manual_gate | NO | Slice 24 shipped guard. |
| PX-UI-001 | Design tokens | PROFILE_BLUEPRINT | manual_gate | YES | Visual review |
| PX-UI-002 | Presentational/container | coding-standards | check-presentational-container-boundary, manual_gate | PARTIAL | Slice 25 shipped narrow tripwire. Scans components/ subfolders; current repo has none so it currently triggers on no files — activates as soon as the pattern is adopted. |
| PX-OBS-003 | Correlation ID | active-rules §10 | check-correlation-id-boundary, manual_gate | PARTIAL | Slice 25 shipped narrow token-presence guard. 18 pre-runtime use-case service files ACKed under EXC-016. Semantic propagation check stays manual. |
| PX-SEED-001 | Deterministic PII-safe seeds | active-rules §10 | check-deterministic-seeds, check-test-env-safety, manual_gate | NO | Slice 25 shipped guard. Scans seed/fixture files for Math.random/Date.now/randomUUID. |
| PX-STORAGE-001 | No localStorage as fake backend | active-rules §10, coding-standards | check-no-storage-as-backend | NO | Slice 25 shipped narrow guard with UI-prefs/consent/theme/app-v2-system allow-list. |
| PX-HUB-001 | Public Hub never owns data | BACKEND_ARCHITECTURE_INVARIANTS | check-public-hub-source-of-truth | NO | Slice 25 shipped guard. Public Hub composes resolver interfaces; no repository / db / adapter / supabase imports. |
| PX-TEST-001 | No placeholder/tautological tests | coding-standards | check-placeholder-tests | NO | — |

## Summary

Counts are derived directly from the table above and verified by
`scripts/check-rules-to-guards-coverage.mjs` — if a row's `Gap?` column
changes, this summary must be updated in the same commit.

- **Total rules:** 76 (Slice 25: +2 — PX-STORAGE-001, PX-HUB-001)
- **Fully automated (Gap? = NO):** 62 (Slice 25: +3 — PX-SEED-001 flipped PARTIAL→NO + 2 new rules added with full guards)
- **Manual gate only (Gap? = YES):** 7 (Slice 25: −5 — PX-ID-001, PX-ERROR-001, PX-UI-002, PX-OBS-003, PX-CTX-001 flipped YES→PARTIAL)
- **Partial automation (Gap? = PARTIAL):** 7 (Slice 25: +4 net — the 5 P1 flips above − 1 PARTIAL→NO for PX-SEED-001)
- **Documented governance gaps (TODO_GUARD markers in last column):** 0 (Slice 25: −4 — all four Slice 25 TODO_GUARDs shipped as narrow guards)
  — PX-ID-001 (branded IDs), PX-UI-002 (presentational/container),
  PX-OBS-003 (correlation ID), PX-SEED-001 (deterministic seeds). All
  scheduled for Slice 25 P1 — see the "Planned automation" bucket below.

## Gap Analysis

The 22 manual-only and 5 partial rows split into three real categories — they
are **not** a single "few inherently non-automatable items" set:

1. **Inherently non-automatable (manual only, no planned guard) — 4 rules:**
   - `PX-PROFILE-001` — visual parity requires screenshots; no code can verify pixel match.
   - `PX-PROFILE-002` — domain structure review; partially coverable by `check-domain-scaffold.mjs` but needs human judgment.
   - `PX-AI-001` — agent self-reports docs read in baseline section.
   - `PX-AI-003` — agent must demonstrate honest BLOCKED behavior.

2. **Planned automation (TODO_GUARD, not yet shipped) — 1 rule (after
   Slice 24):**
   - `PX-ID-001` branded IDs (Slice 25 P1).
   The other Slice 24-prep TODO_GUARDs all shipped in Slice 24 (rows now
   marked `Gap? = NO`). Pre-runtime files that are not yet compliant
   with the newly enforced rule carry a per-file PX-RULE-ACK marker
   listed under EXC-016 in EXCEPTIONS_REGISTER.md — the guard is
   FAIL-CLOSED for new code while the ACK keeps the pre-existing
   technical debt visible until the runtime backend slice removes it.
   Slice 25 P1 TODO_GUARDs (planned, not in matrix yet): correlation
   ID boundary (PX-OBS-003), presentational/container boundary
   (PX-UI-002), deterministic seeds (PX-SEED-001), Result/DomainError
   boundary (PX-ERROR-001).

3. **Manual review (judgment-bound, no scripted check planned yet) — the
   remainder:** policy- or context-heavy rules where a guard would either
   need semantic reasoning (e.g. `PX-OWN-002` viewerContext,
   `PX-VIS-001` visibility matrix, `PX-CTX-001` context refs,
   `PX-READMODEL-001` single read-model owner, `PX-MEDIA-004` attach
   policy, `PX-LC-001`/`PX-LIFECYCLE-001` lifecycle status,
   `PX-ERROR-001` typed Result boundary, `PX-UI-001` design tokens).
   These are gated by required step-report sections and policy/contract
   tests rather than a standalone guard script.

Partial rules carry SOME automated coverage already and rely on a guard
ship to graduate to fully automated (see the rows marked PARTIAL above).

## Tooling spike — parallel coverage (informational)

Spike branch: `tooling/architecture-boundaries-quality-spike`. The
custom guards above remain the source of truth and the only gates that
flip a row's `Gap?` column. The tools below run **PARALLEL_WITH_TOOLING**
and are listed here so reviewers can see the second-source coverage; no
row is marked `NO` because of these tools alone.

| Tool | Rules it second-sources | Custom guard(s) it parallels |
|---|---|---|
| `eslint-plugin-boundaries` (`pnpm boundaries:check` via `pnpm lint`) | PX-ARCH-003, PX-ARCH-004, PX-ARCH-006, PX-ARCH-007 | audit-domain-boundaries |
| `dependency-cruiser` (`pnpm depcruise:check`) | PX-ARCH-001, PX-ARCH-002, PX-ARCH-003, PX-ARCH-004, PX-ARCH-008, PX-ARCH-009, PX-DB-004 | audit-domain-boundaries, check-architecture-import-graph, check-no-legacy-imports |
| Vitest architecture tests (`pnpm arch-tests`) | Same set as above + PX-APP-001 | Same custom guards as above |
| `knip` (`pnpm knip:check`, weekly) | New coverage (unused files/exports/deps) | — |
| `gitleaks` (`pnpm secrets:gitleaks`) | PX-SEC-002 | check-secret-scan, check-local-secret-scan (PlatformaX-specific rules stay) |
| GitHub CodeQL workflow | PX-SEC-001/002 (security-extended pack) | — (status: `CODEQL_NEEDS_GITHUB_SETUP` until enabled in repo Settings) |

Red-case fixtures proving the tools fire: `tests/architecture/fixtures/`.
