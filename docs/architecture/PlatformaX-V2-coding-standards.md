# PlatformaX V2 — Coding Standards

Status: `ACTIVE`  
Owner: Engineering Quality / Governance  
Applies to: all TypeScript, React, Node, scripts and tests  
Governance Index: `docs/governance/GOVERNANCE_INDEX.md`

> **Note:** `docs/governance/` is the central governance index and registry.
> This file remains the authoritative source of coding standard rules.

## 1. Purpose

This document defines the code quality standard for PlatformaX V2.

It is not a style preference file. It is a safety contract. Code that passes locally but violates these standards is still wrong.

## 2. General principles

1. Write boring, explicit, typed code.
2. Prefer small modules over clever abstractions.
3. Prefer domain names over generic utility buckets.
4. Prefer typed fixtures/builders over `as any`.
5. Prefer honest `BLOCKED` over fake completion.
6. Prefer one clean path over several compatibility paths.
7. Every exception must be visible, justified and testable.

## 2a. Deep-only acceptance (Slice 24 onward)

PlatformaX V2 has ONE acceptance mode: `pnpm verify:deep`. No
sub-mode (`verify:fast`, `verify:normal`, `tooling:check`, individual
guards) can grant a READY / DONE / IMPLEMENTED / BACKEND_DONE /
VISUAL_DONE / TOP_TIER_READY status. The deep pipeline runs, in
order: `check`, `lint`, `test`, `build`, `rules:check`,
`arch:check:v2`, `guards:all-local`, `depcruise:check`, `arch-tests`,
`knip:check`, `secrets:gitleaks`, `tooling:redcase`. A step that
cannot run in the current environment (e.g. `gitleaks` binary
missing) must be reported as `NOT_RUN / ENV_BLOCKED` truthfully — it
does NOT pass.

Forbidden:

- claiming PASS for a step that was not run,
- claiming READY without an attached `verify:deep` log,
- using `verify:fast` / `verify:normal` as acceptance,
- promoting `tooling:redcase` to PASS while `--strict` mode is
  informational (use `BLOCKED` or document the gap, see EXC-017).

See `docs/governance/STATUS_TAXONOMY.md §Deep-only acceptance`.

## 3. TypeScript standard

Required:

- `strict: true`
- no implicit `any`
- no unchecked indexed access unless explicitly justified
- explicit DTO boundaries
- typed test builders
- discriminated unions for status/state where useful
- narrow return types for public APIs
- stable exported contracts

Forbidden by default (rule **PX-CODE-003** — "No unsafe any or ts-ignore without registered exception"):

- `as any`
- `: any` type annotation (incl. `: any[]`, `Promise<any>`, `: any | …`)
- `Record<string, any>` and any other `<…, any>` / `<any, …>` generic
- `catch (err: any)` — use `catch (err)` and narrow with `unknown`
- `// @ts-ignore`
- `// @ts-expect-error` without a same-line justification (≥ 8 chars after the directive)
- untyped event payloads
- raw DB records returned from public routers or public APIs
- mixing private/internal DTOs with public DTOs

These are enforced fail-closed by `scripts/check-no-any-types.mjs` and
`scripts/check-code-quality-structure.mjs`.

### Exceptions

Inline marker blocks alone are NOT enough. The only valid escape hatch is a
row in `docs/governance/EXCEPTIONS_REGISTER.md`. See §3a and the
"Coding rules integration model" at the end of this document.

For PX-CODE-003 specifically: a file is only skipped by `check-no-any-types`
if it appears in the `Files` column of an active EXCEPTIONS_REGISTER row
mapped to `PX-CODE-003`. An inline `// PLATFORMAX_EXCEPTION:` comment without
a register entry does NOT bypass the guard — `check-inline-exceptions-registered.mjs`
fails when a marker exists without a matching active register row.

### 3a. Exception policy (single source of truth)

`docs/governance/EXCEPTIONS_REGISTER.md` is the **only** source of active
exceptions. Every active exception must be a row in the "Active Exceptions"
table with all of these columns filled:

- `Exception ID` — `EXC-NNN`
- `Rule ID` — the `PX-*` rule being excepted
- `Reason` — why the exception is needed
- `Expiry` — absolute date or condition for review/removal
- `Owner` — who approved (named human)
- `Evidence` — link to ADR, step report, or approval
- `Risk` — what risk the exception introduces
- `Status` — `active` / `expired` / `revoked`
- `Files` — affected file paths

