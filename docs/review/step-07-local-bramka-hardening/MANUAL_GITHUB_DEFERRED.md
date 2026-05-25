# Step 07 — Manual GitHub Actions (Deferred)

These items require GitHub UI or `gh` CLI and are deferred from local hardening.

| # | Item | Status | Where documented |
|---|---|---|---|
| 1 | Branch protection for `main` | MANUAL_DEFERRED | docs/review/step-06-branch-protection/GITHUB_MANUAL_ACTIONS.md |
| 2 | Required status checks (`gates` job) | MANUAL_DEFERRED | docs/review/step-06-branch-protection/BRANCH_PROTECTION_MATRIX.md |
| 3 | Require PR before merge | MANUAL_DEFERRED | docs/review/step-06-branch-protection/GITHUB_MANUAL_ACTIONS.md |
| 4 | Block direct push to main | MANUAL_DEFERRED | docs/review/step-06-branch-protection/GITHUB_MANUAL_ACTIONS.md |
| 5 | Require CODEOWNERS review | MANUAL_DEFERRED | .github/CODEOWNERS (owner set to @dgolansky-ux) |
| 6 | GitHub secret scanning | MANUAL_DEFERRED | docs/review/step-06-branch-protection/GITHUB_MANUAL_ACTIONS.md |
| 7 | GitHub push protection | MANUAL_DEFERRED | docs/review/step-06-branch-protection/GITHUB_MANUAL_ACTIONS.md |
| 8 | Dependabot alerts | MANUAL_DEFERRED | docs/review/step-05-github-ci/GITHUB_MANUAL_ACTIONS.md |

All of these are documented with step-by-step instructions. Local guards (check-local-secret-scan, check-env-safety, pre-commit/pre-push hooks) serve as secondary defense until GitHub-level protections are enabled.
