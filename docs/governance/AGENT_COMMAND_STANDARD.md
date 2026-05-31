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

## 5. Gates — deep-only acceptance

PlatformaX V2 has ONE acceptance mode: `pnpm verify:deep`. Before
reporting a slice as READY / IMPLEMENTED / DONE / BACKEND_DONE /
VISUAL_DONE, run:

```
pnpm verify:deep
```

This runs, in order:

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

Record exit codes per step in the report. A step that cannot run
because of the environment (e.g. missing `gitleaks` binary) must be
reported as `NOT_RUN / ENV_BLOCKED` truthfully — do NOT claim PASS.

`verify:fast` and `verify:normal` exist as local developer helpers
ONLY (HELPER_ONLY / NOT_ACCEPTANCE_GATE). They cannot grant READY.

Before commit, run at minimum:

```
pnpm check
pnpm lint
pnpm test
pnpm build
pnpm rules:check
pnpm arch:check:v2
```

— this is the commit-readiness floor. Push/PR readiness requires the
full `pnpm verify:deep` log.

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

## 11. Evidence verification block (Slice 24 onward)

Every step report must include a `GATES_RUN:` block listing:

```
GATES_RUN:
  pnpm check                : exit=<code>
  pnpm lint                 : exit=<code>
  pnpm test                 : exit=<code>
  pnpm build                : exit=<code>
  pnpm rules:check          : exit=<code>
  pnpm arch:check:v2        : exit=<code>
  pnpm guards:all-local     : exit=<code>
  pnpm depcruise:check      : exit=<code>
  pnpm arch-tests           : exit=<code>
  pnpm knip:check           : exit=<code>
  pnpm secrets:gitleaks     : exit=<code> | NOT_RUN | ENV_BLOCKED
  pnpm tooling:redcase      : exit=<code>
```

If any gate is omitted, the report is incomplete and acceptance is
blocked. `NOT_RUN` / `ENV_BLOCKED` must include the reason.

## 12. No-scope-creep block

Every report must include:

```
FILES_CHANGED_BY_SCOPE:
  in_scope:      <list of files matching the slice's declared scope>
  out_of_scope:  <list of files outside the declared scope; must be empty
                 or each entry justified>
```

Any file in `out_of_scope` without a per-entry justification triggers a
manual review.

## 13. ZIP / manifest integrity

Every audit ZIP generated for a slice must:

- carry a JSON manifest with the same prefix as the ZIP and a
  matching `commitShortSha` and `workingTreeDirty` flag,
- embed the manifest inside the ZIP at `MANIFEST.json`,
- declare `validationStatus: PASS` only if the validation step ran and
  passed all checks (no `.git`, no `node_modules`, no `.env`, no
  secrets, no old ZIPs),
- be copied to `C:/Users/dgola/Desktop/ZIPY/` per the persistent owner
  preference.

Report ZIPs and full-source ZIPs are different products. A report ZIP
must NEVER be presented as a full-source ZIP.

## 14. No silent guard delta

Any commit that touches `scripts/check-*.mjs`, `scripts/audit/**`,
`scripts/rules-check.mjs`, `scripts/arch-check-v2.mjs`,
`scripts/audit-domain-boundaries.mjs`, or any `tests/architecture/`
fixture must include in the same commit:

- a red-case fixture (or amended fixture) proving the guard still
  fires on a planted violation,
- an updated `GUARDS_REGISTRY.yml` row if the guard changed `runs_in`
  or `blocks`,
- the corresponding matrix row update if `Gap?` flipped.

Removing a guard is forbidden without a registered `EXCEPTIONS_REGISTER`
entry. Weakening a guard (e.g. narrowing a regex, broadening the
allowlist) requires a documented `Why now safer:` line in the commit
message AND a re-verified red-case fixture.

## 15. No report rewrite

Historical reports under `docs/review/**` are append-only after their
slice closes. Status corrections require a new `*_AMENDED.md` file in
the same folder, or an explicit "Status correction" row in the slice
index — never silent edits to a closed report.

## 16. READY-status gate

An agent must NOT report any of:

- `STATUS: COMMIT_ALLOWED`
- `STATUS: READY`
- `STATUS: IMPLEMENTED`
- `STATUS: BACKEND_DONE`
- `STATUS: VISUAL_DONE`
- `STATUS: TOP_TIER_READY`

unless the attached `GATES_RUN:` block shows every step ran with `exit=0`
or was registered `ENV_BLOCKED` with reason. `tooling:redcase` is
non-negotiable — a missing tooling:redcase line is treated as guard
weakening (PX-GOV-002 violation).