Inline markers (`PLATFORMAX_EXCEPTION`, `QUALITY_STRUCTURE_EXCEPTION`,
`ALLOW_FILE_SIZE_EXCEPTION`, `ALLOW_PRIVATE_DTO_PII`) MUST reference a file
listed in an active register row — `scripts/check-inline-exceptions-registered.mjs`
fails the build when a marker exists without a matching register entry, and
also when a register entry points at a file that no longer carries the marker
(stale exception).

Expired rows are revoked by `scripts/check-exception-expiry.mjs`
(rule **PX-EXC-002**).

## 4. React standard

Required:

- components have one clear responsibility
- heavy components are split into subcomponents, hooks and types
- UI state is explicit
- async state is represented as typed state, not loose booleans everywhere
- buttons are semantic `<button>` or accessible component wrappers
- modal/sheet flows are controlled and testable
- responsive behavior is intentional, not accidental

Forbidden:

- hidden `onClick={() => {}}`
- hidden no-op CTA
- `window.alert`
- `window.confirm`
- random `localStorage` or `sessionStorage` as fake backend
- fetch/Supabase/tRPC calls embedded in visual-only components
- components importing backend internals
- domain logic in `shared-ui`

Every button must do one of these:

- perform a real local action,
- open a modal/sheet,
- navigate to an allowed route,
- call a typed adapter,
- be visibly disabled with a policy/state reason.

## 5. Backend standard

Required per V2 domain:

```txt
server/domains-v2/<domain>/
  README.md
  public-api.ts
  contracts.ts
  dto.ts
  mapper.ts
  policy.ts
  service.ts
  repository.ts
  router.ts
  events.ts
  __tests__/
```

Router rules:

- thin transport only
- validate input
- authenticate/authorize
- call service
- return DTO
- no SQL
- no large business logic

Service rules:

- owns use-cases
- calls own repository
- calls other domains only through public API/contracts/events
- no direct DB internals from other domains
- no frontend-specific DTO leakage

Repository rules:

- owns persistence for its domain only
- no cross-domain business logic
- cursor/limit support for lists
- no `select(*)` in hot paths without justification
- no PII returned to public mapper unless explicitly needed internally

Mapper rules:

- raw record -> DTO
- public mapper has PII leak tests
- no raw DB record leaves mapper/service boundary as public output

Policy rules:

- explicit owner/friend/member/admin/stranger rules
- no duplicated ad-hoc permission checks across screens
- critical policy decisions have tests

## 5.1 Backend architecture invariants

Canonical checklist: `docs/governance/BACKEND_ARCHITECTURE_INVARIANTS.md`  
Rules: `PX-OWN-001`, `PX-OWN-002`, `PX-VIS-001`, `PX-DTO-002`, `PX-CTX-001`, `PX-MEDIA-004`, `PX-LIST-004`, `PX-DB-004`, `PX-EVENT-001`, `PX-LC-001`, `PX-IDEMP-001`, `PX-AIS-002`

### Identity fields (do not conflate)

| Field | Role |
|---|---|
| `id` | Record UUID — **not** proof of ownership |
| `ownerUserId` / `ownerId` | Who owns the resource |
| `viewerUserId` / `viewerContext` | Who is reading (`owner` \| `friend` \| `stranger` \| `anonymous` \| `admin`) |
| `slug` / `publicId` | Public URL identifier — never raw `userId` in public routes when slug is required |

### DTO mapping

- Flow: `DB record → mapper → DTO → public-api`
- Public DTO: zero PII (no email, phone, DOB, token, session, provider, raw user, storage path)
- Private/admin DTOs stay inside domain; never leak through public mapper

### Visibility and policy

- Visibility matrix per field: owner / friend / stranger / anonymous
- Policies are pure functions: `canView`, `canEdit`, `canAttach`, `canDelete` (**PX-POLICY-001**)

### Lists and cursors

- `limit` + `maxLimit` + opaque `cursor` (or fixed cap) + stable order
- No offset pagination on large runtime feeds (**PX-CURSOR-001**)

### Media

- Attach only after validating asset `ownerUserId`, `purpose`, `status`
- Store refs in owner domain; uploads via media domain presigned path only

### Events, outbox, idempotency

- Fanout via **EventEnvelope** + **transactional outbox** — not sync request-path loops
- Retry-sensitive writes: `idempotencyKey` or documented exemption in AIS

### Status lifecycle

- Use explicit status enums; soft delete via `deletedAt` where applicable — no ad-hoc hidden states

