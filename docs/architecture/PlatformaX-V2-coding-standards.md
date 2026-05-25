# PlatformaX V2 — Coding Standards

Status: `ACTIVE`  
Owner: Engineering Quality / Governance  
Applies to: all TypeScript, React, Node, scripts and tests

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
