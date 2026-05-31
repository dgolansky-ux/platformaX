# Slice 24 — Prechange Inventory

> Read-only baseline snapshot taken at the start of Slice 24
> (DEEP_ONLY governance, guard automation, coding-standards and runtime
> invariants hardening). No code, rules, guards, or registries changed by
> writing this file. Source of every count below is `git ls-files` or
> `grep`-style scans against the files listed in §0.

## 0. Git state at slice start

- Working directory: `C:/Users/dgola/Desktop/PlatformaX-V2-clean`
- Branch: `feat/contacts-v2-clean-room-slice`
- HEAD: `0c22937` (full: `0c22937ae8d1051d4804c52dffd4fa423d92313a`)
- Working tree dirty: **YES** (untracked: `docs/review/governance-v2/`)
- Last commit subject: `feat(v2): slice 23 — foundation hardening, ProfilePage in AppShell, Playwright evidence`
- Slice 23 final report exists: `docs/review/foundation-v2/slice-23/**`
- Slice 24 prep audit exists: `docs/review/governance-v2/slice-24-prep/SLICE_24_PREP_GOVERNANCE_AND_RULES_AUDIT.md`

## 1. Governance registry counts (today, pre-Slice-24)

Verified by `grep` against `docs/governance/`:

| Concept | Count |
| --- | --- |
| Rules in `RULES_REGISTRY.yml` (`- id: PX-*`) | 74 |
| Guards in `GUARDS_REGISTRY.yml` (`- id: GUARD-*`) | 50 |
| Matrix rows with `Gap? = NO` (fully guarded) | 47 |
| Matrix rows with `Gap? = YES` (manual-gate only) | 22 |
| Matrix rows with `Gap? = PARTIAL` (partial automation) | 5 (matrix summary; grep on the literal `\| PARTIAL ` returns 6, the extra hit is the summary table itself) |
| Explicit `TODO_GUARD:` markers in matrix `Required Improvement` column | 11 (subset of the 22/5 above) |
| Active exceptions in `EXCEPTIONS_REGISTER.md` (rows under "Active Exceptions") | 15 (EXC-001..015, no EXC-revoked, no boundaries v6 exception yet) |

## 2. Current package scripts (verbatim from `package.json`)

```
dev, build, preview,
check, lint, lint:v2, test,
rules:check, arch:check:v2,
guards:diff, guards:commit, guards:bundle, guards:secrets,
guards:boundaries, guards:complexity, guards:migrations,
guards:scripts, guards:placeholders, guards:domains,
guards:review, guards:self-audit, guards:bramka,
guards:governance, guards:all-local,
boundaries:check, depcruise:check, depcruise:graph, arch-tests,
knip:check, secrets:gitleaks, secrets:gitleaks:required,
tooling:check, tooling:redcase, tooling:redcase:strict, tooling:weekly,
scaffold:domain, scaffold:ui-shell, scaffold:route,
screenshots:v2, auditzip, prepare
```

There is **no** `verify:deep` script today. There is **no** explicit FAST /
NORMAL / DEEP mode marker on the existing scripts — the matrix is implied
only in `.github/workflows/v2-gates.yml` (`standard` / `deep` / `weekly`
jobs) and `tooling:weekly`. CI is the only place "DEEP" exists; locally,
every developer / agent decides their own subset.

## 3. Quality modes found in repo

| Mode | Where it appears | Acceptance gate? |
| --- | --- | --- |
| CI `standard` job | `.github/workflows/v2-gates.yml` | required-check-alias depends on it |
| CI `deep` job | `.github/workflows/v2-gates.yml` | required-check-alias depends on it |
| `tooling:check` | `package.json` | helper |
| `tooling:redcase` (DEV) | `package.json`, CI | required (DEV mode) |
| `tooling:redcase:strict` | `package.json`, CI | informational (allowed to fail today) |
| `tooling:weekly` | `package.json`, `v2-weekly-audit.yml` | weekly audit |
| `guards:all-local` | `package.json` | required (local + CI) |

No script is currently labeled `HELPER_ONLY` / `LOCAL_ONLY` / `NOT_ACCEPTANCE_GATE`.

## 4. P0 governance risks identified in Slice 24 prep audit (still open)

From `SLICE_24_PREP_GOVERNANCE_AND_RULES_AUDIT.md §2`, the unchanged P0_NOW
exploitable gaps that Slice 24 must close:

1. Cross-domain orchestration inside a single domain `service.ts` (PX-APP-001 — manual only).
2. EventEnvelope shape drift (PX-EVENT-001 — manual + partial guard).
3. Outbox bypassed / sync fanout (PX-EVENT-002 — manual only).
4. Idempotency missing on create/publish/upload/finalize (PX-IDEMP-001 / PX-IDEMPOTENCY-001 — manual).
5. `viewerContext` absent on public reads (PX-OWN-002 — manual).
6. No visibility-matrix enforcement (PX-VIS-001 — manual).
7. Pure policy invariant unguarded (PX-POLICY-001 — manual).
8. Public DTO contract tests not enforced (PX-CONTRACT-001 — partial).
9. Single read-model owner not enforced (PX-READMODEL-001 — manual).
10. `ALLOW_STATUS_TERM_IN_POLICY_DOC` marker can be planted anywhere (no `check-no-agent-bypass-language` guard yet).
11. Media attach owner/purpose validation partial (PX-MEDIA-004 — manual + base64 guard only).
12. Resource ownership invariant unguarded (PX-OWN-001 — manual only).

## 5. Hidden permissive behavior found (today)