## 6. File size and complexity limits

These are the **canonical, single source-of-truth limits**. Each value
matches the actual fail-closed enforcement in the listed guard script —
if you want to change a number, you must change both this table and the
guard in the same commit.

The two TypeScript file guards are layered:

- `check-code-quality-structure.mjs` enforces the **stricter contextual**
  limit (route vs regular component, service vs repository, …).
- `check-file-complexity.mjs` enforces the **broader upper bound** that
  catches anything the contextual rule didn't.

### 6.1 Enforced limits (TypeScript / React)

| Target | Hard limit | Guard | Reaction |
|---|---:|---|---|
| Route/page `.tsx` (`*Page.tsx`, `*Route.tsx`, `*Flow.tsx`, `page.tsx`, `layout.tsx`) | 280 | `check-code-quality-structure.mjs` | split sections / subcomponents |
| Regular `.tsx` component | 220 | `check-code-quality-structure.mjs` | split subcomponents / hooks / types |
| Any `.tsx` (upper bound) | 350 | `check-file-complexity.mjs` | refactor or registered exception |
| `service.ts` (contextual) | 240 | `check-code-quality-structure.mjs` | split by use-case |
| `service.ts` (upper bound) | 400 | `check-file-complexity.mjs` | hard refactor |
| `repository.ts` (contextual) | 240 | `check-code-quality-structure.mjs` | split query builders / mappers |
| `repository.ts` (upper bound) | 500 | `check-file-complexity.mjs` | hard refactor |
| `policy.ts` / `router.ts` / `mapper.ts` | 240 | `check-code-quality-structure.mjs` | split modules |
| `__tests__/*.test.*` | 1000 | `check-file-complexity.mjs` | split suites / builders |
| `scripts/check-*.mjs` (and similar) | 500 | `check-file-complexity.mjs` | extract helpers |
| Function body (any) | 80 lines | `check-code-quality-structure.mjs` | extract helper functions |
| React component body | 140 lines | `check-code-quality-structure.mjs` | split subcomponents |
| Exports per file | 15 | `check-code-quality-structure.mjs` | split module |
| Props per `*Props` type | 12 | `check-code-quality-structure.mjs` | split component / extract group |
| Generic `utils.ts`/`misc.ts`/`helpers.ts` | 100 lines | `check-code-quality-structure.mjs` | rename per domain responsibility |

### 6.2 Enforced limits (stylesheets)

| Target | Hard limit | Guard | Reaction |
|---|---:|---|---|
| `*.module.css` (contextual, app-v2/features-v2) | 320 | `check-code-quality-structure.mjs` | split by surface |
| `*.module.css` (upper bound, all dirs) | 360 | `check-file-size-limits.mjs` | split by surface |
| Global `*.css` | 500 | `check-file-size-limits.mjs` | split or extract design tokens |

### 6.3 Exceptions

Hard limit violations require a row in `docs/governance/EXCEPTIONS_REGISTER.md`
mapped to the relevant `PX-*` rule (see §3a). Inline-only escape hatches
(`QUALITY_STRUCTURE_EXCEPTION`, `ALLOW_FILE_SIZE_EXCEPTION`, etc.) without a
matching register entry are rejected by
`scripts/check-inline-exceptions-registered.mjs`. `eslint-disable max-lines`
is never sufficient on its own.

> Earlier drafts of this document carried advisory "soft / hard" pairs (e.g.
> React component soft 250 / hard 350). Those advisory numbers are removed:
> the only numbers that matter are the hard, enforced ones above.

## 7. Testing standard

Required test types:

- DTO PII tests
- mapper tests
- policy tests
- public-api surface tests
- pagination tests for runtime lists
- architecture/import tests
- guard tests for `scripts/check-*`
- visual shell local state tests where UI is implemented without backend

Tests must not:

- load real `.env`
- require production/staging secrets
- call external services by default
- rely on hidden local developer state
- mutate real DB unless a specific integration test environment is explicitly configured

## 8. Fixtures and mocks

Fixtures must be typed and located close to the feature or test.

Required:

- `fixtures.ts` for UI shells
- typed builders for domain tests
- explicit `MOCK_LOCAL_ONLY` status when UI uses local fixtures
- stable IDs and deterministic dates in tests

Forbidden:

- random generated data in snapshot-like tests
- fake success that looks like real backend success
- fixtures containing secrets or real PII

## 9. Error handling

Required:

