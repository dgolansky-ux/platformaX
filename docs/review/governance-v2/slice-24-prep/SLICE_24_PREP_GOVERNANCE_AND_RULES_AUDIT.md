# SLICE 24 PREP — Governance, Coding Rules, Agent Safety and Domain Boundary Audit

> **Purpose:** Brutally audit the current governance corpus, coding standards,
> guard scripts, CI workflows and agent policies. Decide whether they are
> strong enough to protect future Opus/Cursor agents from damaging
> architecture, domain boundaries, privacy, status truth, runtime integrity
> and code quality. **Read-only audit — no code, rules, or guards changed.**
>
> **Branch / commit at audit start:** `feat/contacts-v2-clean-room-slice` @
> `0c22937` (end of Slice 23).
> **Scope reviewed:** `docs/governance/**`, `docs/architecture/**`,
> `docs/ai/**`, `docs/security/**`, `docs/profile/**`,
> `scripts/check-*.mjs`, `scripts/arch-check-v2.mjs`,
> `scripts/rules-check.mjs`, `scripts/audit/**`, `package.json`,
> `eslint.config.js`, `.dependency-cruiser.cjs`, `knip.json`,
> `.gitleaks.toml`, `.github/workflows/**`, `.husky/**`,
> `playwright.config.ts`, `docs/review/foundation-v2/slice-23/**`,
> `docs/review/visual-v2/slice-23/**`.

---

## 1. Executive verdict

**STRONG_BUT_NEEDS_HARDENING.**

The governance corpus is unusually mature for a single-developer / AI-driven
project: 74 rules in `RULES_REGISTRY.yml`, 50 guards in `GUARDS_REGISTRY.yml`,
a self-checking integration model
(`check-rules-to-guards-coverage` + `check-guards-registry` +
`check-inline-exceptions-registered` + `check-governance-drift`), explicit
agent permissions / forbidden-actions docs, a 12-field self-audit, a parallel
tooling spike (depcruise, knip, gitleaks, arch-tests) and a forward-looking
ADR set (ADR-001…016 including event envelope, transactional outbox,
idempotency, opaque cursor, branded IDs, pure policy).

For the work done so far (UI shells, mock adapters, manage dashboard,
visual polish, AppShell consolidation) the system is plausibly
`STRONG_ENOUGH`. **But Slice 24 onward will start real backend wiring**, and
exactly the rules that matter most for that phase are the ones that are
currently `manual_gate` only. Eleven explicit `TODO_GUARD` items, 22
manual-only rules, 5 partial rules — many at P0 — mean an adversarial or
sloppy Opus/Cursor agent can ship structurally wrong backend code with
green gates by exploiting the unguarded surface. The corpus is also large
enough that an agent could *technically* "comply" by adding correct-looking
AIS sections while subtly violating the underlying invariants the AIS
should have caught.

**Verdict:** not `NOT_SAFE_FOR_LARGE_AGENT_WORK`, but also not
`STRONG_ENOUGH` for the kind of slices that wire transports, idempotency
tables, outbox workers, and read-model projections. Slice 24 should be a
**governance hardening implementation slice**, not a feature slice. The
ten changes in §12 are the precise sequence.

---

## 2. Top 20 governance risks

Ordered by what an adversarial Opus/Cursor agent could most easily exploit
**without breaking a guard**. P0_NOW means it gates Slice 24 work.

| # | Risk | Why exploitable today | Severity |
| --- | --- | --- | --- |
| 1 | **Cross-domain orchestration inside a single domain `service.ts`.** `PX-APP-001` (use-cases boundary) is `manual_gate` only — agent can quietly call two repositories from one service. | No guard greps service.ts for cross-domain imports. | **P0_NOW** |
| 2 | **EventEnvelope shape drift.** `PX-EVENT-001` is `manual_gate` + `check-scalability-hot-paths`. No guard inspects `events.ts` for the required envelope fields. | Agent can define `type AppEvent = { kind, payload }` and ship. | **P0_NOW** |
| 3 | **Outbox bypassed.** `PX-EVENT-002` is fully manual. No SQL/migration check ensures source-of-truth write + outbox row in the same transaction. | First slice that adds a `publishEvent()` helper can fanout sync. | **P0_NOW** |
| 4 | **Idempotency missing on create/publish/upload/finalize.** `PX-IDEMP-001` / `PX-IDEMPOTENCY-001` are fully manual. | Retry-sensitive writes can ship without an idempotency table. | **P0_NOW** |
| 5 | **viewerContext absent on public reads.** `PX-OWN-002` is manual. No guard inspects new public service signatures for a `viewerContext` parameter. | First "public profile" endpoint can read everything as anonymous. | **P0_NOW** |
| 6 | **No visibility-matrix enforcement.** `PX-VIS-001` manual. `policy.ts` can ship without `canView` / `canEdit` per viewer kind. | Ad-hoc visibility checks land inside routers. | **P0_NOW** |
| 7 | **Pure policy invariant unguarded.** `PX-POLICY-001` is manual. A `policy.ts` can import the repository (IO) and pass gates. | A future "smart policy" entangles policy with persistence. | **P0_NOW** |
| 8 | **Public DTO contract tests not enforced.** `PX-CONTRACT-001` is partial. Public-api can change shape and break consumers without a contract test. | Removing a field from public-api won't fail tests. | **P0_NOW** |
| 9 | **Single read-model owner not enforced.** `PX-READMODEL-001` manual. Two domains could write to the same projection table. | Cross-domain projection drift. | **P0_NOW** |
| 10 | **Branded IDs at boundaries not enforced.** `PX-ID-001` manual. Public-api can accept raw `string` IDs. | Wrong user ID passes type check. | **P1_NEXT** |
| 11 | **Result/DomainError boundary unguarded.** `PX-ERROR-001` manual. `service.ts` can `throw new Error("foo")` at public boundary. | Loses typed error contract. | **P1_NEXT** |
| 12 | **Correlation ID not enforced.** `PX-OBS-003` manual. Logs can ship without `correlationId`. | Cross-request tracing impossible. | **P1_NEXT** |
| 13 | **Presentational / container boundary unguarded.** `PX-UI-002` manual. A `*Card.tsx` can import a data hook. | Data leaks into pure UI components. | **P1_NEXT** |
| 14 | **Design-tokens-vs-hardcoded-color unguarded.** `PX-UI-001` manual. Profile section can hardcode `#1e4fd8`. | Visual parity drift. | **P2_LATER** |
| 15 | **Deterministic-seeds invariant under-guarded.** `PX-SEED-001` is partial via `check-test-env-safety`. A test could use `Date.now()` or `Math.random()`. | Snapshot-style tests flake. | **P1_NEXT** |
| 16 | **Lifecycle status invariant manual.** `PX-LC-001` / `PX-LIFECYCLE-001`. A new entity can hard-delete without `deletedAt`. | Lost soft-delete invariant. | **P1_NEXT** |
| 17 | **Media attach invariant partial.** `PX-MEDIA-004` is manual_gate + `check-media-base64`. The attach guard doesn't yet verify owner/purpose match. | Foreign-asset attach possible. | **P0_NOW** (security-adjacent) |
| 18 | **Agent baseline (`PX-AI-001`) is honor-system.** No guard parses a "DOCS READ:" block from step reports. | Agent skips reading governance. | **P1_NEXT** |
| 19 | **No "no-agent-bypass-language" guard.** Agent could quietly add `ALLOW_STATUS_TERM_IN_POLICY_DOC` to a regular doc to mask fake-done. | One-line bypass possible. | **P0_NOW** |
| 20 | **eslint-plugin-boundaries v6 is `PARTIAL_NOT_ENFORCED`.** Documented in `docs/governance/followups/`, but the v6 rewrite is blocked on `eslint-import-resolver-typescript`. Coverage today is via depcruise + arch-tests + `audit-domain-boundaries.mjs`. | Lint lane lulls reviewers; depcruise still fires, but defense-in-depth is thinner. | **P1_NEXT** |

