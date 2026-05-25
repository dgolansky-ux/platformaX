# Step 17 — Review Index Matrix

## Report statuses

| Report folder | Status | Evidence | Superseded by |
|---|---|---|---|
| step-02-clean-repo-skeleton | HISTORICAL_REPORT | — | step-13 |
| step-03-guard-scripts | HISTORICAL_REPORT | — | step-11 |
| step-04-local-git-gates | HISTORICAL_REPORT | — | step-11 |
| step-05-github-ci | SUPERSEDED | — | step-12-ci-fix |
| step-06-branch-protection | SUPERSEDED | — | step-12-github-ci-verification |
| step-07-local-bramka-hardening | HISTORICAL_REPORT | — | step-11 |
| step-08-local-bramka-evidence | HISTORICAL_REPORT | — | step-11 |
| step-09-local-bramka-red-team | HISTORICAL_REPORT | — | step-10 |
| step-10-red-team-fixes | HISTORICAL_REPORT | — | step-11 |
| step-11-final-local-bramka-audit | HISTORICAL_REPORT | — | step-14 |
| step-12-ci-fix | ACTIVE_EVIDENCE | STEP_12_CI_FIX_REPORT.md | — |
| step-12-github-ci-verification | ACTIVE_EVIDENCE | STEP_12_REPORT.md | — |
| step-13-full-domain-baseline | ACTIVE_EVIDENCE | STEP_13_REPORT.md | — |
| step-14-domain-boundary-red-team | ACTIVE_EVIDENCE | STEP_14_REPORT.md | — |
| step-16-secret-scanner | ACTIVE_EVIDENCE | STEP_16_REPORT.md | — |
| step-17-documentation-freshness | ACTIVE_EVIDENCE | STEP_17_REPORT.md | — |

## Guard checks

| Check | Result |
|---|---|
| Index file exists | PASS |
| All step-* folders indexed | PASS |
| All statuses from allowlist | PASS |
| ACTIVE_EVIDENCE has evidence | PASS |
| SUPERSEDED has reference | PASS |
| No banned statuses (DONE, FULL_DONE, etc.) | PASS |