- typed domain errors
- safe user-facing messages
- structured internal logs
- no PII in logs
- no secrets in thrown errors
- error boundaries around major app regions

Forbidden:

- swallowing errors silently
- converting every error to generic success
- exposing DB errors to public frontend
- logging request bodies containing PII

## 10. Scripts standard

All governance scripts must:

- fail closed by default
- print clear failing files and reasons
- support deterministic CI output
- avoid network access unless explicitly documented
- mask secrets in output
- have tests or fixture-based smoke checks
- not normalize paths before raw ZIP path validation

Scripts must not:

- hide errors behind warnings
- use broad allowlists
- skip files silently
- depend on local machine state

## 11. Commit readiness

A code change is not commit-ready until:

- changed files are listed,
- impacted domains are identified,
- status docs are updated honestly,
- relevant tests/gates pass,
- pre-commit decision is `COMMIT_ALLOWED`,
- no forbidden action was used.

If any required gate fails, the correct status is `IN_PROGRESS` or `BLOCKED`.

## 12. AI-assisted coding rules

When an AI agent writes code in this repository:

1. The agent must read relevant architecture docs before touching files.
2. The agent must not optimize for speed at the cost of correctness.
3. The agent must run all gates before proposing a commit.
4. The agent must perform an independent self-review pass after coding and before reporting results.
5. The agent must never trust its own prior output without verifying against actual code and gate logs.
6. The agent must not weaken any guard, test, or enforcement mechanism to make its changes pass.
7. The agent must not introduce any import that violates domain boundary rules.
8. Every AI-generated commit must go through a PR with Architecture Impact Statement.

## 13. Independent self-review pass

After completing changes, the agent (or human) must perform a second pass as an independent reviewer:

1. Re-read all changed files looking for regressions.
2. Verify no cross-domain imports were introduced.
3. Verify no legacy runtime was imported.
4. Verify no PII leaks in public DTOs.
5. Verify no secrets, base64, or dataUrl patterns.
6. Verify no fake DONE/status strings.
7. Verify no guards were weakened or removed.
8. Verify all gates pass with real logs (not invented).
9. Document findings in the SELF-AUDIT / INDEPENDENT REVIEW PASS section.

## 14. Guard modification policy

Guards may only be modified when:

1. A new domain or feature legitimately requires updating an allowlist.
2. The modification is accompanied by a red-team test proving the guard still catches violations.
3. The change is documented in the step report with explicit justification.
4. The modification does not weaken existing checks — it must be additive or neutral.
5. A guard must never be bypassed, removed, or softened to make a task pass.

## 15. Public repo / PR workflow rules

1. All changes must go through a branch and PR — no direct pushes to `main`.
2. Every PR must include an Architecture Impact Statement.
3. GitHub CI must pass before merge is allowed.
4. CODEOWNERS review is required.
5. Force push to `main` is forbidden.
6. `--no-verify` is forbidden unless explicitly approved by repo owner.

## 16. Accessibility baseline

All UI components must meet:

1. Semantic HTML elements (`button`, `nav`, `main`, `header`, etc.).
2. ARIA labels on interactive elements without visible text.
3. Keyboard navigability for all interactive flows.
4. Sufficient color contrast (WCAG AA minimum).
5. No information conveyed by color alone.

## 17. Logging / no PII in logs

1. Structured logging is required for all backend services.
2. Logs must never contain: passwords, tokens, session IDs, email addresses, phone numbers, full names linked to IDs, or any PII.
3. Request bodies must be sanitized before logging.
4. Error messages exposed to users must not reveal internal state or DB structure.

## 18. Error boundaries baseline

1. Every major UI region must have an error boundary.
2. Error boundaries must render a user-friendly fallback, not a blank screen.
3. Caught errors must be logged to structured logging.
4. Error boundaries must not swallow errors silently.

## 19. Test builders / no `as any` policy

1. Test fixtures must use typed builder functions, not raw object literals with `as any`.
2. `as any` is forbidden in test code — use proper typing or `as unknown as Type` with a justification comment.
3. Test builders must live close to the domain they serve.
4. Builders must produce valid, deterministic data by default.

## 20. Generated / scaffold code rules

1. Scaffold generators (`scaffold:domain`, `scaffold:ui-shell`, `scaffold:route`) must produce code that passes all gates without modification.
2. Generated files must be immediately lint-clean and type-safe.
3. Generated code must include a `README.md` explaining the domain/feature.
4. Scaffolds must register the domain/feature in the appropriate registry.

