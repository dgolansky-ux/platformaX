# Slice 24 — Governance File Placement Audit

> Verifies that every top-tier governance / architecture / AI / scripts /
> CI file lives at the canonical path expected by the registries and
> guards.

## 1. Result

**ALL_PRESENT_AND_AT_CANONICAL_PATH** with three caveats listed in §3.

## 2. Inventory

### Governance (`docs/governance/`)

| File | Present | Canonical path? | Notes |
|---|---|---|---|
| `README.md` | YES | YES | governance entrypoint. |
| `GOVERNANCE_INDEX.md` | YES | YES | maps rules by category. |
| `RULES_REGISTRY.yml` | YES | YES | 74 rules. |
| `GUARDS_REGISTRY.yml` | YES | YES | 62 guards (Slice 24: +12). |
| `RULES_TO_GUARDS_MATRIX.md` | YES | YES | 74 rows, summary verified by `check-rules-to-guards-coverage.mjs`. |
| `STATUS_TAXONOMY.md` | YES | YES | Slice 24: added deep-only acceptance §. |
| `DOMAIN_STATUS_REGISTRY.yml` | YES | YES | feeds `check-domain-status-registry.mjs`. |
| `AI_AGENT_PERMISSIONS_POLICY.md` | YES | YES | unchanged in Slice 24. |
| `AGENT_COMMAND_STANDARD.md` | YES | YES | Slice 24: added §§5 rewrite + 11–16. |
| `REQUIRED_DOCS_BY_SCOPE.yml` | YES | YES | unchanged in Slice 24. |
| `EXCEPTIONS_REGISTER.md` | YES | YES | Slice 24: added EXC-016, EXC-017. |
| `HIDDEN_RULES_INVENTORY.md` | YES | YES | regenerated last in step-37; still accurate. |
| `BACKEND_ARCHITECTURE_INVARIANTS.md` | YES | YES | unchanged in Slice 24. |
| `followups/FIX_ESLINT_PLUGIN_BOUNDARIES_V6_ENFORCEMENT.md` | YES | YES | still OPEN, now also referenced by EXC-017. |

### Architecture (`docs/architecture/`)

| File | Present | Canonical path? | Notes |
|---|---|---|---|
| `BRAMKA.md` | YES | YES | acceptance gates. |
| `PlatformaX-V2-active-rules.md` | YES | YES | constitution. |
| `PlatformaX-V2-coding-standards.md` | YES | YES | Slice 24: added §§2a, 24–31. |
| `PlatformaX-V2-architecture-enforcement.md` | YES | YES |  |
| `PlatformaX-V2-domain-status.md` | YES | YES |  |
| `PlatformaX-V2-legacy-containment.md` | YES | YES |  |
| `PlatformaX-V2-execution-map.md` | YES | YES |  |
| `DOMAIN_BOUNDARY_RULES.md` | YES | YES |  |
| `DOMAIN_OWNERSHIP_MATRIX.md` | YES | YES |  |
| `DOMAIN_REGISTRY.md` | YES | YES |  |
| `DOMAIN_SCOPES.md` | YES | YES |  |
| `adr/ADR-000..016` + `README.md` | YES | YES | ADR-016 is the latest accepted ADR (Manage orchestrator + port pattern). |

### AI agent (`docs/ai/`)

All AI agent docs present (`AGENT_OPERATING_STANDARD.md`,
`AGENT_SELF_AUDIT_PROTOCOL.md`, `AI_ALLOWED_ACTIONS.md`,
`AI_FORBIDDEN_ACTIONS.md`, `RAILWAY_DEPLOY_POLICY.md`,
`REFERENCE_PACK_POLICY.md`, `SUPABASE_ACCESS_POLICY.md`).

### Scripts (`scripts/check-*.mjs`)

| Guard added in Slice 24 | Path | Wired into |
|---|---|---|
| GUARD-051 | `scripts/check-no-agent-bypass-language.mjs` | rules:check, GUARDS_REGISTRY |
| GUARD-052 | `scripts/check-application-use-cases-boundary.mjs` | rules:check, arch:check:v2 |
| GUARD-053 | `scripts/check-policy-pure-functions.mjs` | rules:check, arch:check:v2 |
| GUARD-054 | `scripts/check-event-envelope-contract.mjs` | rules:check, arch:check:v2 |
| GUARD-055 | `scripts/check-viewer-context-on-public-reads.mjs` | rules:check |
| GUARD-056 | `scripts/check-visibility-matrix.mjs` | rules:check, arch:check:v2 |
| GUARD-057 | `scripts/check-public-dto-contract-tests.mjs` | rules:check |
| GUARD-058 | `scripts/check-idempotency-flows.mjs` | rules:check |
| GUARD-059 | `scripts/check-transactional-outbox-pattern.mjs` | rules:check, arch:check:v2 |
| GUARD-060 | `scripts/check-read-model-owner.mjs` | rules:check, arch:check:v2 |
| GUARD-061 | `scripts/check-backend-ownership-invariants.mjs` | rules:check, arch:check:v2 |
| GUARD-062 | `scripts/check-media-attach-owner-purpose.mjs` | rules:check, arch:check:v2 |

`scripts/audit/create-slice-24-deep-only-governance-hardening-zip.mjs`
is the Slice 24 ZIP generator.

### CI workflows

- `.github/workflows/v2-gates.yml` — STANDARD + DEEP + required-check
  alias. Slice 24 does not change the workflow file; the new guards
  are picked up via `pnpm guards:all-local` / `pnpm rules:check`
  which the workflow already invokes.
- `.github/workflows/v2-weekly-audit.yml` — weekly knip + depcruise +
  audit ZIP.
- `.github/workflows/codeql.yml` — present, `CODEQL_NEEDS_GITHUB_SETUP`.

### Package scripts

`pnpm verify:deep` added (canonical acceptance command).
`pnpm verify:fast` / `pnpm verify:normal` added as HELPER_ONLY
labeled scripts that print a banner clarifying they cannot grant
acceptance.

## 3. Caveats / "present but" notes

1. `HIDDEN_RULES_INVENTORY.md` was generated during step-37 and has
   not been re-scanned for Slice 24 changes. Slice 24 added 12
   guards but **did not add any new global normative phrase** to a
   non-governance file — `check-governance-drift.mjs` PASSES — so
   the inventory is still accurate.
2. `docs/governance/followups/FIX_ESLINT_PLUGIN_BOUNDARIES_V6_ENFORCEMENT.md`
   stays `OPEN` and is now also referenced by EXC-017. A future
   slice should either close it (after the v6 fix) or merge it into
   EXC-017.
3. `DOMAIN_STATUS_REGISTRY.yml` was not modified by Slice 24 — no
   domain status changed. The check guard PASSES.

## 4. No missing / stale / duplicated / mislocated files

- Missing: NONE.
- Stale (last updated > 1 slice ago and no longer accurate): NONE.
- Duplicated: NONE.
- Wrong location: NONE.

Status: **FILE_PLACEMENT_AUDIT_PASS**.
