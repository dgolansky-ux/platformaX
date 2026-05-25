# PlatformaX V2 — Active Rules

Status: `ACTIVE`  
Owner: Architecture / Governance  
Applies to: all code, all agents, all branches, all reports  
Last updated: 2026-05-24

## 1. Purpose

This file is the project constitution. It defines the active non-negotiable rules for PlatformaX V2.

If a task, report, commit, PR, generated code or local shortcut conflicts with this file, this file wins.

These rules are intentionally strict. The project prioritizes long-term correctness over fast local success.

## 2. Primary decisions

| Area | Rule |
|---|---|
| Architecture | PlatformaX V2 is a clean modular monolith. |
| Future split | The codebase must remain split-ready for separate frontend, API, worker and realtime services. |
| Legacy | Legacy is source material only. It is not runtime. |
| Domain boundaries | Cross-domain integration goes only through `public-api.ts`, `contracts.ts`, `events.ts` or outbox contracts. |
| Status truth | Status must match evidence. No fake DONE. |
| Security | No public PII, no secrets in repo/logs/bundles, no frontend service role. |
| Media | No base64/dataUrl/readAsDataURL upload runtime. Media goes through the media domain. |
| Lists and feeds | Every runtime list/feed/search has limit, maxLimit, stable ordering and cursor or explicit fixed cap. |
| Scalability | No N+1 queries, no sync fanout in request path, no `select(*)` without mapper, no unbounded `Promise.all`. |
| Code quality | No functions over 80 lines, no components over 140 lines, no `transition: all`, no `key={index}`. |
| Dependencies | No new dependencies without review justification. No duplicate libraries for the same purpose. |
| Testing | Tests must not read real `.env` or require production/staging secrets. |
| Evidence | No evidence means no DONE. |
| Commit | No green gates means no commit. |
| Merge | No green CI and protected branch approval means no merge. |

## 3. Global architecture rule

PlatformaX V2 is one coherent system with strong internal domain boundaries.

A domain owns its source of truth. Other domains may consume stable public contracts, but they cannot reach into the owner’s internals.

Allowed cross-domain access:

- `server/domains-v2/<domain>/public-api.ts`
- `server/domains-v2/<domain>/contracts.ts`
- `server/domains-v2/<domain>/events.ts`
- shared value objects that are intentionally neutral
- outbox/event contracts

Forbidden cross-domain access:

- `repository.ts`
- `repository.drizzle.ts`
- `service.ts`
- `policy.ts`
- `router.ts`
- `mapper.ts`
- `db/schema`
- `cache-keys.ts`
- internal test helpers
- domain-specific UI internals from another frontend feature

If there is no public contract, the correct action is to create a contract or mark the task blocked. Deep import is not allowed.

## 4. Runtime ownership rules

| Concept | Owner |
|---|---|
| User account / auth subject | `identity` |
| Private profile data / visibility | `identity` |
| Public profile summary | `identity` |
| Friendship / relationship graph | `social` |
| Community / membership / roles | `communities-v2` |
| Posts / feeds / comments / reactions / topics | `content-v2` |
| Channels / follows / channel discovery | `channels` |
| Conversations / messages / broadcast inbox | `chat` |
| Events / registration / participants | `events` |
| Module definitions / enablement | `modules` |
| Public view composition | `public-hub` |
| Media upload / media refs / public URLs | `media` |
| Search projections | `search` |
| Notifications / outbox fanout | `notifications` |
| Audit logs | `audit` |
| Health, env, feature flags | `system` |

## 5. Legacy rules

Legacy code may be read to understand user flows, layout, copy, algorithms or domain intent. It must not be imported or executed by V2.

Forbidden:

- runtime imports from legacy folders
- active legacy routes
- active legacy backend routers
- active legacy nav links
- legacy build chunks in active V2 graph
- moving old folders into a clean V2 repo as “temporary”
- hiding old code under `archive`, `_old`, `legacy2`, `reference`, `temp` inside the active workspace

Allowed only outside active workspace:

- static reference packs
- screenshots
- isolated snippets copied into review notes
- manually rewritten V2 implementation

## 6. Removed product areas

The following areas may not be active unless a future ADR explicitly reintroduces them as V2-owned runtime:

- marketplace
- commerce
- payments
- checkout
- Stripe
- fundraisers
- donations
- productivity
- calendar
- tasks
- habits
- notes
- routines
- passions / pasje as a legacy product area
- knowledge base
- polls
- courses
- volunteering
- recruitment
- portfolio
- legacy mail newsletter
- old page builder
- old modules outside approved V2 module architecture

“Not active” means no route, no nav, no backend router, no active env/webhook/config, no build chunk, no hidden import.

## 7. Status truth

Allowed status labels:

- `NOT_STARTED`
- `PLANNED`
- `SCAFFOLD_ONLY`
- `UI_SHELL_ONLY`
- `MOCK_LOCAL_ONLY`
- `BACKEND_NOT_STARTED`
- `PARTIAL`
- `IMPLEMENTED`
- `BLOCKED`
- `MANUAL_REVIEW_REQUIRED`
- `DEPRECATED`
- `SUPERSEDED`
- `ACTIVE_EVIDENCE`
- `HISTORICAL_REPORT`

Restricted labels:

- `VISUAL_DONE` — only with screenshot/manual evidence.
- `BACKEND_DONE` — only with runtime, repository/service/router or adapter evidence and tests.
- `FULL_DONE` — practically forbidden until visual, runtime, tests, architecture, evidence and staging are all proven.
- `CLEAN` — only when all relevant gates pass.

Forbidden without evidence:

- `DONE`
- `final`
- `complete`
- `clean`
- `production-ready`
- `current scope clean`

## 8. Agent operating rule

Every large task must start with a baseline and end with a pre-commit decision.

Baseline must include:

- branch
- git status
- latest commit
- files touched or expected scope
- current failing gates, if known
- explicit forbidden actions

Final report must include:

- changed files
- deleted files, if any
- domains touched
- architecture impact
- gates run
- evidence path
- final status
- blockers
- whether commit is allowed

If the agent cannot prove the result, it must say `BLOCKED` or `IN_PROGRESS`. It must not simulate confidence.

## 9. No silent weakening

The following actions are forbidden unless explicitly requested by the project owner and documented in an ADR or report:

- weakening a guard so a task can pass
- adding broad allowlists
- deleting tests instead of fixing code
- replacing failures with `console.warn`
- adding `eslint-disable` to hide file size or type problems
- adding `as any` to bypass type design
- using `--no-verify`
- skipping CI-required checks
- changing status documents to match broken code
- inventing fake evidence

## 10. Acceptance

This document is acceptable only if:

- it is committed with the rest of governance docs,
- it is referenced by agent command templates,
- later scripts enforce its key rules,
- no feature work depends on ignoring it.