## 21. Review checklist before commit

Before every commit, verify:

- [ ] Changed files are listed in the report.
- [ ] Domains touched are identified.
- [ ] Cross-domain imports: none or explicitly justified.
- [ ] Legacy runtime imports: none.
- [ ] Public DTO PII: none.
- [ ] Fake DONE / status truth: none.
- [ ] Env safety: no .env changes or secrets.
- [ ] `pnpm check` PASS.
- [ ] `pnpm lint` PASS.
- [ ] `pnpm test` PASS.
- [ ] `pnpm build` PASS.
- [ ] `pnpm rules:check` PASS.
- [ ] PRE-COMMIT DECISION is COMMIT_ALLOWED.
- [ ] SELF-AUDIT / INDEPENDENT REVIEW PASS section is complete.

## 22. Code quality and scalability rules (enforced by guards)

These rules are enforced by `scripts/check-code-quality-structure.mjs`, `scripts/check-scalability-patterns.mjs`, `scripts/check-frontend-performance-patterns.mjs`, `scripts/check-dependency-discipline.mjs`, and `scripts/check-logging-pii-security.mjs`.

1. **No large files / functions / components.** See §6 for the canonical
   enforced limits table; do not restate the numbers here.
2. **No unbounded lists.** Every list/feed/search must have `limit` + `maxLimit` + cursor or explicit fixed cap.
3. **Every list/feed/search needs limit + maxLimit + cursor/fixed cap + stable order.** Tie-breaker must be `id` or `createdAt`.
4. **No N+1 in feed/profile/comments/reactions.** Use batch/bulk queries, not per-item loops.
5. **No sync fanout in request path.** Notifications, search indexing, and expensive projections go through events/outbox.
6. **Public DTO never exposes PII.** No email, phone, dateOfBirth, privateContact, authMetadata in public outputs.
7. **UI buttons cannot be no-op.** Every button must perform a real action, open a modal, navigate, call an adapter, or be visibly disabled.
8. **Frontend perf and render hygiene (PX-CODE-004).** No `transition: all`; animations/transitions require a `prefers-reduced-motion` media query; every list `.map` render needs a stable unique `key` (never `index`); `addEventListener`/`setInterval`/`setTimeout` inside `useEffect` need paired cleanup; large fixture arrays do not live in component files; `<img>` in list/card/feed/grid context needs `loading="lazy"`.
9. **New dependencies require review report justification.** No heavy packages for simple tasks. No duplicate libraries for the same purpose.
10. **Any exception must be registered.** Inline markers alone are not enough — see §3a; `scripts/check-inline-exceptions-registered.mjs` fails the build when an inline marker is missing from `EXCEPTIONS_REGISTER.md` (and when a register row points at a file that no longer carries the marker).
11. **Profile/feed/social runtime must be batch/cursor/read-model ready.** No unbounded queries, no full-table scans, no raw DB records in public output.

## 22a. Architecture tooling spike (parallel with custom guards)

Spike branch: `tooling/architecture-boundaries-quality-spike`. None of the
existing custom guards is removed by the spike; each new tool runs
**PARALLEL_WITH_TOOLING** with its custom counterpart and is verified
against documented red-case fixtures in `tests/architecture/fixtures/`.

| Tool | Local script | What it covers | Custom guard it parallels |
|---|---|---|---|
| `eslint-plugin-boundaries` | `pnpm boundaries:check` (folded into `pnpm lint`) | Status: `PARTIAL_NOT_ENFORCED` — plugin loads but v6 enforcement is blocked on missing TS path resolver wiring; tracked in `docs/governance/followups/FIX_ESLINT_PLUGIN_BOUNDARIES_V6_ENFORCEMENT.md`. Coverage today is via depcruise + arch-tests + `audit-domain-boundaries.mjs`. | `audit-domain-boundaries.mjs` |
| `dependency-cruiser` | `pnpm depcruise:check` / `pnpm depcruise:graph` | Cycles, `no-client-to-server`, cross-domain internals, legacy runtime, shared-no-runtime | `audit-domain-boundaries.mjs`, `check-architecture-import-graph.mjs`, `check-no-legacy-imports.mjs` |
| Architecture tests (Vitest) | `pnpm arch-tests` | Executable specs for the same invariants as above (PX-ARCH-001/003/004/008/009, PX-APP-001). Plain Vitest assertions — ArchUnitTS/tsarch evaluated and dropped, no DSL dependency. | Custom regex umbrella + ad-hoc walks |
| `knip` | `pnpm knip:check` | Unused files / exports / dependencies (weekly lane) | — (new coverage) |
| `gitleaks` | `pnpm secrets:gitleaks` (dev-friendly, noop-passes if binary missing) / `pnpm secrets:gitleaks:required` (CI/deep gate — BLOCKS if binary missing) | Generic secret patterns (AWS/GCP/GH/JWT/PEM) | `check-secret-scan.mjs`, `check-local-secret-scan.mjs` (PlatformaX-specific rules stay) |
| Tooling red-case verifier | `pnpm tooling:redcase` | Plants temporary safe violations, asserts each tool exits non-zero, then cleans up. Authoritative proof the tools ENFORCE, not just report. | — |
| GitHub CodeQL | `.github/workflows/codeql.yml` | OWASP-extended JS/TS scanning | — (status: `CODEQL_NEEDS_GITHUB_SETUP` until enabled in repo Settings) |

