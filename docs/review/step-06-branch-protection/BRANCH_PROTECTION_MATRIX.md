# Step 06 — Branch Protection Matrix

| # | Setting | Required | Actual | Status | Notes |
|---|---|---|---|---|---|
| 1 | `main` protected | YES | UNKNOWN | MANUAL_REQUIRED | Cannot verify without `gh` CLI |
| 2 | Direct push blocked | YES | UNKNOWN | MANUAL_REQUIRED | Enabled by requiring PR |
| 3 | PR required before merge | YES | UNKNOWN | MANUAL_REQUIRED | Settings → Branches |
| 4 | At least 1 approval required | YES | UNKNOWN | MANUAL_REQUIRED | Set "Required approvals" to 1 |
| 5 | Required status checks enabled | YES | UNKNOWN | MANUAL_REQUIRED | Select job `gates` from `v2-gates` workflow |
| 6 | Branch up to date required | YES | UNKNOWN | MANUAL_REQUIRED | "Require branches to be up to date" |
| 7 | CODEOWNERS review required | YES | UNKNOWN | MANUAL_REQUIRED | Requires Team/Pro plan; replace `@REPLACE_WITH_OWNER` first |
| 8 | Force push blocked | YES | UNKNOWN | MANUAL_REQUIRED | "Do not allow force pushes" |
| 9 | Branch deletion blocked | YES | UNKNOWN | MANUAL_REQUIRED | "Do not allow deletions" |
| 10 | Conversation resolution required | YES | UNKNOWN | MANUAL_REQUIRED | "Require conversation resolution" |
| 11 | Bypass disabled | YES | UNKNOWN | MANUAL_REQUIRED | "Do not allow bypassing the above settings" |

## Required status check name

The CI workflow defines a single job:

```yaml
jobs:
  gates:
    name: Check / Lint / Test / Build / Guards
```

The status check name visible in GitHub should be:

- **`gates`** or **`Check / Lint / Test / Build / Guards`**

If neither appears in the dropdown when configuring required checks, the workflow must run at least once first. Check: https://github.com/dgolansky-ux/platformaX/actions
