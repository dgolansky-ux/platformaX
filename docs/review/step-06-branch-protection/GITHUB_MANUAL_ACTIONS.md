# Step 06 — GitHub Manual Actions: Branch Protection Setup

## Prerequisites

1. You must be a repository **admin** for `dgolansky-ux/platformaX`.
2. The CI workflow (`v2-gates.yml`) must have completed at least one run so GitHub knows the check names.
3. Replace `@REPLACE_WITH_OWNER` in `.github/CODEOWNERS` with your actual GitHub username (e.g., `@dgolansky-ux`).

## Option A: Branch Protection Rules (classic)

### Step 1: Navigate to settings

1. Go to https://github.com/dgolansky-ux/platformaX/settings/branches
2. Click **"Add classic branch protection rule"**

### Step 2: Configure the rule

| Field | Value |
|---|---|
| **Branch name pattern** | `main` |

### Step 3: Enable protections

Check the following boxes:

- [x] **Require a pull request before merging**
  - [x] Require approvals: **1**
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners *(if available on your plan)*
- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Search and select: **`gates`** (or **`Check / Lint / Test / Build / Guards`**)
- [x] **Require conversation resolution before merging**
- [x] **Do not allow force pushes**
- [x] **Do not allow deletions**

### Step 4: Bypass settings

- [x] **Do not allow bypassing the above settings** *(if you want maximum strictness)*
  - Or: allow only yourself as admin bypass for emergencies

### Step 5: Save

Click **"Create"** or **"Save changes"**.

---

## Option B: Repository Rulesets (newer GitHub feature)

If your repo uses the newer Rulesets UI:

1. Go to https://github.com/dgolansky-ux/platformaX/settings/rules
2. Click **"New ruleset"** → **"New branch ruleset"**
3. Name: `main-protection`
4. Enforcement: **Active**
5. Target branches: Add target → **Include by pattern** → `main`

### Add rules:

- [x] **Restrict deletions**
- [x] **Require a pull request before merging**
  - Required approvals: **1**
  - Dismiss stale reviews: **Yes**
  - Require review from Code Owners: **Yes** *(if available)*
  - Require conversation resolution: **Yes**
- [x] **Require status checks to pass**
  - Add check: **`gates`**
  - Integration source: **GitHub Actions**
  - Require branches to be up to date: **Yes**
- [x] **Block force pushes**

6. Bypass list: empty (or admin-only for emergencies)
7. Click **"Create"**

---

## Additional security settings

### Secret scanning

1. Go to https://github.com/dgolansky-ux/platformaX/settings/security_analysis
2. Enable **Secret scanning**
3. Enable **Push protection**

### Dependabot (optional)

1. Same page: enable **Dependabot alerts**
2. Enable **Dependabot security updates**

---

## Verification after setup

After configuring, verify by trying to push directly to `main`:

```bash
# This should be REJECTED after branch protection is active
echo "test" > /tmp/test.txt
git add /tmp/test.txt
git commit -m "test: direct push should fail"
git push origin main
# Expected: remote rejected — requires PR
```

Then create a test PR and verify that:
1. The `gates` check appears and runs
2. The PR cannot be merged without the check passing
3. At least 1 approval is required