Aggregate convenience commands:

- `pnpm tooling:check` — runs boundaries + depcruise + arch-tests + gitleaks (dev mode).
- `pnpm tooling:redcase` — proves every tool fails closed on planted red cases.
- `pnpm tooling:weekly` — runs knip + dependency graph + audit ZIP.

CI lanes (`.github/workflows/v2-gates.yml` + `v2-weekly-audit.yml`):

- **STANDARD**: type / lint+boundaries / test (incl. arch-tests) / build / guards / arch (every PR).
- **DEEP**: dependency-cruiser + Gitleaks (`secrets:gitleaks:required` — BLOCKS if binary missing).
- **WEEKLY**: Knip + dependency graph artifact + audit ZIP (Sunday cron + manual dispatch).

Truth disclosures (do not claim PASS unless these hold):

- **eslint-plugin-boundaries**: `PARTIAL_NOT_ENFORCED`. The plugin loads but the previous v5-style rules were dropped (v6 emits only warnings on them) and a quick `boundaries/dependencies` rewrite was blocked on the missing `eslint-import-resolver-typescript` wiring (targets came back as `isUnknown: true`). Coverage stays via `dependency-cruiser`, `pnpm arch-tests`, and the hardened `audit-domain-boundaries.mjs`. Follow-up: `docs/governance/followups/FIX_ESLINT_PLUGIN_BOUNDARIES_V6_ENFORCEMENT.md`.
- **gitleaks**: `secrets:gitleaks` exits 0 with a loud `GITLEAKS_BINARY_NOT_INSTALLED` log when the binary is missing — this is developer-friendly only. `secrets:gitleaks:required` (used in CI/deep gate) BLOCKS in that case.
- **CodeQL**: workflow committed, but status is `CODEQL_NEEDS_GITHUB_SETUP` until the repo owner enables Code scanning in repo Settings.
- **Knip**: weekly lane; `continue-on-error: true` for the Knip step so unused-code candidates do not block PRs by design.

`GUARDS_REGISTRY.yml` marks custom guards that now have parallel tooling
with `parallel_status: PARALLEL_WITH_TOOLING` and lists the corresponding
tools under `parallel_tools`. No custom guard is removed yet — removal
needs a separate spike that proves each tool catches every red case the
custom guard does.

## 23. Coding rules integration model

Coding rules are governed by six artifacts that must agree. If they
disagree, the work status is `BLOCKED` or `PARTIAL`, never `READY`.

| Layer | Source of truth | Notes |
|---|---|---|
| Human rule | `docs/architecture/PlatformaX-V2-coding-standards.md` (this file) | Prose for reviewers and contributors. |
| Machine rule | `docs/governance/RULES_REGISTRY.yml` | Each rule has a stable `PX-*` ID, severity, `enforced_by`, and `status: active`. |
| Enforcement | `scripts/check-*.mjs` | Fail-closed guard scripts named in `enforced_by`. |
| Guard metadata | `docs/governance/GUARDS_REGISTRY.yml` | Records every guard with `runs_in`, `rules_enforced`, `required`, `status`. |
| Coverage truth | `docs/governance/RULES_TO_GUARDS_MATRIX.md` | Human-readable rules-to-guards map and gap summary. |
| CI execution | `.github/workflows/v2-gates.yml` | Must invoke (directly or via `pnpm guards:all-local`) every guard marked `runs_in: ci`. |
| Exceptions | `docs/governance/EXCEPTIONS_REGISTER.md` | The only valid escape hatch — see §3a. |

