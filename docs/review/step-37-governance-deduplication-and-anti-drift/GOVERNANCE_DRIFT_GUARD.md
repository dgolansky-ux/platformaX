# Step 37 — Governance Drift Guard

## Guard details

| Field | Value |
|---|---|
| ID | GUARD-047 |
| Script | `scripts/check-governance-drift.mjs` |
| Rule enforced | PX-GOV-005 |
| Blocks | commit, merge |
| Runs in | pre-push, ci |
| Required | true |

## What it checks

1. **Authority doc governance links**: Files in `docs/architecture/`, `docs/ai/`, `docs/security/` with normative phrases must contain a reference to `docs/governance/` (GOVERNANCE_INDEX, RULES_REGISTRY, or README).

2. **Domain README global rules**: Domain READMEs in `server/domains-v2/` and `client/src/features-v2/` that contain global normative language (e.g., "all domains must", "never allow") must have a Rule ID (PX-*) or link to RULES_REGISTRY.yml, or be marked `LOCAL_NOTE` or `HISTORICAL_REPORT_ONLY`.

3. **Exemptions**:
   - `docs/governance/*` — the registry itself
   - `docs/review/*` — historical reports
   - `docs/templates/*` — scaffolding templates
   - `scripts/*` — implementation code
   - Files with `HISTORICAL_REPORT_ONLY` marker
   - Files with `TEMPLATE` or `SCAFFOLD` status marker
   - Lines containing status/scope/purpose descriptions

## How it prevents drift

Any new document that introduces global normative language without proper attribution will fail the guard. This forces contributors to either:
- Link to an existing rule in RULES_REGISTRY.yml
- Create a new rule with a proper PX-* ID
- Mark the text as LOCAL_NOTE (domain-specific, not global)
- Mark the text as HISTORICAL_REPORT_ONLY (historical context)

## Test coverage

- `scripts/__tests__/governance-drift.test.ts`
- Happy path: current codebase passes
- Validates guard exits 0 on compliant codebase