Other risks below the top-20 cut but worth noting: CodeQL waiting on
repo Settings (`CODEQL_NEEDS_GITHUB_SETUP`); `gitleaks` falls back to
"no-op pass" in `secrets:gitleaks` when binary missing
(`secrets:gitleaks:required` BLOCKS — documented); the `STATUS_TAXONOMY`
allows `IMPLEMENTED` without specifying the minimum count of tests
required (interpretation is left to the agent).

---

## 3. Mapa 2.1 coverage table

The "Mapa 2.1 governance model" referenced by the slice prompt
is interpreted here as the union of:
`PlatformaX-V2-active-rules.md §10 (Runtime governance invariants)`,
`BACKEND_ARCHITECTURE_INVARIANTS.md`, `STATUS_TAXONOMY.md`,
the ADRs ADR-007..016, and the explicit clauses in the slice prompt.

| Mapa rule / group | Current repo evidence | Status | Gap | Recommendation |
| --- | --- | --- | --- | --- |
| No fake DONE | `PX-GOV-001`, `check-fake-done.mjs`, `check-status-truth-consistency.mjs` | **IMPLEMENTED_AND_GUARDED** | none | keep |
| No evidence → no DONE | `PX-STATUS-001..003`, `check-domain-status-registry.mjs`, `check-runtime-readiness-status.mjs` | **IMPLEMENTED_AND_GUARDED** | none | keep |
| No screenshot → no VISUAL_DONE | `PX-STATUS-002`, `check-fake-done.mjs` (regex), `manual_gate` | **IMPLEMENTED_MANUAL_ONLY** | no script verifies that a route claiming VISUAL_DONE has a matching PNG under `docs/review/visual-v2/` | add `check-visual-evidence-presence.mjs` |
| No runtime evidence → no BACKEND_DONE / IMPLEMENTED | `PX-STATUS-003`, `PX-RUNTIME-001/002`, `check-runtime-readiness-status.mjs` | **IMPLEMENTED_AND_GUARDED** | none | keep |
| Cross-domain only via public-api / contracts / events / outbox | `PX-ARCH-003/004/009`, `audit-domain-boundaries.mjs`, `check-architecture-import-graph.mjs`, depcruise | **IMPLEMENTED_AND_GUARDED** (defense in depth) | none | keep |
| No legacy runtime in V2 | `PX-ARCH-001/002`, `check-no-legacy-imports.mjs`, depcruise | **IMPLEMENTED_AND_GUARDED** | none | keep |
| No public PII / base64 / secrets | `PX-SEC-001/002`, `PX-DTO-001/002`, `PX-MEDIA-001`, gitleaks, multiple guards | **IMPLEMENTED_AND_GUARDED** | none | keep |
| No hidden rules | `PX-GOV-005`, `check-governance-drift.mjs`, `HIDDEN_RULES_INVENTORY.md` | **IMPLEMENTED_AND_GUARDED** | templates exempt — semi-loophole | accept; templates are scaffolding |
| Backend small slices | `BACKEND_ARCHITECTURE_INVARIANTS.md`, `AIS template`, `PX-AIS-002`, `check-adr-required.mjs` | **PARTIAL** | no file-size check on `service.ts` / `repository.ts` per slice; complexity check exists but not slice-bound | accept; complexity guards cover most cases |
| Application/use-cases for 2+ domains | `PX-APP-001`, ADR-010, `manual_gate` | **MISSING** (TODO_GUARD: `check-application-use-cases-boundary.mjs`) | service.ts can orchestrate across domains | **P0** — ship the guard |
| EventEnvelope / transactional outbox | `PX-EVENT-001/002`, ADR-009, `check-scalability-hot-paths.mjs`, `manual_gate` | **PARTIAL** | sync-fanout grep exists; envelope shape and outbox transactional contract are honor-system | **P0** — ship `check-event-envelope-contract.mjs` + `check-transactional-outbox-pattern.mjs` |
| Single read-model owner | `PX-READMODEL-001`, ADR-011, `manual_gate` | **MISSING** | two domains can write same projection | **P0** — ship `check-read-model-owner.mjs` |
| Pure policy tests | `PX-POLICY-001`, ADR-014, `manual_gate` | **MISSING** | policy.ts can import IO | **P0** — ship `check-policy-pure-functions.mjs` |
| Idempotency persistence | `PX-IDEMP-001` / `PX-IDEMPOTENCY-001`, ADR-015, `manual_gate` | **MISSING** | no table, no guard | **P0** — ship `check-idempotency-flows.mjs` |
| No `localStorage`/`sessionStorage` as backend | `client/src/features-v2/{identity/profile,media}/__tests__/no-storage.test.ts`, profile-runtime test, coding-standards §4 | **IMPLEMENTED_AND_GUARDED** (per-subtree tests) | global guard missing — relies on subtree tests | **P1** — add `check-no-storage-as-backend.mjs` global |
| No `@server/*` from frontend | depcruise + grep in tests + boundaries plugin | **IMPLEMENTED_AND_GUARDED** | hardened against side-effect imports already (audit-domain-boundaries fix shipped earlier) | keep |
| No `any` / `as any` / `@ts-ignore` | `PX-CODE-003`, `check-no-any-types.mjs`, `check-inline-exceptions-registered.mjs` | **IMPLEMENTED_AND_GUARDED** | `@ts-expect-error` allowed with ≥8 char justification (intentional) | keep |
| No placeholder tests | `PX-TEST-001`, `check-placeholder-tests.mjs` | **IMPLEMENTED_AND_GUARDED** | none | keep |
| Branded IDs at boundaries | `PX-ID-001`, ADR-012, `manual_gate` | **MISSING** | raw string IDs in public-api possible | **P1** — ship `check-branded-id-types.mjs` |
| Result / DomainError | `PX-ERROR-001`, ADR-012, `manual_gate` | **MISSING** | `throw new Error` allowed at public boundary | **P1** — ship `check-domain-result-errors.mjs` |
| Correlation ID | `PX-OBS-003`, `manual_gate` | **MISSING** | logs can ship without correlationId | **P1** — ship `check-correlation-id-boundary.mjs` |
| Presentational / container boundary | `PX-UI-002`, `manual_gate` | **MISSING** | UI can import data hooks | **P1** — ship `check-presentational-container-boundary.mjs` |
| Design tokens | `PX-UI-001`, `manual_gate` | **MISSING** | hardcoded colors allowed | **P2** — `check-design-tokens-usage.mjs` |
| Deterministic seeds | `PX-SEED-001`, `check-test-env-safety.mjs` partial | **PARTIAL** | `Math.random` / `Date.now` not banned in fixtures | **P1** — ship `check-deterministic-seeds.mjs` |
| Status taxonomy | `STATUS_TAXONOMY.md`, `PX-RUNTIME-001/002` | **IMPLEMENTED_AND_GUARDED** | none | keep |
| Forward-only migrations | `PX-DB-001/002/003`, `check-migration-safety.mjs` | **IMPLEMENTED_AND_GUARDED** | none | keep |
| No --no-verify / no direct push to main | `PX-GOV-003/004`, `check-ai-agent-permissions.mjs`, branch protection | **IMPLEMENTED_AND_GUARDED** | branch protection is `[EXT]` external in `guards:all-local` | accept |

