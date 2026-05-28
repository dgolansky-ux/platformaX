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
| PX-TEST-001 | No placeholder/tautological tests | coding-standards | check-placeholder-tests | NO | — |

## Summary

Counts are derived directly from the table above and verified by
`scripts/check-rules-to-guards-coverage.mjs` — if a row's `Gap?` column
changes, this summary must be updated in the same commit.

- **Total rules:** 74
- **Fully automated (Gap? = NO):** 47
- **Manual gate only (Gap? = YES):** 22
- **Partial automation (Gap? = PARTIAL):** 5
- **Documented governance gaps (TODO_GUARD markers in last column):** 11 — these rows stay manual or partial until the planned guard ships; counted within the 22 manual-only or 5 partial rows above.

## Gap Analysis

The 22 manual-only and 5 partial rows split into three real categories — they
are **not** a single "few inherently non-automatable items" set:

1. **Inherently non-automatable (manual only, no planned guard) — 4 rules:**
   - `PX-PROFILE-001` — visual parity requires screenshots; no code can verify pixel match.
   - `PX-PROFILE-002` — domain structure review; partially coverable by `check-domain-scaffold.mjs` but needs human judgment.
   - `PX-AI-001` — agent self-reports docs read in baseline section.
   - `PX-AI-003` — agent must demonstrate honest BLOCKED behavior.

2. **Planned automation (TODO_GUARD, not yet shipped) — 11 rules:**
   See the rows whose `Required Improvement` column starts with `TODO_GUARD:`
   (e.g. `PX-ID-001` branded IDs, `PX-EVENT-001/002` outbox envelope,
   `PX-IDEMP-001`/`PX-IDEMPOTENCY-001` idempotency, `PX-APP-001`
   application use-cases boundary, `PX-POLICY-001` pure policy functions,
   `PX-OBS-003` correlation ID, `PX-UI-002` presentational boundary,
   `PX-OWN-001`, `PX-SEED-001`, `PX-CONTRACT-001`). P0 rules in this
   bucket retain `manual_gate` until the dedicated guard ships.

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
| Vitest architecture tests (`pnpm archunit:check`) | Same set as above + PX-APP-001 | Same custom guards as above |
| `knip` (`pnpm knip:check`, weekly) | New coverage (unused files/exports/deps) | — |
| `gitleaks` (`pnpm secrets:gitleaks`) | PX-SEC-002 | check-secret-scan, check-local-secret-scan (PlatformaX-specific rules stay) |
| GitHub CodeQL workflow | PX-SEC-001/002 (security-extended pack) | — (status: `CODEQL_NEEDS_GITHUB_SETUP` until enabled in repo Settings) |

Red-case fixtures proving the tools fire: `tests/architecture/fixtures/`.