- `check-fake-done.mjs:53-56` short-circuits any file under `docs/` or
  `scripts/` regardless of whether the file is a registered policy doc.
  Combined with the file-scope marker `ALLOW_STATUS_TERM_IN_POLICY_DOC`,
  an agent can plant fake-DONE language anywhere under `docs/` without
  registering the file as a policy doc.  **Slice 24 will tighten this**
  by shipping `check-no-agent-bypass-language.mjs` (a registry of allowed
  marker paths) AND by limiting `check-fake-done` auto-exemption to a
  narrow allowlist of governance paths (no-op if the new guard catches
  the marker first).
- `eslint-plugin-boundaries` v6 is `PARTIAL_NOT_ENFORCED` (followup
  documented). No formal `EXCEPTIONS_REGISTER` entry today — Slice 24
  must add one or fix the resolver.
- `secrets:gitleaks` (non-required) silently falls back to "no-op pass"
  when the binary is missing; the `:required` variant fails closed. The
  helper variant must be labeled `HELPER_ONLY` in this slice.
- `tooling:redcase` (DEV mode) lets `TOOL_MISSING` rows pass; only
  `tooling:redcase:strict` fails closed. Strict mode is informational
  in CI today (allowed to fail). Slice 24 keeps this behavior but
  documents it explicitly in `STATUS_TAXONOMY` / DEEP-only definition.

## 6. Files likely to be touched by Slice 24

Implementation:

- `package.json` — add `verify:deep`, label helper scripts.
- `scripts/check-no-agent-bypass-language.mjs` (NEW).
- `scripts/check-application-use-cases-boundary.mjs` (NEW).
- `scripts/check-policy-pure-functions.mjs` (NEW).
- `scripts/check-event-envelope-contract.mjs` (NEW).
- `scripts/check-viewer-context-on-public-reads.mjs` (NEW).
- `scripts/check-visibility-matrix.mjs` (NEW).
- `scripts/check-public-dto-contract-tests.mjs` (NEW).
- `scripts/check-idempotency-flows.mjs` (NEW).
- `scripts/check-transactional-outbox-pattern.mjs` (NEW).
- `scripts/check-read-model-owner.mjs` (NEW).
- `scripts/check-backend-ownership-invariants.mjs` (NEW).
- `scripts/check-media-attach-owner-purpose.mjs` (NEW).
- `scripts/rules-check.mjs` — register new guards in umbrella.
- `scripts/arch-check-v2.mjs` — register the architecture-only guards.
- `scripts/audit/create-slice-24-deep-only-governance-hardening-zip.mjs` (NEW).
- `tests/architecture/fixtures/<guard-name>/` — red-case fixtures (NEW).

Registries / docs:

- `docs/governance/RULES_REGISTRY.yml` — `enforced_by` updates for newly guarded rules.
- `docs/governance/GUARDS_REGISTRY.yml` — `GUARD-051..062` entries.
- `docs/governance/RULES_TO_GUARDS_MATRIX.md` — flip `YES`/`PARTIAL` → `NO`
  for ~12 rules. Update summary counts.
- `docs/governance/STATUS_TAXONOMY.md` — add DEEP-only acceptance line.
- `docs/governance/AGENT_COMMAND_STANDARD.md` — §11–§15 deep-only / evidence / ZIP / no-rewrite.
- `docs/governance/EXCEPTIONS_REGISTER.md` — boundaries v6 entry, if fix not shipped.
- `docs/architecture/PlatformaX-V2-coding-standards.md` — §7a / §24 / §25 / §26 / §27 + deep-only block.
- `docs/architecture/BRAMKA.md` — deep-only acceptance.
- `docs/architecture/PlatformaX-V2-active-rules.md` — link deep-only.
- `docs/architecture/PlatformaX-V2-architecture-enforcement.md` — link new guards.

Reports (under `docs/review/governance-v2/slice-24/`):

- `SLICE_24_PRECHANGE_INVENTORY.md` (this file).
- `SLICE_24_RULES_COHERENCE_AUDIT.md`.
- `SLICE_24_BOUNDARIES_V6_DECISION.md`.
- `SLICE_24_GOVERNANCE_FILE_PLACEMENT_AUDIT.md`.
- `SLICE_24_TOOLING_REVIEW_AND_DECISION_REGISTER.md`.
- `SLICE_24_DEEP_ONLY_GOVERNANCE_HARDENING_REPORT.md`.

ZIP outputs:

- `ZIPY/PlatformaX_V2_SLICE_24_DEEP_ONLY_GOVERNANCE_HARDENING_FULL_SOURCE_<sha>.zip`.
- `ZIPY/PlatformaX_V2_SLICE_24_DEEP_ONLY_GOVERNANCE_HARDENING_FULL_SOURCE_<sha>_MANIFEST.json`.
- Copies to `C:/Users/dgola/Desktop/ZIPY/`.

## 7. What this inventory deliberately does NOT do

- It does not rewrite history.
- It does not flip any matrix row.
- It does not weaken any guard.
- It does not add or remove rules.
- It does not change `STATUS_TAXONOMY` or `EXCEPTIONS_REGISTER`.
- It does not start product/feature work.
- It does not run any gate yet — Slice 24's gate run happens after the
  implementation steps, with `verify:deep` as the canonical entrypoint.

---

Status of this file: **AUDIT_BASELINE_ONLY**. No implementation changes
attached. Implementation begins in the next file written under
`docs/review/governance-v2/slice-24/` and the `scripts/check-*.mjs`
additions described in §6.
