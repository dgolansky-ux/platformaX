# PlatformaX V2 — Agent Command Standard

Status: `ACTIVE`
Owner: Governance

## Purpose

Every agent task must follow this standard structure.

---

## 1. Start Block

Every task must begin with:

```
TASK: <task name>
BRANCH: <branch name>
BASELINE:
  - pwd: <working directory>
  - git status: <clean/dirty>
  - git branch: <current branch>
  - git HEAD: <short hash>
SCOPE: <what this task covers>
FORBIDDEN:
  - <list of forbidden actions for this task>
EXPECTED FILES: <files expected to be created/modified>
DOCS READ:
  - <list of governance/architecture docs read>
```

## 2. Scope

- Clearly state what is in scope
- Clearly state what is NOT in scope
- If scope is unclear, mark as BLOCKED and ask

## 3. Forbidden Actions

Every task must list its forbidden actions. Minimum:

- No --no-verify
- No direct push to main
- No force push
- No fake DONE
- No guard weakening

Task-specific forbidden actions should be added.

## 4. Expected Files

List files expected to be created, modified, or deleted.

## 5. Gates

Before commit, run:

```
pnpm check
pnpm lint
pnpm test
pnpm build
pnpm rules:check
pnpm arch:check:v2
```

Record exit codes in report.

## 6. Self-Audit

Before reporting results, complete the 12-field self-audit:

1. What I changed
2. What I might have broken
3. Domain boundaries affected
4. Cross-domain imports check
5. Legacy/runtime check
6. Fake DONE/status truth check
7. PII/base64/secrets check
8. Routes/nav/build graph check
9. Guard weakening check
10. Evidence reviewed
11. Gates run
12. Remaining risks

## 7. Evidence

Provide real evidence:

- Command output with exit codes
- Changed file list
- Gate logs
- Status changes
- Blockers

Do not write PASS without a real log.

Visual evidence policy:

- `VISUAL_DONE` still requires visual evidence.
- Owner manual review can be visual evidence.
- Lack of screenshots does not block a task whose visual status is
  `MANUAL_OWNER_REVIEW` / `MANUAL_REVIEW_REQUIRED`.
- Agents must not require screenshots from the owner and must not self-write
  `VISUAL_DONE`.

## 8. Final Status

End with one of:

```
STATUS: COMMIT_ALLOWED
STATUS: IN_PROGRESS
STATUS: BLOCKED
STATUS: REPAIR_DONE
```

If BLOCKED, provide:
- Reason
- What is needed
- Who needs to decide

---

## 9. Mandatory backend architecture invariants (copy into every larger backend command)

Every backend/domain/migration task touching `server/domains-v2` or `server/application-v2` must include this block in the task prompt:

```
MANDATORY BACKEND ARCHITECTURE INVARIANTS (docs/governance/BACKEND_ARCHITECTURE_INVARIANTS.md)

- Owner/viewer/resource: id ≠ ownership; ownerUserId/ownerId; viewerContext on public reads; slug/publicId for public URLs.
- Visibility matrix: owner/friend/stranger/anonymous (admin later) — policy.ts, not ad-hoc router checks.
- Public DTO zero PII: no email/phone/DOB/token/session/provider/rawUser/storagePath/service role.
- Resource context refs: contextType, contextOwnerId, contextRefId, visibility, ownerUserId.
- Media attach: validate asset owner, purpose, status; no foreign attach; no storage path in public DTO.
- Lists/feeds/search: limit + maxLimit + cursor or fixed cap + stable order; no unbounded select.
- No raw DB outside domain: DB → mapper → DTO → public-api only; no cross-domain repository/mapper imports.
- Fanout: events + transactional outbox — no sync multi-user fanout in request path (EventEnvelope).
- Status lifecycle: explicit enum; soft delete via deletedAt where applicable.
- Idempotency: idempotencyKey on create/publish/upload/finalize or documented exemption.
- Architecture Impact Statement: domains, entities, owners, public-api, cross-domain, tests/guards evidence.

FORBIDDEN: db push, Railway, --no-verify, fake DONE, guard weakening, runtime/UI changes outside scope.
```

---

## 10. Mandatory architecture invariants (runtime + backend — full reconciliation block)

For cross-cutting or runtime reconciliation tasks, use this expanded block (includes application layer and UI boundaries):