Summary: out of **27 mapa items**, **15 IMPLEMENTED_AND_GUARDED**, **2 IMPLEMENTED_MANUAL_ONLY** intentionally, **3 PARTIAL**, **7 MISSING / TODO_GUARD**. The 7 missing are exactly the items that bite first in Slice 24+ backend wiring.

---

## 4. Rules registry audit

Numbers from `docs/governance/RULES_TO_GUARDS_MATRIX.md §Summary` (verified
by `scripts/check-rules-to-guards-coverage.mjs`, gates PASS):

- **Total rules:** 74
- **Severity:**
  - P0: 38
  - P1: 36
  - P2: 0 (none today)
- **Fully guarded (`Gap? = NO`):** 47
- **Manual-gate only (`Gap? = YES`):** 22
- **Partial automation (`Gap? = PARTIAL`):** 5
- **Explicit `TODO_GUARD` markers:** 11 (subset of the 22/5 above)
- **Inconsistencies / duplicates:**
  - `PX-INFRA-002` (No live db push without separate decision) and `PX-DB-001` (No live db push without separate decision) describe the same rule with overlapping enforced_by lists. Not harmful — both point at `check-migration-safety.mjs` + `check-ai-agent-permissions.mjs` + manual gate. Could be consolidated as a doc cleanup.
  - `PX-LC-001` and `PX-LIFECYCLE-001` are aliased ("Aligns with…" notes). Same observation.
  - `PX-IDEMP-001` and `PX-IDEMPOTENCY-001` aliased.
  - `PX-EVENT-001` lists `manual_gate` under `enforced_by` *and* is marked PARTIAL in the matrix — consistent but the matrix is the truth.

**Verdict:** registry is internally consistent; the integration model
(`check-rules-to-guards-coverage` + `check-guards-registry` +
`check-inline-exceptions-registered`) catches drift. The duplicates are
aliases for governance clarity, not contradictions.

---

## 5. Guard quality audit

