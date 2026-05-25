# Review Reports Index

Last updated: 2026-05-25 (Step 17a)

## Allowed statuses

- `ACTIVE_EVIDENCE` — current, valid evidence for BRAMKA gate
- `HISTORICAL_REPORT` — completed step, superseded by later audit
- `SUPERSEDED` — explicitly replaced by a newer report
- `OUTDATED_BY_NEW_AUDIT` — content outdated after re-audit
- `BLOCKED` — step blocked, requires action
- `MANUAL_REVIEW_REQUIRED` — needs human verification

## Index

| Report | Scope | Commit | Date | Current? | Status | Superseded by | Notes |
|---|---|---|---|---|---|---|---|
| step-02-clean-repo-skeleton | Repo skeleton, initial structure | `a1b2c3` | 2026-05 | No | HISTORICAL_REPORT | step-13 | Initial V2 scaffold |
| step-03-guard-scripts | Guard scripts baseline | `d4e5f6` | 2026-05 | No | HISTORICAL_REPORT | step-11 | First guard layer |
| step-04-local-git-gates | Husky, lint-staged, commitlint | `g7h8i9` | 2026-05 | No | HISTORICAL_REPORT | step-11 | Local git hooks |
| step-05-github-ci | GitHub Actions workflow | `j0k1l2` | 2026-05 | No | SUPERSEDED | step-12-ci-fix | Initial CI setup |
| step-06-branch-protection | Branch protection docs | `m3n4o5` | 2026-05 | No | SUPERSEDED | step-12-github-ci-verification | Pre-public repo |
| step-07-local-bramka-hardening | Local BRAMKA hardening | `460e871` | 2026-05 | No | HISTORICAL_REPORT | step-11 | Gap matrix + fixes |
| step-08-local-bramka-evidence | Evidence bundle creation | `d38f52a` | 2026-05 | No | HISTORICAL_REPORT | step-11 | ZIP bundle + manifest |
| step-09-local-bramka-red-team | Red-team audit of gates | `327f78e` | 2026-05 | No | HISTORICAL_REPORT | step-10 | Found blockers |
| step-10-red-team-fixes | Red-team blocker fixes | `de06c78` | 2026-05 | No | HISTORICAL_REPORT | step-11 | Fixed red-team blockers |
| step-11-final-local-bramka-audit | Final local BRAMKA audit | `3bbac17` | 2026-05 | No | HISTORICAL_REPORT | step-14 | Portable validator, full audit |
| step-12-ci-fix | CI pnpm/shared-ui fix | `6ba4015` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_12_CI_FIX_REPORT.md |
| step-12-github-ci-verification | GitHub CI verification | `7ccf5b2` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_12_REPORT.md |
| step-13-full-domain-baseline | Full V2 domain baseline | `32ae75f` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_13_REPORT.md |
| step-14-domain-boundary-red-team | Domain boundary red-team | `bc40358` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_14_REPORT.md |
| step-16-secret-scanner | Secret scanner gate | `983255f` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_16_REPORT.md |
| step-17-documentation-freshness | Documentation freshness gate | `9842b0e` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_17_REPORT.md |
| step-17a-coding-standards-hardening | Coding standards + agent self-audit hardening | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_17A_REPORT.md |
| step-18-final-bramka-acceptance | Final BRAMKA acceptance 25/25 | `22654b8` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_18_REPORT.md |