```
MANDATORY ARCHITECTURE INVARIANTS

Backend (BACKEND_ARCHITECTURE_INVARIANTS.md):
- owner/viewer/resource model, viewerContext, visibility matrix
- public/private DTO, public DTO zero PII, resource context refs
- media ownership validation, limit/cursor/stable order
- no raw DB outside domain, EventEnvelope + transactional outbox, no sync fanout
- status lifecycle, idempotency, Architecture Impact Statement

Runtime (PlatformaX-V2-active-rules.md § Runtime governance invariants):
- server/application-v2/use-cases for 2+ domain flows
- single read-model owner per projection
- public DTO/public-api contract tests
- branded IDs + Result/DomainError at boundaries; Zod at transport only
- opaque cursor (no offset on large lists); pure policy functions
- design tokens + presentational/container split; one API data layer
- correlation ID end-to-end; forward-only migrations; deterministic PII-safe seeds

FORBIDDEN: localStorage/sessionStorage fake backend, base64/dataUrl upload,
db push/Railway without separate decision, --no-verify, fake DONE.
```

Rule IDs: see `docs/governance/RULES_REGISTRY.yml` and `docs/governance/RULES_TO_GUARDS_MATRIX.md`.

---

## 11. MANDATORY SUCCESSFUL TASK FINALIZATION (PX-GOV-FINALIZE-001)

Every task that succeeds must be **finalized** — the agent does not finish with
local-only edits. After green gates the agent's responsibility extends to commit,
push, and PR.

### Rules

- Every successful task must end with a commit on the working branch.
- Every commit must be pushed (`git push -u origin <current-branch>`).
- Every push must open a PR (or update an existing PR for the same branch).
- It is forbidden to end a successful task with uncommitted local edits.
- It is forbidden to commit when gates fail. Fix or report `BLOCKED`.
- It is forbidden to push to `main` directly. Always work on a branch.
- It is forbidden to use `--no-verify`, `git push --force`, or any other
  bypass listed in `AI_AGENT_PERMISSIONS_POLICY.md`.
- It is forbidden to commit unrelated files, secrets, ZIP/log/build artefacts,
  `node_modules`, `dist`, or `coverage`.
- It is forbidden to merge the PR in the same task unless a separate
  controlled auto-merge policy is in place and its eligibility check passes.

### Exemptions

The finalization requirement does not apply when:

- The task is `READ_ONLY_EXPORT_ONLY` or `AUDIT_ONLY` with no repo changes.
- The task ended `BLOCKED` (uncommitted state preserved on purpose).
- Gates failed and the failure is outside the task scope (BLOCKED with reason).
- The working tree contains unrelated changes that did not originate from this
  task (BLOCKED — owner decision required).

### Audit ZIP exports

When producing an audit ZIP (operator workflow or `scripts/create-evidence-zip.mjs`):

- Use forward slash `/` for ZIP entry paths — never Windows `\\`. Cross-platform
  ZIP readers treat `\\` as a literal filename character, not a separator.
- Validate the produced ZIP with `node scripts/validate-audit-zip.mjs <zip-path>`:
  it must fail on backslash paths, `.claude/settings.local.json`, `.git`,
  `node_modules`, `dist/build/coverage`, and real `.env*`.
- Include `.env*.example` so the example secret shape is reviewable.
- Exclude real `.env*` files (DATABASE_URL, service_role, JWT secrets, etc.).
- Exclude `node_modules/`, `dist/`, `build/`, `coverage/`, `.git/`, prior
  `*.zip` / `*.sha256` artefacts.
- `.claude/settings.local.json` is gitignored and excluded from the evidence
  ZIP by `scripts/create-evidence-zip.mjs`. The tracked example
  (`.claude/settings.example.json`) is the audit reference.
- The ZIP itself must never carry secrets, logs, build artefacts, or
  `node_modules`.

### Mandatory final-response block

Every agent response that closes a task must include this block:

```
FINALIZATION:
- Status: <SUCCESS|BLOCKED|READ_ONLY|EXPORT_ONLY>
- Gates: <list of gate names + result>
- Commit SHA: <short SHA or N/A>
- Branch: <branch name>
- Push: <success|fail|N/A>
- PR: <PR URL or N/A>
- Working tree clean: <yes|no>
- Not performed:
  - no direct push to main
  - no force push
  - no --no-verify
  - no secrets committed
  - no ZIP/log/build artefacts committed
```

For exempt tasks (`READ_ONLY_EXPORT_ONLY`, `AUDIT_ONLY`) the `Commit SHA`,
`Push` and `PR` fields are `N/A` with a `Reason:` line explaining why.

For `BLOCKED` tasks the same three fields are `N/A` with a concrete blocker
reason (what is missing, who must decide).
