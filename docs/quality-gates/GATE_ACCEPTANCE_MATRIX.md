# PlatformaX V2 — Gate Acceptance Matrix

Status: `HISTORICAL_REPORT_ONLY` — superseded
Owner: Governance / BRAMKA Acceptance
Superseded: 2026-05-28

## 1. Why this doc is historical

This file was the Step-01 acceptance checklist used to bootstrap BRAMKA. Every
row was marked `TODO` because the guards, hooks, CI workflow and rule registry
did not yet exist. They do now — the canonical truth has moved to the
artifacts listed in §2.

Leaving the original `TODO` matrix as `ACTIVE` was actively misleading: it
implied the gates were unimplemented while the rest of governance (this
repo's CI, `pnpm rules:check`, `pnpm guards:all-local`, the bramka acceptance
script) was already failing closed.

This file is retained only as historical context. Do NOT use it as a current
gate map.

## 2. Where gate truth lives now

| What you need | Look here |
|---|---|
| Authoritative list of guards | `docs/governance/GUARDS_REGISTRY.yml` |
| Which rule each guard enforces | `docs/governance/RULES_TO_GUARDS_MATRIX.md` |
| Guard implementation | `scripts/check-*.mjs` (each guard fails closed) |
| CI execution | `.github/workflows/v2-gates.yml` (umbrella `pnpm guards:all-local`) |
| Local pre-commit / pre-push hooks | `.husky/pre-commit`, `.husky/pre-push` |
| BRAMKA acceptance runner | `scripts/check-bramka-acceptance.mjs` (50/50 wired into `pnpm guards:bramka`) |
| Integration model (how the layers stay in sync) | `docs/architecture/PlatformaX-V2-coding-standards.md` §23 |
| Status taxonomy | `docs/governance/STATUS_TAXONOMY.md` |
| Domain status (PARTIAL / SCAFFOLD_ONLY / …) | `docs/governance/DOMAIN_STATUS_REGISTRY.yml` + `server/domains-v2/domain-registry.ts` |

## 3. Why the rows were removed

Each row in the old TODO matrix has at least one of these replacements:

- A guard script under `scripts/check-*.mjs` (rows G-013 .. G-031, G-036, G-047, G-049–050) — listed in `GUARDS_REGISTRY.yml`.
- A repo policy artifact already shipped (CODEOWNERS, PR template, ADR folder, REVIEW_REPORTS_INDEX, dependency policy, observability policy, accessibility baseline — see §2 pointers).
- An item that cannot be proven from inside the repo (branch protection / GitHub rulesets — see §4).

Keeping per-row `TODO` here while the actual implementation has shipped
violates **PX-GOV-001** (no fake DONE / no fake TODO) by inverse: the doc
asserts work is unfinished while it is, in fact, finished and enforced
elsewhere.

## 4. The one row that cannot be proven from inside the repo

`G-038 — branch protection / rulesets configured` is **NEEDS_EXTERNAL_VERIFICATION**.
Branch protection lives in GitHub repository settings, not in the working
tree. Until an exported GitHub ruleset is committed, neither this doc nor
`check-bramka-acceptance.mjs` can claim a PASS — the presence of a
`pull_request` workflow trigger does not prove that the `main` branch
actually requires it.

## 5. Final decision

```txt
GATE_MATRIX_SUPERSEDED — current truth: see §2.
```
