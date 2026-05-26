# Guard Wiring Recheck

## Verification

All guards listed in `GUARDS_REGISTRY.yml` as `required: true` are verified to be either:
1. Executed by `rules-check.mjs`, OR
2. Marked with `manual_gate` with documented reason

## rules-check.mjs guard list (42 guards)

All 42 guards in `scripts/rules-check.mjs` pass with exit code 0.

## New guards added

| Guard ID | Script | Required | Runs In |
|---|---|---|---|
| GUARD-048 | check-ai-pr-merge-policy.mjs | true | pre-push, ci |
| GUARD-049 | check-pr-merge-eligibility.mjs | false | manual_gate |

GUARD-049 is `required: false` because it needs a PR number argument and `gh CLI` auth — it runs per-PR before merge, not in CI.

## guards:all-local result

25/25 guards passed.

## Conclusion

No orphaned guards in GUARDS_REGISTRY.yml. All required guards are wired and executing.