Spot-checked: `check-fake-done.mjs`, `check-no-any-types.mjs`,
`audit-domain-boundaries.mjs`, plus the registry listing of all 50 guards.

| Guard | Status | Strength / weakness | Recommendation |
| --- | --- | --- | --- |
| `check-fake-done.mjs` | **STRONG** | Comprehensive `FORBIDDEN` list, single named allowlist marker, scans `docs/`, `client/`, `server/`, `shared/`, `scripts/` + `package.json`, fails closed. | keep |
| `check-no-any-types.mjs` | **STRONG** | All 6 forbidden patterns (`as any`, `: any`, `Record<…, any>`, `<any>`, `catch (err: any)`, `@ts-ignore`), justification check for `@ts-expect-error`, parses EXCEPTIONS_REGISTER active table, fails closed. | keep |
| `audit-domain-boundaries.mjs` | **STRONG** | Catches all 4 import forms (`import …from`, dynamic `import()`, `require()`, **side-effect `import ".."`** — explicitly hardened after a documented adversarial finding). | keep |
| `check-architecture-import-graph.mjs` | **STRONG (parallel with depcruise)** | Acyclic + ownership; runs as `GUARD-038 (PARALLEL_WITH_TOOLING)` with depcruise. | keep |
| `check-governance-drift.mjs` | **STRONG** | Catches normative phrases without Rule ID, with template exemption. | keep |
| `check-fake-done.mjs` allowlist (`ALLOW_STATUS_TERM_IN_POLICY_DOC`) | **WEAK** | Marker can be planted in any file. No registry / no per-file guardrail. Agent could plant it once in a non-policy file to mask a future fake-done. | **P0** — ship `check-no-agent-bypass-language.mjs` that verifies the marker only appears in registered policy doc paths. |
| `check-public-dto-pii.mjs` | **STRONG** | Required for PX-SEC-001 / PX-DTO-002, runs in CI and pre-push. | keep |
| `check-media-base64.mjs` | **STRONG** | Pattern-rich; backs PX-MEDIA-001 and PX-MEDIA-004 partial. | extend to verify attach owner/purpose match (PX-MEDIA-004 second half) |
| `check-pagination.mjs` / `check-scalability-hot-paths.mjs` / `check-scalability-patterns.mjs` | **STRONG** | Three-guard belt for PX-LIST-001/004, PX-SCALE-001/002/003, PX-CURSOR-001. | keep |
| `check-frontend-performance-patterns.mjs` | **STRONG** | Catches `transition: all`, `key={index}`, missing `loading="lazy"`, dangling timers/listeners. | keep |
| `check-code-quality-structure.mjs` | **OK** | Layered with `check-file-complexity.mjs` and `check-file-size-limits.mjs`; explicit table in coding-standards §6. | keep |
| `check-status-truth-consistency.mjs` | **STRONG** | Backs PX-GOV-001 / PX-STATUS-001. | keep |
| `check-self-audit-evidence.mjs` | **STRONG** | Forces the 12-field block. | keep |
| `check-inline-exceptions-registered.mjs` | **STRONG** | Two-way check — marker without register row fails, register row without marker fails. | keep |
| `check-rules-to-guards-coverage.mjs` | **STRONG** | Verifies every rule has a matrix row, every `enforced_by` path exists, and matrix summary counts match actual rows. | keep |
| `check-guards-registry.mjs` | **STRONG** | Verifies every `runs_in: ci` guard reachable from `.github/workflows/v2-gates.yml`. | keep |
| `check-supabase-migrations-safety.mjs` | **STRONG** | Backs PX-DB-001/002/003. | keep |
| `check-secret-scan.mjs` / `check-local-secret-scan.mjs` / `check-env-safety.mjs` / `check-diff-safety.mjs` | **STRONG** | Layered with gitleaks parallel tooling. | keep |
| `check-ai-agent-permissions.mjs` | **OK** | Backs PX-GOV-003/004, PX-INFRA-001/002. | extend to forbid `git commit --amend` on shared branches |
| `check-observability-logging.mjs` | **OK** | Backs PX-OBS-001/002. | extend to include the correlation-id contract (TODO) |
| `check-script-safety.mjs` | **OK** | Backs PX-GOV-002. | could verify guards never `console.warn` on a violation (must fail closed) |
| `check-domain-registry.mjs` / `check-domain-scaffold.mjs` / `check-feature-registry.mjs` | **STRONG** | All required scaffold contents enforced. | keep |
| `check-exception-expiry.mjs` | **STRONG** | Backs PX-EXC-001/002. | keep |
| `check-runtime-readiness-status.mjs` | **STRONG** | Backs PX-RUNTIME-001/002. | keep |
| `check-bramka-acceptance.mjs` | **STRONG** | 25-point acceptance gate; one external item (branch protection). | keep |
| Eleven `TODO_GUARD` items in matrix | **MISSING** | `check-application-use-cases-boundary`, `check-event-envelope-contract`, `check-transactional-outbox-pattern`, `check-idempotency-flows`, `check-read-model-owner`, `check-policy-pure-functions`, `check-public-dto-contract-tests`, `check-branded-id-types`, `check-domain-result-errors`, `check-correlation-id-boundary`, `check-presentational-container-boundary`. | **P0/P1** — ship in Slice 24 (see §6) |

**Verdict:** existing 50 guards are mostly **STRONG**. The 11 missing
TODO_GUARDs are the difference between "STRONG for shells" and
"STRONG for real backend".

---

## 6. Proposed new guards

The 20 evaluation candidates from the slice prompt, with concrete design.

