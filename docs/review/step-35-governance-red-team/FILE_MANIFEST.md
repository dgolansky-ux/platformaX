# Step 35 — File Manifest

## Files Modified

| File | Change type | Description |
|---|---|---|
| `.claude/settings.local.json` | HARDENED | Removed 6 dangerous wildcards, added deny list |
| `scripts/check-ai-agent-permissions.mjs` | HARDENED | Wildcards are violations, not warnings |
| `scripts/check-domain-status-registry.mjs` | HARDENED | Cross-validates domain-registry.ts statuses |
| `scripts/__tests__/ai-agent-permissions.test.ts` | UPDATED | Added wildcard detection tests |
| `docs/governance/DOMAIN_STATUS_REGISTRY.yml` | RESOLVED | All 13 conflicts resolved, evidence updated |
| `docs/architecture/PlatformaX-V2-domain-status.md` | UPDATED | 13 domains PLANNED→SCAFFOLD_ONLY |
| `server/domains-v2/domain-registry.ts` | UPDATED | identity SCAFFOLD_ONLY→PARTIAL |
| `docs/review/REVIEW_REPORTS_INDEX.md` | UPDATED | Added step-35 entry |

## Files Created

| File | Purpose |
|---|---|
| `docs/review/step-35-governance-red-team/STEP_35_REPORT.md` | Main report |
| `docs/review/step-35-governance-red-team/RED_TEAM_FINDINGS.md` | Findings summary |
| `docs/review/step-35-governance-red-team/STATUS_CONFLICT_RESOLUTION.md` | Conflict resolution table |
| `docs/review/step-35-governance-red-team/AI_AGENT_PERMISSIONS_REVIEW.md` | Permissions hardening |
| `docs/review/step-35-governance-red-team/GUARD_COVERAGE_RECHECK.md` | P0 coverage verification |
| `docs/review/step-35-governance-red-team/COMMAND_LOGS.md` | Gate command logs |
| `docs/review/step-35-governance-red-team/BLOCKED_ITEMS.md` | Blocked items (none) |
| `docs/review/step-35-governance-red-team/SELF_AUDIT.md` | Self-audit checklist |
| `docs/review/step-35-governance-red-team/FILE_MANIFEST.md` | This file |