Cross-checks (all fail-closed):

- `scripts/check-guards-registry.mjs` verifies every active required guard
  with `runs_in: ci` is reachable from `.github/workflows/v2-gates.yml`,
  and every `runs_in: pre-push` guard from `.husky/pre-push` or
  `pnpm guards:all-local`.
- `scripts/check-rules-to-guards-coverage.mjs` verifies every registered
  rule has a row in `RULES_TO_GUARDS_MATRIX.md`, every `enforced_by` path
  points at a real file, and the matrix summary counts match the actual
  rows (no false "only N gaps" framing).
- `scripts/check-inline-exceptions-registered.mjs` verifies every inline
  exception marker maps to an active row in `EXCEPTIONS_REGISTER.md` and
  vice versa.

These three guards together make the integration model self-checking: a
silent drift between any pair of artifacts above breaks the build.

## 24. Minimum test-density rubric (Slice 24)

A "tests exist" claim must meet the rubric below before READY is
allowed for the touched scope. Backed by `check-placeholder-tests.mjs`
and by the new `check-public-dto-contract-tests.mjs`.

| Surface | Minimum required test |
|---|---|
| `policy.ts` | one negative test per exported predicate (denies the wrong viewer). |
| `service.ts` | one positive + one negative test per public command. |
| `public-api.ts` | a sibling `__tests__/public-api*.test.ts` (or `domain-contract*.test.ts` or `public-mapper*.test.ts`) asserting the export shape AND zero PII in any public DTO. |
| `repository.ts` | builder + at least one round-trip test against the in-memory mock when the real DB is not yet wired. |
| Lists / feeds / search | a cursor-pagination test asserting `nextCursor` + stable order. |
| Mutations (`update*`, `delete*`, `attach*`, `revoke*`) | one positive test + one "wrong owner" negative test. |

A placeholder test (`expect(true).toBe(true)` and friends) is
detected by `check-placeholder-tests.mjs` and fails closed. A test
file with only happy-path assertions on a public boundary is allowed
only when the corresponding rule carries a `PX-RULE-ACK:` marker.

## 25. Backend layer responsibilities (canonical)

| Layer | Responsibility | Allowed imports | Forbidden imports |
|---|---|---|---|
| `router.ts` | Transport adapter; deserialize input, call service or use-case, serialize response. Owns Zod parsing. | own service, own public-api, `shared/contracts`. | other domains, repository, policy, mapper. |
| `service.ts` | One-domain command handlers + read paths. Owns the in-domain transaction shape. | own repository, own policy, own mapper, own contracts, `shared/contracts`. | other domains' public-api / service / repository (`check-application-use-cases-boundary.mjs`). |
| `repository.ts` | Persistence + projections. | own db helpers, own contracts, `shared/contracts`. | other domains; transport. |
| `policy.ts` | Pure visibility / permission predicates. | type imports only (`check-policy-pure-functions.mjs`). | IO, fs, fetch, supabase, repository, service, Date.now / Math.random / crypto.randomUUID. |
| `mapper.ts` | DB row ↔ DTO. | own dto, own contracts. | service, repository at runtime. |
| `public-api.ts` | Safe domain entry-point for other domains and `application-v2`. | own service factory, own dto. | other domains' internals. |
| `events.ts` | Cross-domain event types wrapped in `EventEnvelope`. | `@shared/contracts/event-envelope`, own dto. | service, repository. |

`server/application-v2/use-cases/<flow>/service.ts` is the ONLY place
where a flow that crosses 2+ domains may live (PX-APP-001 +
`check-application-use-cases-boundary.mjs`).

## 26. Visibility matrix (owner / friend / stranger / anonymous / admin)

Every domain that owns user-visible data must declare its visibility
matrix in `policy.ts` as `can*` / `may*` / `is*` / `visible*` /
`select*` / `allow*` / `filter*` predicates. Routers MUST NOT
contain raw `if (viewer === "stranger")` checks (caught by
`check-visibility-matrix.mjs`). The supported viewer kinds are
documented in `BACKEND_ARCHITECTURE_INVARIANTS.md §3`.

Public reads must accept a `viewer*` parameter (any of
`viewerContext`, `viewerRole`, `viewerId`, `viewerUserId`,
`viewerSession`) — caught by `check-viewer-context-on-public-reads.mjs`.
Truly public-only reads (anyone gets the same data, no per-viewer
filtering) carry a file-level `PX-OWN-002-ACK:` marker registered in
`EXCEPTIONS_REGISTER.md`.