| Name | Target rule | Priority | Risk prevented | Scan dirs | Detection logic | False-positive risk | Place in |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `check-backend-ownership-invariants.mjs` | PX-OWN-001 | **P0_NOW** | record id used as ownership proof | `server/domains-v2/**/{service,policy,repository}.ts` | Static: every service/repository function that takes a record id must accept or load `ownerUserId` before update/delete/attach. Heuristic: grep for `.update(` / `.delete(` calls and check that the same lexical scope mentions `owner`. | Medium — accept allowlist for read-only fetches. | rules:check, CI |
| `check-viewer-context-on-public-reads.mjs` | PX-OWN-002 | **P0_NOW** | public reads without viewerContext | `server/domains-v2/**/service.ts`, `server/application-v2/use-cases/**` | Any exported function name matching `getPublic*`, `listPublic*`, `viewPublic*` must accept a `viewerContext` parameter or carry an explicit `// PUBLIC_ONLY:` marker registered in policy docs. | Low if naming convention enforced. | rules:check, CI |
| `check-visibility-matrix.mjs` | PX-VIS-001 | **P0_NOW** | ad-hoc visibility in routers | `server/domains-v2/**/policy.ts` + `router.ts` | `policy.ts` for each runtime domain must export `canView` and `canEdit` (or domain-specific equivalents). `router.ts` must not contain visibility checks (no `if (viewer == "stranger")` patterns). | Medium — accept allowlist. | rules:check, CI |
| `check-resource-context-refs.mjs` | PX-CTX-001 | **P1_NEXT** | content without context refs | `server/domains-v2/content-v2/**/contracts.ts`, `dto.ts` | Each content DTO must export `contextType`, `contextOwnerId`, `contextRefId`, `visibility`, `ownerUserId`. | Low. | arch:check:v2 |
| `check-idempotency-flows.mjs` | PX-IDEMP-001 / PX-IDEMPOTENCY-001 | **P0_NOW** | retry-sensitive writes without idempotency | `server/domains-v2/**/service.ts` + `supabase/migrations/**` | Service functions named `create*`, `publish*`, `upload*`, `finalize*` must accept `idempotencyKey` argument or carry a `// IDEMPOTENT_EXEMPT: <reason>` marker registered in an AIS section. | Medium. | arch:check:v2 |
| `check-event-envelope-contract.mjs` | PX-EVENT-001 | **P0_NOW** | wrong-shape events | `server/domains-v2/**/events.ts` + `shared/contracts/**` | Every type exported from `events.ts` must extend / contain `EventEnvelope { id, type, version, occurredAt, actorId, payload, idempotencyKey }`. | Low. | arch:check:v2 |
| `check-transactional-outbox-pattern.mjs` | PX-EVENT-002 | **P0_NOW** | sync fanout instead of outbox | `server/domains-v2/**/service.ts` + `repository.ts` + migrations | Any function that emits a domain event must do so via an `outbox.insert(...)` call **inside the same DB transaction** as the source write. Heuristic: grep for `emitEvent(` / `publishEvent(` calls outside a `tx.run(...)` block. | High — strict pattern; needs allowlist. | arch:check:v2 (rules:check after stabilization) |
| `check-application-use-cases-boundary.mjs` | PX-APP-001 | **P0_NOW** | service.ts orchestrates 2+ domains | `server/domains-v2/**/service.ts` | A domain service.ts must not import from another `server/domains-v2/*/public-api`. Allowed: `server/application-v2/use-cases/**`. | Low — explicit allowlist. | arch:check:v2 |
| `check-read-model-owner.mjs` | PX-READMODEL-001 | **P0_NOW** | shared projection across domains | `server/domains-v2/**/repository.ts` | Each projection table (heuristic: filename `*-projection.ts` or table prefix `projection_*`) must be written by exactly one domain. | Medium. | arch:check:v2 |
| `check-public-dto-contract-tests.mjs` | PX-CONTRACT-001 | **P0_NOW** | public-api shape drift | `server/domains-v2/**/public-api.ts` + matching `__tests__/public-api*.test.ts` | Every `public-api.ts` must have a sibling test file that imports and asserts the exported shape. | Low. | rules:check |
| `check-branded-id-types.mjs` | PX-ID-001 | **P1_NEXT** | raw string IDs at boundary | `server/domains-v2/**/contracts.ts`, `dto.ts`, `public-api.ts` | Public DTO fields named `*Id` / `*UserId` must be typed via a branded type imported from `shared/contracts/branded-ids.ts`. | Medium — many false positives without good import inspection. | rules:check |
| `check-domain-result-errors.mjs` | PX-ERROR-001 | **P1_NEXT** | throw at public boundary | `server/domains-v2/**/service.ts`, `public-api.ts` | Functions exported from `public-api.ts` must return `Result<…>` / `DomainResult<…>`; `throw` is forbidden except for invariant violations marked with `// INVARIANT_BREACH:`. | Medium. | rules:check |
| `check-policy-pure-functions.mjs` | PX-POLICY-001 | **P0_NOW** | policy.ts imports IO | `server/domains-v2/**/policy.ts` | `policy.ts` must not import from `repository`, `db/*`, `service`, `fs`, `node:fs`, `supabase`, fetch. | Low — strict. | arch:check:v2 |
| `check-correlation-id-boundary.mjs` | PX-OBS-003 | **P1_NEXT** | logs without correlationId | `server/application-v2/use-cases/**`, `server/domains-v2/**/service.ts` | Every use-case top-level function must accept a `correlationId` parameter or use one from a request context. | Medium. | rules:check |
| `check-presentational-container-boundary.mjs` | PX-UI-002 | **P1_NEXT** | data hooks in presentational | `client/src/features-v2/**`, `client/src/app-v2/**` | Files named `*Card.tsx`, `*Tile.tsx`, `*Row.tsx`, `*Item.tsx` must not import from `useQuery`/`useMutation`/`fetch`/adapter files. | Medium — naming-bound. | rules:check |
| `check-deterministic-seeds.mjs` | PX-SEED-001 | **P1_NEXT** | random data in tests | `tests/**`, `**/__tests__/**`, `client/src/**/fixtures.ts`, `**/mock-adapter.ts` | Forbid `Math.random()` / `Date.now()` / `Date()` (no args) / `crypto.randomUUID()` inside fixtures + snapshot-style tests. | Low. | rules:check |
| `check-domain-readme-public-surface.mjs` | PX-AIS-002 adjacent | **P2_LATER** | domain README missing public surface | `server/domains-v2/**/README.md` | Each domain README must contain a "Public API surface" section listing exports of `public-api.ts`. | Low. | rules:check |
| `check-api-transport-boundary.mjs` | PX-CODE-003 + ADR-010 | **P2_LATER** | zod validation inside policy / mapper | `server/domains-v2/**/{policy,mapper}.ts` | `zod` import is allowed only in `router.ts` / `public-api.ts` (transport boundary). | Low. | rules:check |
| `check-mock-adapter-status-truth.mjs` | PX-RUNTIME-001 / feature-registry | **P1_NEXT** | feature claims PARTIAL_RUNTIME but ships only mock-adapter | `client/src/features-v2/feature-registry.ts` + per-feature `mock-adapter.ts` / `adapter.ts` | Cross-reference: if registry says `PARTIAL_RUNTIME`, feature must ship a non-mock adapter file. | Medium. | rules:check |
| `check-no-agent-bypass-language.mjs` | PX-GOV-002 | **P0_NOW** | agent plants allowlist markers to mask fake-done | repo-wide except `docs/governance/**` and `docs/architecture/**` | `ALLOW_STATUS_TERM_IN_POLICY_DOC` may appear only in registered policy doc paths. Registry of allowed paths lives in this guard. | Low. | rules:check, CI |

