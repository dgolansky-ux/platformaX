# Step 05 — GitHub Manual Actions Required

These settings cannot be configured via code and must be set manually in the GitHub repository settings.

## 1. Branch protection for `main`

Go to: **Settings → Branches → Add branch protection rule**

| Setting | Value |
|---|---|
| Branch name pattern | `main` |
| Require a pull request before merging | YES |
| Required number of approvals | 1+ |
| Dismiss stale pull request approvals | YES |
| Require status checks to pass before merging | YES |
| Required status checks | `Check / Lint / Test / Build / Guards` (the CI job name) |
| Require branches to be up to date before merging | YES |
| Require conversation resolution before merging | YES |
| Do not allow bypassing the above settings | YES |

## 2. Block direct push to main

Enabled by requiring a PR before merging (above).

## 3. Require CODEOWNERS review

| Setting | Value |
|---|---|
| Require review from Code Owners | YES |

Note: CODEOWNERS file uses `@REPLACE_WITH_OWNER` placeholder. Replace with actual GitHub username or team before enabling this.

## 4. GitHub secret scanning

Go to: **Settings → Code security and analysis**

| Setting | Value |
|---|---|
| Secret scanning | Enable |
| Push protection | Enable |

## 5. Dependabot (optional)

Go to: **Settings → Code security and analysis**

| Setting | Value |
|---|---|
| Dependabot alerts | Enable |
| Dependabot security updates | Enable |

## Status

```
MANUAL_REQUIRED
```

These settings must be applied manually by the repository owner.
