# STEP 34 — File Manifest

## Created Files

| File | Purpose |
|---|---|
| docs/governance/README.md | Central governance README |
| docs/governance/GOVERNANCE_INDEX.md | Rule index by category |
| docs/governance/RULES_REGISTRY.yml | Machine-readable rules registry |
| docs/governance/GUARDS_REGISTRY.yml | Machine-readable guards registry |
| docs/governance/RULES_TO_GUARDS_MATRIX.md | Rules-to-guards coverage matrix |
| docs/governance/STATUS_TAXONOMY.md | Status label taxonomy and evidence requirements |
| docs/governance/DOMAIN_STATUS_REGISTRY.yml | Domain status with conflict detection |
| docs/governance/AI_AGENT_PERMISSIONS_POLICY.md | AI agent permissions policy |
| docs/governance/AGENT_COMMAND_STANDARD.md | Agent task structure standard |
| docs/governance/EXCEPTIONS_REGISTER.md | Exceptions register |
| docs/governance/REQUIRED_DOCS_BY_SCOPE.yml | Required docs per task type |
| scripts/check-governance-registry.mjs | Guard: validates RULES_REGISTRY.yml |
| scripts/check-guards-registry.mjs | Guard: validates GUARDS_REGISTRY.yml |
| scripts/check-rules-to-guards-coverage.mjs | Guard: validates P0 rule coverage |
| scripts/check-domain-status-registry.mjs | Guard: validates DOMAIN_STATUS_REGISTRY.yml |
| scripts/check-ai-agent-permissions.mjs | Guard: validates .claude permissions |
| scripts/__tests__/governance-registry.test.ts | Tests for governance registry guard |
| scripts/__tests__/guards-registry.test.ts | Tests for guards registry guard |
| scripts/__tests__/rules-to-guards-coverage.test.ts | Tests for rules coverage guard |
| scripts/__tests__/domain-status-registry.test.ts | Tests for domain status registry guard |
| scripts/__tests__/ai-agent-permissions.test.ts | Tests for AI agent permissions guard |
| docs/review/step-34-governance-foundation-pack/STEP_34_REPORT.md | Main report |
| docs/review/step-34-governance-foundation-pack/GOVERNANCE_DELTA.md | Changes summary |
| docs/review/step-34-governance-foundation-pack/RULES_INVENTORY_SUMMARY.md | Rule inventory |
| docs/review/step-34-governance-foundation-pack/RULES_TO_GUARDS_GAP_ANALYSIS.md | Gap analysis |
| docs/review/step-34-governance-foundation-pack/NEW_GUARDS_RESULTS.md | New guard results |
| docs/review/step-34-governance-foundation-pack/COMMAND_LOGS.md | Gate command logs |
| docs/review/step-34-governance-foundation-pack/BLOCKED_ITEMS.md | Blocked items |
| docs/review/step-34-governance-foundation-pack/FILE_MANIFEST.md | This file |
| docs/review/step-34-governance-foundation-pack/SELF_AUDIT.md | Self audit |

## Modified Files

| File | Change |
|---|---|
| docs/architecture/PlatformaX-V2-active-rules.md | Added governance index pointer |
| docs/architecture/PlatformaX-V2-coding-standards.md | Added governance index pointer |
| docs/architecture/PlatformaX-V2-architecture-enforcement.md | Added governance index pointer |
| docs/architecture/PlatformaX-V2-domain-status.md | Added governance index pointer |
| docs/architecture/PlatformaX-V2-legacy-containment.md | Added governance index pointer |
| docs/ai/AGENT_OPERATING_STANDARD.md | Added governance index pointer |
| docs/ai/AI_ALLOWED_ACTIONS.md | Added governance index pointer |
| docs/ai/AI_FORBIDDEN_ACTIONS.md | Added governance index pointer |
| .github/CODEOWNERS | Added governance coverage |
| package.json | Added new guard scripts |
| scripts/rules-check.mjs | Added 5 new guards |

## Deleted Files

None.