**Implementation priority order (also §10 / §12):**

1. `check-application-use-cases-boundary.mjs` (P0) — blocks the most likely first-week mistake.
2. `check-event-envelope-contract.mjs` (P0).
3. `check-policy-pure-functions.mjs` (P0).
4. `check-no-agent-bypass-language.mjs` (P0).
5. `check-viewer-context-on-public-reads.mjs` (P0).
6. `check-visibility-matrix.mjs` (P0).
7. `check-idempotency-flows.mjs` (P0).
8. `check-public-dto-contract-tests.mjs` (P0).
9. `check-transactional-outbox-pattern.mjs` (P0).
10. `check-read-model-owner.mjs` (P0).

The remaining 10 ship as P1/P2 in subsequent slices.

---

## 7. Coding standards review

`PlatformaX-V2-coding-standards.md` is 561 lines, 23 sections.

### Strong sections

- §3 (TypeScript ban list — fully enforced by `check-no-any-types`).
- §4 (React) — explicit "every button must do one of these" rule.
- §5 / 5.1 (Backend invariants) — directly maps to BACKEND_ARCHITECTURE_INVARIANTS.
- §6 (File size & complexity) — canonical table tied 1:1 to guard numbers.
- §7 (Testing) — bans real env, real secrets, hidden state.
- §10 (Scripts) — fail-closed default, no broad allowlists, no normalized paths.
- §13 (Independent self-review pass) — 9 explicit questions.
- §14 (Guard modification policy) — red-team test required.
- §17 (Logging / no PII) — concrete forbidden list.
- §22 (11 numbered scalability rules tied to guards).
- §23 (Integration model) — six-artifact agreement table, three cross-check guards.

### Weak / missing sections

- **No "Test quality" rubric beyond `expect(true).toBe(true)`.** §7 lists required test types but does not require: (1) `describe` block per public-api function, (2) ≥1 negative test per service function, (3) snapshot tests for public DTOs. Agent can ship one happy-path test and call it covered. **Add §7a — Minimum test-density rubric.**
- **No "Fixture builders" template.** §8 says builders must exist but does not show shape. **Add §8a — Builder pattern example with branded IDs.**
- **No API transport boundary rule.** Zod validation can leak into policy / mapper because the rule "Zod only at transport" is only in `active-rules §10.4`. **Mirror into coding-standards §24.**
- **No "API data layer" rule.** §10.6 of active-rules says "server state through one API/data access layer per feature" but coding-standards doesn't restate it. **Add §25.**
- **No "deterministic seeds" rule in coding-standards.** Lives in `active-rules §10.6` + `RULES_REGISTRY`. **Add §26.**
- **No "presentational vs container" pattern.** PX-UI-002 lives in registry; coding-standards mentions it once in §22 but without enforcement criteria. **Add §27 — Naming convention for presentational components (`*Card.tsx`, `*Tile.tsx`, `*Row.tsx`, `*Item.tsx`).**
- **No "Error boundaries baseline" examples.** §18 lists requirements but no minimum component count, no code shape. **Expand §18 with minimum location list (route shell, modal, feed list).**
- **No "Accessibility" enforcement criteria.** §16 lists requirements but no automated check. **Add a11y guard or document `manual_gate` explicitly in matrix.**

### Suggested rewrites

- §11 "Commit readiness" should explicitly reference `check-pre-commit-decision.mjs` outputs as the only valid evidence.
- §15 "Public repo / PR workflow rules" should add a row stating that "amending pushed commits requires owner approval (PX-AI-003 BLOCKED state)".

---

## 8. Agent safety review

### Current protections (strong)

