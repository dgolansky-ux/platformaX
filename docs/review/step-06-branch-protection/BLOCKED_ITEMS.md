# Step 06 — Blocked Items

| Item | Status | Action needed |
|---|---|---|
| `gh` CLI not installed | BLOCKED | Install GitHub CLI or configure protection manually via browser |
| Branch protection rules | MANUAL_REQUIRED | Follow instructions in `GITHUB_MANUAL_ACTIONS.md` |
| CODEOWNERS `@REPLACE_WITH_OWNER` | MANUAL_REQUIRED | Replace with `@dgolansky-ux` or actual owner username |
| Required status check visibility | PENDING_FIRST_CI_RUN | Check https://github.com/dgolansky-ux/platformaX/actions — the job `gates` must appear at least once |
| Secret scanning | MANUAL_REQUIRED | Enable in repo security settings |

No code-level blockers. All items require manual GitHub UI action.
