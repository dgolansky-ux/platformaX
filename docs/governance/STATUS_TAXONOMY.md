# PlatformaX V2 — Status Taxonomy

Status: `ACTIVE`
Owner: Governance / Status Truth

## Purpose

Defines all allowed status labels, when each may be used, and what evidence is required.

---

## Status Labels

### SCAFFOLD_ONLY

- **When allowed:** Folder/stubs/README exist. No usable runtime.
- **When NOT allowed:** Any runtime, router, or service exists.
- **Evidence required:** README in domain folder. No runtime claims.

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
- **Evidence required:** public-api/contracts/tests exist. Missing parts listed.

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
- **Evidence required:** Review target and reason documented.

### VISUAL_DONE

- **When allowed:** ONLY with screenshots or explicit manual visual evidence.
- **When NOT allowed:** Without visual evidence. Never self-declare without proof.
- **Evidence required:** Screenshots, screen recordings, or manual review sign-off.

### BACKEND_PARTIAL

- **When allowed:** Some backend runtime exists (e.g. service + repository) but not all pieces are in place.
- **When NOT allowed:** All backend pieces are complete, or none exist.
- **Evidence required:** List of implemented vs. missing backend components.

### IMPLEMENTED

- **When allowed:** Full runtime exists: router/service/repository/policy/mapper, tests, README, gates green.
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

## Deep-only acceptance — Slice 24 onward

Only the result of `pnpm verify:deep` is acceptable as a CLAIMED green
status for a real slice. The following are explicitly NOT acceptance:

| Helper | Why it is not acceptance |
|---|---|
| `pnpm verify:fast` | HELPER_ONLY — runs only `check + lint`. Insufficient to claim READY / DONE / IMPLEMENTED. |
| `pnpm verify:normal` | HELPER_ONLY — adds `test` but skips the guards umbrella, depcruise, gitleaks, knip, tooling:redcase. |
| `pnpm tooling:check` | HELPER_ONLY — runs the tooling subset only. |
| Individual guard scripts | HELPER_ONLY — they prove their own surface; they do NOT prove cross-surface coherence. |

`pnpm verify:deep` runs (in order):

1. `pnpm check`
2. `pnpm lint`
3. `pnpm test`
4. `pnpm build`
5. `pnpm rules:check`
6. `pnpm arch:check:v2`
7. `pnpm guards:all-local`
8. `pnpm depcruise:check`
9. `pnpm arch-tests`
10. `pnpm knip:check`
11. `pnpm secrets:gitleaks`
12. `pnpm tooling:redcase`

Any step that exits non-zero blocks acceptance. A step that cannot run
in the current environment (e.g. `secrets:gitleaks` when the binary is
not installed) must be reported as `NOT_RUN / ENV_BLOCKED` in the step
report — it does NOT pass.

`READY` / `DONE` / `IMPLEMENTED` / `BACKEND_DONE` / `VISUAL_DONE` are
all forbidden without an attached `pnpm verify:deep` log (or
`ENV_BLOCKED` entries truthfully documented).

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