- `AGENT_COMMAND_STANDARD.md` defines a Start Block + 12-field self-audit + mandatory invariant copy-paste blocks for backend / runtime tasks.
- `AI_AGENT_PERMISSIONS_POLICY.md` is explicit about Always Allowed / Allowed With Scope / Requires Owner Decision / Forbidden.
- `AI_FORBIDDEN_ACTIONS.md` lists 9 audit-and-verification prohibitions, 8 "forbidden report language" strings, and a required alternative (BLOCKED / IN_PROGRESS template).
- `check-self-audit-evidence.mjs` enforces the 12-field block in step reports.
- `check-fake-done.mjs` blocks the most common cheat phrases.
- `check-status-truth-consistency.mjs` cross-checks registry status vs report claims.
- `check-ai-agent-permissions.mjs` greps for `--no-verify`, direct push, `railway`, `db push`.

### Gaps

- **Agent baseline (PX-AI-001) is honor-system.** No guard parses a "DOCS READ:" or "BASELINE:" block from step reports. Agent could omit it and the report would still pass other checks.
- **No guard verifies the agent ran the gates it claims to have run.** `check-self-audit-evidence` enforces the *section* exists, not the *output*. Agent could write "PASS" without running.
- **No "guard delta" check.** Agent could weaken `check-fake-done` regex in commit N and reuse it in commit N+1. `check-script-safety` exists but is shallow. A *diff*-based guard ("any commit that touches a `scripts/check-*.mjs` must include a red-team fixture in `tests/architecture/fixtures/`") would close this.
- **No agent-bypass-language guard.** As listed in §5 — `ALLOW_STATUS_TERM_IN_POLICY_DOC` can be planted anywhere.
- **No "no scope creep" guard.** Agent could refactor unrelated domains under a small-scope task. `check-diff-safety.mjs` checks file count loosely; a tighter scope-vs-files guard could compare touched files against an EXPECTED_FILES block in the task prompt.
- **No "no report rewrite" guard.** Agent could quietly edit a prior step report to change a recorded status. `check-governance-drift` covers normative phrases, not historical evidence.

### Proposed command-standard additions

- **`§11. Evidence verification block`** — every report must include a `GATES_RUN:` block with command + exit-code pairs. Verified by a new `check-gates-run-evidence.mjs`.
- **`§12. No-scope-creep block`** — every report lists its declared `EXPECTED FILES` and an `ACTUAL FILES` diff. Mismatch = manual review required.
- **`§13. ZIP / manifest integrity`** — every audit ZIP must reference a manifest in the same commit; manifest's `workingTreeDirty` must agree with the commit's actual status. Verified by `check-audit-zip-manifest-integrity.mjs`.
- **`§14. No silent guard delta`** — any commit touching `scripts/check-*.mjs` must include a paired red-team fixture under `tests/architecture/fixtures/` proving the guard still fires.
- **`§15. No report rewrite`** — historical reports under `docs/review/**` are append-only after their slice closes; updates require a new `*_AMENDED.md` file or an explicit "Status correction" row in the index.

---

## 9. Domain boundary review

### Strong

- Domain ownership matrix (`DOMAIN_OWNERSHIP_MATRIX.md`) names exactly one owner per concept (16 rows in active-rules §4).
- `DOMAIN_BOUNDARY_RULES.md` lists allowed / forbidden cross-domain paths.
- `audit-domain-boundaries.mjs` + `check-architecture-import-graph.mjs` + depcruise + arch-tests form a 4-layer belt.
- Hardened against side-effect imports (documented adversarial fix in `audit-domain-boundaries.mjs:65-75`).
- `application-v2` role is explicit in ADR-010 and active-rules §10.1.

### Weak

- **`features-v2` vs `app-v2` separation is documented but only partially guarded.** `audit-domain-boundaries.mjs` flags illegal `features-v2/<feature>` imports across features but does not prevent `app-v2` from importing private internals of a feature (only the barrel is checked). A `app-v2` route file could `import ... from "@client/features-v2/communities-v2/mock-adapter"` and pass.
- **Public Hub vs source-of-truth rule is documented in active-rules §4 and ADR-008 but no static check.** A future Public Hub component could write to a domain table directly.
- **Workplaces vs communities** — manual gate (`PX-PROFILE-002`). `check-domain-scaffold` could be extended to refuse `server/domains-v2/professional-profile/` if attempted.
- **Channels vs community membership** — fully manual. No guard.
- **Friend feed not global** — covered by `check-removed-product-areas.mjs` partially.
- **`shared-ui` should never import a product domain** — currently enforced by `check-feature-registry.mjs` for static patterns. Could be tightened.

### Missing

- `check-features-v2-internal-import.mjs` — prevents `app-v2` from reaching past a feature's `index.ts` / `public-api.ts`.
- `check-public-hub-source-of-truth.mjs` — verifies `public-hub` features never import a domain's `repository.ts`.

---

## 10. Prioritized Slice 24 implementation plan

### P0_NOW (ship in Slice 24, no exceptions)

1. `check-application-use-cases-boundary.mjs` — PX-APP-001.
2. `check-event-envelope-contract.mjs` — PX-EVENT-001.
3. `check-transactional-outbox-pattern.mjs` — PX-EVENT-002.
4. `check-policy-pure-functions.mjs` — PX-POLICY-001.
5. `check-no-agent-bypass-language.mjs` — closes the ALLOW marker hole.
6. `check-viewer-context-on-public-reads.mjs` — PX-OWN-002.
7. `check-visibility-matrix.mjs` — PX-VIS-001.
8. `check-idempotency-flows.mjs` — PX-IDEMP-001 / PX-IDEMPOTENCY-001.
9. `check-public-dto-contract-tests.mjs` — PX-CONTRACT-001.
10. `check-read-model-owner.mjs` — PX-READMODEL-001.

Each new guard ships **with** a red-case fixture under
`tests/architecture/fixtures/` (per coding-standards §14) so removal of
the guard or weakening of its regex is itself caught by
`pnpm tooling:redcase`.

### P1_NEXT (Slice 25)