## 27. Idempotency, EventEnvelope, transactional outbox

| Concern | Rule | Guard | Marker for pre-runtime files |
|---|---|---|---|
| Retry-sensitive commands (`create*`, `publish*`, `upload*`, `finalize*`) take `idempotencyKey`. | PX-IDEMP-001 / PX-IDEMPOTENCY-001 | `check-idempotency-flows.mjs` | `PX-IDEMP-001-ACK:` |
| Cross-domain events travel inside `EventEnvelope` from `@shared/contracts/event-envelope`. | PX-EVENT-001 | `check-event-envelope-contract.mjs` | `PX-EVENT-001-ACK:` |
| Event publish happens inside the same DB transaction as the source-of-truth write (outbox pattern). | PX-EVENT-002 | `check-transactional-outbox-pattern.mjs` | `PX-EVENT-002-ACK:` |

Each `*-ACK:` marker is logged but does not block. Files carrying a
marker must appear in `EXCEPTIONS_REGISTER.md` (EXC-016 for the
Slice 24 backlog).

## 28. Read-model ownership

Each projection / read-model table has exactly one owning domain
(PX-READMODEL-001). The owner is the domain that DECLARES the
projection in its README under `## Read models` or `## Projections`.
A second domain may LIST the same projection as a SUBSCRIBER only
with a `<!-- PX-READMODEL-001-ACK: <reason> -->` HTML comment in its
README; the first domain declaration is treated as the owner.
Guard: `check-read-model-owner.mjs`.

## 29. Public-DTO contract tests

Every `server/domains-v2/<domain>/public-api.ts` must have a sibling
test under `__tests__/` whose filename matches `public-api*.test.*` /
`domain-contract*.test.*` / `public-mapper*.test.*`. The test must
assert the export shape AND that no PII (email, phone, DOB, token,
session, raw provider) leaks via the public DTO. Guard:
`check-public-dto-contract-tests.mjs`.

## 30. Agent safety addenda (Slice 24)

- Adding a new `ALLOW_STATUS_TERM_IN_POLICY_DOC` marker requires the
  file path be added to the allowlist in
  `scripts/check-no-agent-bypass-language.mjs`. Planting the marker
  in arbitrary files fails closed.
- Phrases suggesting a gate can be skipped without `BLOCKED` status —
  "temporary bypass", "skip the gate", "skip verify:deep", "disable
  guard", "bypass the gate" — are forbidden outside the registered
  governance / AI policy docs.
- An inline `PLATFORMAX_EXCEPTION` marker in a file NOT listed in
  `EXCEPTIONS_REGISTER.md` fails closed via
  `check-inline-exceptions-registered.mjs` AND
  `check-no-agent-bypass-language.mjs` (defense in depth).
- A guard modification commit MUST include a red-case fixture or
  amended fixture proving the guard still fires (see
  `docs/governance/AGENT_COMMAND_STANDARD.md §14`).
- READY / TOP_TIER_READY without a `pnpm verify:deep` log is treated
  as PX-GOV-002 (guard weakening). See `STATUS_TAXONOMY.md
  §Deep-only acceptance`.

## 31. ZIP and manifest truth

A "report ZIP" (slim, only the audit reports + manifests for a
slice) and a "full-source ZIP" (entire working tree minus
exclusions) are different products. Confusing one for the other in a
report is forbidden. Every audit ZIP must:

- carry a JSON manifest with the same prefix as the ZIP and a
  matching `commitShortSha` and `workingTreeDirty` flag,
- embed the manifest inside the ZIP at `MANIFEST.json`,
- exclude `.git/**`, `node_modules/**`, `dist/**`, `build/**`,
  `.next/**`, `coverage/**`, `.cache/**`, `tmp/**`, `.wip-safety/**`,
  `audit-out/**`, `.claude/**`, `.env`, `.env.*` (except
  `.env.example` and `.env.test.example`), `secrets/**`, prior
  ZIPs, `test-results/**`, `playwright-report/**`, and private
  local settings,
- set `finalStatus: BLOCKED` if any validation check fails (no `.git`,
  no `node_modules`, no env except examples, no secrets, no old
  zips, manifest present inside the ZIP).

`workingTreeDirty: true` is acceptable when truthful; `workingTreeDirty:
false` is forbidden when the working tree actually has changes.
