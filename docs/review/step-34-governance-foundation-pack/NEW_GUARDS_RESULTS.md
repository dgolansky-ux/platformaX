# STEP 34 — New Guards Results

## Guard Execution Results

| Guard | Command | Exit Code | Output |
|---|---|---|---|
| check-governance-registry.mjs | `node scripts/check-governance-registry.mjs` | 0 | CHECK_GOVERNANCE_REGISTRY_PASS (25 rules validated) |
| check-guards-registry.mjs | `node scripts/check-guards-registry.mjs` | 0 | CHECK_GUARDS_REGISTRY_PASS (37 guards validated) |
| check-rules-to-guards-coverage.mjs | `node scripts/check-rules-to-guards-coverage.mjs` | 0 | CHECK_RULES_TO_GUARDS_COVERAGE_PASS (20 P0 active rules checked) |
| check-domain-status-registry.mjs | `node scripts/check-domain-status-registry.mjs` | 0 | CHECK_DOMAIN_STATUS_REGISTRY_PASS (15 domains validated, 15 code domains covered) |
| check-ai-agent-permissions.mjs | `node scripts/check-ai-agent-permissions.mjs` | 0 | CHECK_AI_AGENT_PERMISSIONS_PASS with 6 warning(s) |

## AI Agent Permissions Warnings

```
AI_AGENT_PERMISSIONS_WARNING: wildcard permission encompasses "gh pr merge" in entry: Bash(gh pr *)
AI_AGENT_PERMISSIONS_WARNING: wildcard permission encompasses "git push to main" in entry: Bash(git push *)
AI_AGENT_PERMISSIONS_WARNING: wildcard permission encompasses "git push --force" in entry: Bash(git push *)
AI_AGENT_PERMISSIONS_WARNING: wildcard permission encompasses "git commit --no-verify" in entry: Bash(git commit *)
AI_AGENT_PERMISSIONS_WARNING: wildcard permission encompasses "git reset --hard" in entry: Bash(git reset *)
AI_AGENT_PERMISSIONS_WARNING: wildcard permission encompasses "git merge main" in entry: Bash(git merge *)
```

These warnings are informational. The wildcard patterns in `.claude/settings.local.json` could encompass dangerous commands. They do not cause guard failure but require owner review.

## Test Results

All 5 new test files pass:
- governance-registry.test.ts: 4 tests PASS
- guards-registry.test.ts: 4 tests PASS
- rules-to-guards-coverage.test.ts: 3 tests PASS
- domain-status-registry.test.ts: 4 tests PASS
- ai-agent-permissions.test.ts: 4 tests PASS