11. `check-branded-id-types.mjs` — PX-ID-001.
12. `check-domain-result-errors.mjs` — PX-ERROR-001.
13. `check-correlation-id-boundary.mjs` — PX-OBS-003.
14. `check-presentational-container-boundary.mjs` — PX-UI-002.
15. `check-deterministic-seeds.mjs` — PX-SEED-001.
16. `check-resource-context-refs.mjs` — PX-CTX-001.
17. `check-mock-adapter-status-truth.mjs` — feature registry consistency.
18. `check-features-v2-internal-import.mjs` — app-v2 ↔ features-v2 internal block.
19. Coding-standards additions §§7a / 8a / 24 / 25 / 26 / 27.
20. Agent command additions §§11–15.

### P2_LATER (Slice 26+)

21. `check-design-tokens-usage.mjs` — PX-UI-001.
22. `check-api-transport-boundary.mjs` — zod-at-transport rule.
23. `check-domain-readme-public-surface.mjs` — README discipline.
24. `check-public-hub-source-of-truth.mjs` — Public Hub never owns data.
25. a11y guard or explicit `manual_gate` (axe-core run + report).
26. eslint-plugin-boundaries v6 re-enable once `eslint-import-resolver-typescript` lands.

---

## 11. What NOT to do in Slice 24

- **No new product features.** Foundation only.
- **No runtime backend product work.** Pure governance hardening.
- **No massive rewrites.** Each new guard ≤ 250 lines per coding-standards §6.
- **No weakening of existing guards** — any guard touch requires a red-team fixture (coding-standards §14, PX-GOV-002).
- **No fake automation.** A "guard" that only logs `console.warn` does not count; everything must fail-closed (PX-GOV-002, coding-standards §10).
- **No new `manual_gate`s.** Slice 24's role is to *reduce* manual gates, not add them.
- **No deletions of `TODO_GUARD` rows from the matrix.** Each new guard moves a row from PARTIAL/YES to NO with a real script and a red-case fixture, not by removing the row.
- **No silent change of `STATUS_TAXONOMY.md`.** Any taxonomy edit requires an ADR (PX-ADR-001).
- **No commit unless `pnpm tooling:redcase` continues to PASS.** Adversarial proof is non-negotiable.

---

## 12. Final recommendation — exact top 10 changes to implement first

**Slice 24 is recommended to be a governance hardening implementation slice.**

Ship in this exact order; each step must end in a clean working tree
before the next begins. Every guard ships with: (1) the script,
(2) a red-case fixture under `tests/architecture/fixtures/<guard-name>/`,
(3) a `GUARDS_REGISTRY.yml` row, (4) a matrix update flipping the
relevant rule's `Gap?` to `NO`, (5) inclusion in `rules:check` or
`arch:check:v2` per §6, (6) `pnpm tooling:redcase` PASS proof.

1. **`check-no-agent-bypass-language.mjs`** (PX-GOV-002 extension).
   Smallest, blocks the agent-bypass marker hole before any new automation
   that could plant one. Registry of allowed paths = the doc.
2. **`check-application-use-cases-boundary.mjs`** (PX-APP-001).
   Highest-leverage architectural invariant for the next slice.
3. **`check-policy-pure-functions.mjs`** (PX-POLICY-001).
   Locks down policy.ts before the first real visibility matrix lands.
4. **`check-event-envelope-contract.mjs`** (PX-EVENT-001).
   Ensures every domain's `events.ts` carries the envelope shape.
5. **`check-viewer-context-on-public-reads.mjs`** (PX-OWN-002).
   Required before any public profile endpoint is wired.
6. **`check-visibility-matrix.mjs`** (PX-VIS-001).
   Forces `policy.ts` to export `canView` / `canEdit` per viewer kind.
7. **`check-public-dto-contract-tests.mjs`** (PX-CONTRACT-001).
   Makes every `public-api.ts` change visible to a sibling test.
8. **`check-idempotency-flows.mjs`** (PX-IDEMP-001 / PX-IDEMPOTENCY-001).
   Blocks the first `createPost` / `publishPost` / `uploadFinalize`
   regression.
9. **`check-transactional-outbox-pattern.mjs`** (PX-EVENT-002).
   Pairs with #4; both are needed before any cross-domain event lands.
10. **`check-read-model-owner.mjs`** (PX-READMODEL-001).
    Closes the cross-domain projection trap before the first read model.

**After this slice**, the matrix should show:
- Total rules: 74 (unchanged).
- Fully guarded (`Gap? = NO`): 47 → **57** (+10).
- Manual-gate only: 22 → **12**.
- Partial: 5 → **5** (no change; partial rows graduate next slice).
- TODO_GUARD markers: 11 → **1** (`check-design-tokens-usage` only).

**This is the minimum required posture to enter Slice 25 with real
backend transport work.**

---

### Reading list for the next agent

1. This document.
2. `docs/governance/RULES_REGISTRY.yml` + `docs/governance/RULES_TO_GUARDS_MATRIX.md`.
3. `docs/governance/BACKEND_ARCHITECTURE_INVARIANTS.md`.
4. `docs/architecture/PlatformaX-V2-active-rules.md` §10 (Runtime governance invariants).
5. `docs/architecture/PlatformaX-V2-coding-standards.md` §6 (size table) + §14 (guard modification policy) + §23 (integration model).
6. `docs/governance/AGENT_COMMAND_STANDARD.md` §9 / §10 (mandatory backend invariant blocks).
7. The 11 ADRs ADR-007..016.
8. Slice 23's `SLICE_23_FOUNDATION_HARDENING_REPORT.md` for the current state baseline.

— End of Slice 24 prep governance audit. **Status: AUDIT_DONE, NO_IMPLEMENTATION_PERFORMED.**
