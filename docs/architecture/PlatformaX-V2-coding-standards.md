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

Forbidden by default:

- `as any`
- `// @ts-ignore`
- `// @ts-expect-error` without issue reference and removal plan
- `Record<string, any>`
- untyped event payloads
- raw DB records returned from public routers or public APIs
- mixing private/internal DTOs with public DTOs

Allowed exception format:

```ts
// PLATFORMAX_EXCEPTION: <why this is necessary>
// Scope: <file/function>
// Risk: <risk>
// Removal plan: <condition/date/issue>
```

Exceptions without this block fail review.

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

| File type | Soft limit | Hard limit | Required reaction |
|---|---:|---:|---|
| React component | 250 lines | 350 lines | split into subcomponents/hooks/types |
| service.ts | 300 lines | 400 lines | split by use-case |
| repository.ts | 350 lines | 500 lines | split query builders/mappers/pagination |
| mapper.ts | 180 lines | 260 lines | split DTO mappers |
| policy.ts | 220 lines | 320 lines | split policy groups |
| test file | 700 lines | 1000 lines | split suites/builders |
| check script | 350 lines | 500 lines | extract helpers |

Hard limit violations require either refactor or explicit `COMPLEXITY_EXCEPTION` report. `eslint-disable max-lines` is not enough.

### Stylesheet limits (enforced by `scripts/check-file-size-limits.mjs`)

| File type | Hard limit | Reaction |
|---|---:|---|
| CSS module (`*.module.css`) | 360 lines | split by surface (layout / header / sections / per-block) |
| Global CSS (`*.css`, not module) | 500 lines | split by feature or extract tokens |

CSS limits are wired into `pnpm rules:check` and fail closed. Exceptional
fixtures may include the `ALLOW_FILE_SIZE_EXCEPTION` marker — only with a
documented justification in the step report.

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

1. **No large files.** File limits are enforced per type (route/page 280, regular .tsx 220, CSS module 320, backend service/repository/policy/router/mapper 240).
2. **No large functions.** Max 80 lines per function. React components max 140 lines.
3. **No unbounded lists.** Every list/feed/search must have `limit` + `maxLimit` + cursor or explicit fixed cap.
4. **Every list/feed/search needs limit + maxLimit + cursor/fixed cap + stable order.** Tie-breaker must be `id` or `createdAt`.
5. **No N+1 in feed/profile/comments/reactions.** Use batch/bulk queries, not per-item loops.
6. **No sync fanout in request path.** Notifications, search indexing, and expensive projections go through events/outbox.
7. **Public DTO never exposes PII.** No email, phone, dateOfBirth, privateContact, authMetadata in public outputs.
8. **UI buttons cannot be no-op.** Every button must perform a real action, open a modal, navigate, call an adapter, or be visibly disabled.
9. **Animation must respect prefers-reduced-motion.** CSS animations/transitions require a `prefers-reduced-motion` media query. `transition: all` is forbidden.
10. **New dependencies require review report justification.** No heavy packages for simple tasks. No duplicate libraries for the same purpose.
11. **Any exception must include reason + review/ticket path.** Exception markers without justification fail the guard.
12. **Profile/feed/social runtime must be batch/cursor/read-model ready.** No unbounded queries, no full-table scans, no raw DB records in public output.
