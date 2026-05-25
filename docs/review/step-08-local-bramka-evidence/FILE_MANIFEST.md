# Step 08 — File Manifest (v2)

Total files in ZIP: 153

## Structure

```
.env.example
.env.test.example
.gitignore
.github/CODEOWNERS
.github/pull_request_template.md
.github/workflows/v2-gates.yml
.husky/commit-msg
.husky/pre-commit
.husky/pre-push
README.md
client/src/App.test.tsx
client/src/App.tsx
client/src/app-v2/.gitkeep
client/src/features-v2/shared-ui/.gitkeep
client/src/main.tsx
client/src/test-setup.ts
commitlint.config.mjs
docs/ (governance, architecture, ADRs, quality-gates, review reports, templates, security, ai)
eslint.config.js
index.html
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
scripts/ (25+ .mjs guard/scaffold scripts)
scripts/__tests__/ (4 test files)
server/index.ts
server/index.test.ts
server/domains-v2/ (6 domain scaffolds with .gitkeep)
shared/.gitkeep
tsconfig.json
tsconfig.node.json
vite-env.d.ts
vite.config.ts
vitest.config.ts
```

## Changes from v1 to v2

- Updated `README.md` (was Step 01 description, now PlatformaX V2 Clean Repo status)
- Enhanced `scripts/validate-bundle.mjs` (real ZIP validation, classifyEntry, 16 self-test cases)
- Extended `scripts/__tests__/validate-bundle.test.ts` (12 tests including classifyEntry)
