# Slice 25 — Governance file placement & registry consistency

## 1. Canonical placement audit

| File | Path | Status |
|---|---|---|
| Governance index | `docs/governance/GOVERNANCE_INDEX.md` | PRESENT |
| Governance README | `docs/governance/README.md` | PRESENT |
| Rules registry | `docs/governance/RULES_REGISTRY.yml` | PRESENT |
| Guards registry | `docs/governance/GUARDS_REGISTRY.yml` | PRESENT |
| Rules→Guards matrix | `docs/governance/RULES_TO_GUARDS_MATRIX.md` | PRESENT |
| Status taxonomy | `docs/governance/STATUS_TAXONOMY.md` | PRESENT |
| Domain status registry | `docs/governance/DOMAIN_STATUS_REGISTRY.yml` | PRESENT |
| AI permissions policy | `docs/governance/AI_AGENT_PERMISSIONS_POLICY.md` | PRESENT |
| Agent command standard | `docs/governance/AGENT_COMMAND_STANDARD.md` | PRESENT |
| Required docs by scope | `docs/governance/REQUIRED_DOCS_BY_SCOPE.yml` | PRESENT |
| Exceptions register | `docs/governance/EXCEPTIONS_REGISTER.md` | PRESENT (EXC-016 added in Slice 25) |
| Hidden rules inventory | `docs/governance/HIDDEN_RULES_INVENTORY.md` | PRESENT |
| Backend invariants | `docs/governance/BACKEND_ARCHITECTURE_INVARIANTS.md` | PRESENT |
| BRAMKA | `docs/architecture/BRAMKA.md` | PRESENT |
| Active rules | `docs/architecture/PlatformaX-V2-active-rules.md` | PRESENT |
| Coding standards | `docs/architecture/PlatformaX-V2-coding-standards.md` | PRESENT |
| Architecture enforcement | `docs/architecture/PlatformaX-V2-architecture-enforcement.md` | PRESENT |
| Domain status | `docs/architecture/PlatformaX-V2-domain-status.md` | PRESENT |
| Legacy containment | `docs/architecture/PlatformaX-V2-legacy-containment.md` | PRESENT |
| Execution map | `docs/architecture/PlatformaX-V2-execution-map.md` | PRESENT |
| AI docs | `docs/ai/*` | PRESENT (AI_FORBIDDEN_ACTIONS.md, AGENT_OPERATING_STANDARD.md, AGENT_SELF_AUDIT_PROTOCOL.md, etc.) |
| Check scripts | `scripts/check-*.mjs` | 60 PRESENT (Slice 25: +10) |
| package.json scripts | `package.json` | PRESENT |
| CI workflows | `.github/workflows/*` | PRESENT |
| CODEOWNERS | `.github/CODEOWNERS` | PRESENT |
| Husky hooks | `.husky/*` | PRESENT (`pre-commit`, `pre-push`, `commit-msg`) |

## 2. Registry consistency cross-checks

- **`scripts/rules-check.mjs` list ⇄ `scripts/check-*.mjs` filesystem**:
  every entry in the GUARDS list resolves to a real `.mjs` file. ✅
- **`docs/governance/GUARDS_REGISTRY.yml` ⇄ `scripts/check-*.mjs`**:
  every guard in the registry has a script file under `scripts/`. ✅
- **`docs/governance/RULES_REGISTRY.yml` `enforced_by` ⇄ `GUARDS_REGISTRY.yml` `rules_enforced`**:
  cross-referenced manually for the 10 Slice 25 P1 rules and 6 Slice 24 P1 rules.
  No mismatches. ✅ (Mechanical check: `node scripts/check-guards-registry.mjs` PASS, 72 guards validated.)
- **`docs/governance/RULES_TO_GUARDS_MATRIX.md` row count ⇄ `check-rules-to-guards-coverage.mjs`**:
  guard reports `76 matrix rows verified` matching the registry's 76 rules. ✅
- **`docs/governance/EXCEPTIONS_REGISTER.md` ⇄ `check-inline-exceptions-registered.mjs`**:
  every file with a `PLATFORMAX_EXCEPTION` / `QUALITY_STRUCTURE_EXCEPTION` /
  `ALLOW_FILE_SIZE_EXCEPTION` / `ALLOW_PRIVATE_DTO_PII` marker is registered
  (37 marker files, 16 active register entries). ✅
- **`docs/governance/EXCEPTIONS_REGISTER.md` ⇄ `check-exception-expiry.mjs`**:
  no active exception is expired. ✅

## 3. Missing / stale / wrong-location

- **Missing:** none.
- **Stale:** EXC-016 was missing before Slice 25 (Slice 24 ACK markers referenced it). FIXED.
- **Duplicated:** none.
- **Wrong location:** none.

## 4. Discoveries during the audit

- `docs/governance/followups/FIX_ESLINT_PLUGIN_BOUNDARIES_V6_ENFORCEMENT.md`
  is the canonical location for the boundaries v6 follow-up. The Slice 24
  decision and Slice 25 reconfirmation both link there.
- `scripts/audit/create-slice-24-deep-only-governance-hardening-zip.mjs`
  was lightly edited in Slice 25 §3 to remove the literal
  `PLATFORMAX_EXCEPTION marker` phrase that tripped
  `check-no-agent-bypass-language.mjs`. Behavior is unchanged.

## 5. Recommendations

- KEEP all current paths.
- Do NOT move any governance file. Path stability matters more than
  layout perfection — every agent prompt and CI workflow references
  these paths verbatim.
- WHEN runtime ships, audit `docs/governance/followups/` for entries
  whose triggers fired.

Status of this file: **PLACEMENT_AND_CONSISTENCY_VERIFIED**.
