# Step 12 — GitHub Protection Matrix

| Setting | Status | Evidence | Notes |
|---|---|---|---|
| Repository visibility | PUBLIC | GitHub Settings | Changed from private to public |
| Branch protection rule for main | ENABLED | GitHub Settings > Branches | Manually configured |
| Require PR before merging | ENABLED | Branch protection rule | No direct push allowed |
| Required approvals | 1 | Branch protection rule | Minimum 1 approval |
| Dismiss stale approvals | ENABLED | Branch protection rule | Stale reviews dismissed on new push |
| CODEOWNERS review | ENABLED | Branch protection rule | Code owner must review |
| Required status check | `Check / Lint / Test / Build / Guards` | Branch protection rule | Must pass before merge |
| Branch up to date required | ENABLED | Branch protection rule | Branch must be current with main |
| Conversation resolution required | ENABLED | Branch protection rule | All conversations must be resolved |
| Bypass disabled | ENABLED | Branch protection rule | No bypass for anyone |
| Force pushes disabled | ENABLED | Branch protection rule | Force push forbidden |
| Deletions disabled | ENABLED | Branch protection rule | Branch deletion forbidden |
| Direct push to main | FORBIDDEN_BY_POLICY | Branch protection rule | Enforced by GitHub |
