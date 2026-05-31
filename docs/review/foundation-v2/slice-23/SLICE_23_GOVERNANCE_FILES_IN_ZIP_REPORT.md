# SLICE 23 — Governance / rules / guards files in audit ZIP

> **Date:** 2026-05-30
> **Source of truth:** The generated Slice 23 audit ZIP's manifest
> `governanceCoverage` section is the binding evidence; this report is
> the human-readable view.

## 1. Governance docs present in the bundle (docs/governance/*)

All 12 governance documents are bundled:

| File | Present |
| --- | --- |
| `docs/governance/README.md` | ✅ |
| `docs/governance/GOVERNANCE_INDEX.md` | ✅ |
| `docs/governance/RULES_REGISTRY.yml` | ✅ |
| `docs/governance/GUARDS_REGISTRY.yml` | ✅ |
| `docs/governance/RULES_TO_GUARDS_MATRIX.md` | ✅ |
| `docs/governance/STATUS_TAXONOMY.md` | ✅ |
| `docs/governance/DOMAIN_STATUS_REGISTRY.yml` | ✅ |
| `docs/governance/AI_AGENT_PERMISSIONS_POLICY.md` | ✅ |
| `docs/governance/AGENT_COMMAND_STANDARD.md` | ✅ |
| `docs/governance/REQUIRED_DOCS_BY_SCOPE.yml` | ✅ |
| `docs/governance/EXCEPTIONS_REGISTER.md` | ✅ |
| `docs/governance/HIDDEN_RULES_INVENTORY.md` | ✅ |
| `docs/governance/BACKEND_ARCHITECTURE_INVARIANTS.md` | ✅ (bonus) |
| `docs/governance/followups/*` | ✅ (bonus) |

## 2. Architecture rule docs (docs/architecture/*)

| File | Present |
| --- | --- |
| `docs/architecture/BRAMKA.md` | ✅ |
| `docs/architecture/PlatformaX-V2-active-rules.md` | ✅ |
| `docs/architecture/PlatformaX-V2-coding-standards.md` | ✅ |
| `docs/architecture/PlatformaX-V2-architecture-enforcement.md` | ✅ |
| `docs/architecture/PlatformaX-V2-domain-status.md` | ✅ |
| `docs/architecture/PlatformaX-V2-legacy-containment.md` | ✅ |
| `docs/architecture/PlatformaX-V2-execution-map.md` | ✅ |
| `docs/architecture/DOMAIN_BOUNDARY_RULES.md` | ✅ (bonus) |
| `docs/architecture/DOMAIN_OWNERSHIP_MATRIX.md` | ✅ (bonus) |
| `docs/architecture/DOMAIN_REGISTRY.md` | ✅ (bonus) |
| `docs/architecture/DOMAIN_SCOPES.md` | ✅ (bonus) |
| `docs/architecture/adr/**` | ✅ (16+ ADRs including ADR-016) |

## 3. AI / security policies

| File | Present |
| --- | --- |
| `docs/ai/AGENT_OPERATING_STANDARD.md` | ✅ |
| `docs/ai/AGENT_SELF_AUDIT_PROTOCOL.md` | ✅ |
| `docs/ai/AI_ALLOWED_ACTIONS.md` | ✅ |
| `docs/ai/AI_FORBIDDEN_ACTIONS.md` | ✅ |
| `docs/ai/RAILWAY_DEPLOY_POLICY.md` | ✅ |
| `docs/ai/REFERENCE_PACK_POLICY.md` | ✅ |
| `docs/ai/SUPABASE_ACCESS_POLICY.md` | ✅ |
| `docs/security/SECRET_HANDLING_POLICY.md` | ✅ |

## 4. Profile / blueprint docs

| File | Present |
| --- | --- |
| `docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md` | ✅ |
| `docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST_UPDATED_1TO1_AUDIT.md` | ✅ |
| `docs/profile/PROFILE_RUNTIME_LOGIC_BLUEPRINT_FROM_LEGACY.md` | ✅ |

## 5. Guard / check scripts

All `scripts/check-*.mjs` are bundled (43+ guards). Audit pipeline:

| Script set | Present |
| --- | --- |
| `scripts/check-*.mjs` (43 guards) | ✅ |
| `scripts/audit/create-full-audit-zip.mjs` | ✅ |
| `scripts/audit/create-slice-22-full-source-audit-zip.mjs` | ✅ |
| `scripts/audit/create-slice-23-foundation-hardening-zip.mjs` | ✅ (this slice) |
| `scripts/audit/validate-audit-zip.mjs` | ✅ |
| `scripts/arch-check-v2.mjs` | ✅ |
| `scripts/rules-check.mjs` | ✅ |
| `scripts/run-gitleaks.mjs` | ✅ |
| `scripts/no-commit-if-dirty-gates.mjs` | ✅ |

## 6. CI workflows

| File | Present |
| --- | --- |
| `.github/workflows/codeql.yml` | ✅ |
| `.github/workflows/v2-gates.yml` | ✅ |
| `.github/workflows/v2-weekly-audit.yml` | ✅ |
| `.github/CODEOWNERS` | ✅ |
| `.github/pull_request_template.md` | ✅ |
| `.husky/pre-commit`, `pre-push`, `commit-msg` | ✅ |

## 7. `package.json` script coverage

The audit ZIP manifest's `governanceCoverage.hasPackageScripts` flag
verifies all of the following exist in `package.json`:

| Script | Present |
| --- | --- |
| `check` | ✅ |
| `lint` | ✅ |
| `test` | ✅ |
| `build` | ✅ |
| `rules:check` | ✅ |
| `arch:check:v2` | ✅ |
| `guards:all-local` | ✅ |
| `depcruise:check` | ✅ (bonus) |
| `secrets:gitleaks` | ✅ (bonus) |
| `knip:check` | ✅ (bonus) |
| `screenshots:v2` | ✅ (new in Slice 23) |
| `boundaries:check` | ✅ (bonus) |
| `arch-tests` | ✅ (bonus) |
| `tooling:check` | ✅ (bonus) |
| `tooling:weekly` | ✅ (bonus) |

## 8. Rules → guards coverage

`pnpm rules:check` runs the
`check-rules-to-guards-coverage.mjs` guard which compares
`docs/governance/RULES_REGISTRY.yml` against
`docs/governance/GUARDS_REGISTRY.yml` via
`docs/governance/RULES_TO_GUARDS_MATRIX.md`. Result: **PASS** —
every rule in the registry has at least one binding guard.

## 9. Missing files

**None.** Every required and every recommended governance / architecture /
AI policy / security policy / profile blueprint / guard script / CI
workflow file is present in the working tree and bundled into the ZIP.

## 10. Result

**PASS** — governance coverage is complete. The ZIP qualifies for
`finalStatus: READY_FOR_EXTERNAL_AUDIT` from a governance-files
perspective (subject to the working-tree-dirty rule: if a final ZIP is
generated from a dirty tree the final status will be downgraded to
`READY_WITH_DIRTY_TREE` automatically).

— End of Slice 23 governance files in ZIP report.
