# PlatformaX V2 — Status Taxonomy

Status: `ACTIVE`
Owner: Governance / Status Truth

## Purpose

Defines all allowed status labels, when each may be used, and what evidence is required.

---

## Status Labels

### SCAFFOLD_ONLY

- **When allowed:** Scaffold files exist (`README.md`, `public-api.ts`, `contracts.ts`, `dto.ts`, `policy.ts`, `events.ts`, `index.ts`) and status evidence is present. No usable runtime.
- **When NOT allowed:** Any runtime, router, or service exists.
- **Evidence required:** README, public scaffold files, `domain-registry.ts`, `DOMAIN_STATUS_REGISTRY.yml`, and scaffold contract test without placeholder assertions. No runtime claims.

### UI_SHELL_ONLY

- **When allowed:** Frontend shell exists with local state/fixtures. No real backend connection.
- **When NOT allowed:** Backend adapter or API is connected.
- **Evidence required:** Clickable UI, local tests, report stating no backend.

### MOCK_LOCAL_ONLY

- **When allowed:** Uses typed fixtures/local state intentionally. No real data.
- **When NOT allowed:** Real backend or database is connected.
- **Evidence required:** Fixture files, explicit status in code/docs.

### BACKEND_NOT_STARTED

- **When allowed:** Frontend may exist but no backend implementation.
- **When NOT allowed:** Any backend service/repository/router exists.
- **Evidence required:** No backend done claims.

### PARTIAL

- **When allowed:** Some real contracts/use-cases/tests exist but full runtime is missing.
- **When NOT allowed:** Everything is scaffold, or everything is fully implemented.
- **Evidence required:** scaffold files plus `service.ts` or explicit reason why service has not started; repository/interface or explicit no-storage status; mapper when raw mapping exists; policy tests; DTO/public mapper tests; public-api tests; missing parts listed.

### AUTH_RUNTIME_PARTIAL

- **When allowed:** Auth integration exists but is not complete (e.g. session works, registration pending).
- **When NOT allowed:** Auth is fully functional or not started at all.
- **Evidence required:** List of working vs. missing auth flows.

### UI_VISUAL_SHELL_DONE

- **When allowed:** Visual shell is complete — all screens, states, empty states, modals rendered.
- **When NOT allowed:** Missing screens or states exist.
- **Evidence required:** Screenshots or manual visual review. Must NOT claim backend done.

### MANUAL_REVIEW_REQUIRED

- **When allowed:** Cannot be accepted automatically. Needs human review.
- **When NOT allowed:** Automated gates can verify the state.
- **Evidence required:** Review target and reason documented. Owner manual visual review can be evidence.

### MANUAL_OWNER_REVIEW

- **When allowed:** Owner must manually review visual/product state. This is not an agent-declared completion label.
- **When NOT allowed:** When the agent is trying to claim `VISUAL_DONE` without evidence.
- **Evidence required:** Owner review target, reason, and expected review scope. Screenshots are allowed but not required from the agent.

### VISUAL_DONE

- **When allowed:** ONLY with screenshots or explicit manual visual evidence.
- **When NOT allowed:** Without visual evidence. Never self-declare without proof.
- **Evidence required:** Screenshots, screen recordings, or owner manual review sign-off. Agents must not require screenshots when status is `MANUAL_OWNER_REVIEW` / `MANUAL_REVIEW_REQUIRED`, and must not self-write `VISUAL_DONE`.

### BACKEND_PARTIAL

- **When allowed:** Some backend runtime exists (e.g. service + repository) but not all pieces are in place.
- **When NOT allowed:** All backend pieces are complete, or none exist.
- **Evidence required:** List of implemented vs. missing backend components.

### IMPLEMENTED

- **When allowed:** Full runtime exists: service/repository or adapter/policy/mapper, router only when HTTP transport is exposed, tests, README, runtime evidence, gates green.
- **When NOT allowed:** Any required piece is missing.
- **Evidence required:** Gate logs, test results, domain README updated.

### BLOCKED

- **When allowed:** Cannot continue without external decision, missing contract, or unresolved conflict.
- **When NOT allowed:** Work can proceed.
- **Evidence required:** Blocker reason, who needs to decide, what is needed.

### IN_PROGRESS

- **When allowed:** Work is actively happening. Not blocked, not done.
- **When NOT allowed:** Work is complete or blocked.
- **Evidence required:** List of completed items and remaining items.

---

## Restricted Labels (require strong evidence)

| Label | Allowed only when |
|---|---|
| `VISUAL_DONE` | Screenshots or manual visual evidence exist |
| `BACKEND_DONE` | Real runtime + tests + integration evidence exist |
| `FULL_DONE` | Visual + runtime + tests + architecture + evidence + staging proven |
| `CLEAN` | All relevant gates pass |
| `READY_FOR_PROD` | Staging, security, rollback, monitoring and evidence complete |

## Forbidden Without Evidence

The following words/phrases MUST NOT appear in reports, commits, or status docs without matching evidence:

- `DONE`
- `final`
- `complete`
- `clean`
- `production-ready`
- `visual done`
- `backend done`
- `full done`
- `all green`
- `fully migrated`
- `current scope clean`
