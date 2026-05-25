# Step 02 — Clean Repo Skeleton — File Manifest

**Date:** 2026-05-25
**ZIP:** `platformax-v2-step-02-clean-repo-skeleton.zip`

---

## Files included in ZIP

```
.env.example
.env.test.example
.gitignore
client/src/App.test.tsx
client/src/App.tsx
client/src/app-v2/.gitkeep
client/src/features-v2/shared-ui/.gitkeep
client/src/main.tsx
client/src/test-setup.ts
docs/ai/AGENT_OPERATING_STANDARD.md
docs/ai/AI_ALLOWED_ACTIONS.md
docs/ai/AI_FORBIDDEN_ACTIONS.md
docs/ai/RAILWAY_DEPLOY_POLICY.md
docs/ai/REFERENCE_PACK_POLICY.md
docs/ai/SUPABASE_ACCESS_POLICY.md
docs/architecture/adr/ADR-000-template.md
docs/architecture/adr/ADR-001-modular-monolith-v2.md
docs/architecture/adr/ADR-002-legacy-source-material-only.md
docs/architecture/adr/ADR-003-cross-domain-integration-boundaries.md
docs/architecture/adr/ADR-004-status-truth-no-fake-done.md
docs/architecture/adr/ADR-005-railway-supabase-split-ready.md
docs/architecture/adr/ADR-006-media-presigned-no-base64.md
docs/architecture/adr/ADR-007-feed-ownership-no-global-social-feed.md
docs/architecture/adr/ADR-008-public-hub-modules-separation.md
docs/architecture/adr/README.md
docs/architecture/DOMAIN_OWNERSHIP_MATRIX.md
docs/architecture/PlatformaX-V2-active-rules.md
docs/architecture/PlatformaX-V2-architecture-enforcement.md
docs/architecture/PlatformaX-V2-coding-standards.md
docs/architecture/PlatformaX-V2-domain-status.md
docs/architecture/PlatformaX-V2-execution-map.md
docs/architecture/PlatformaX-V2-legacy-containment.md
docs/quality-gates/GATE_ACCEPTANCE_MATRIX.md
docs/release/RELEASE_READINESS_CHECKLIST.md
docs/review/REVIEW_REPORTS_INDEX.md
docs/review/step-02-clean-repo-skeleton/BLOCKED_ITEMS.md
docs/review/step-02-clean-repo-skeleton/COMMAND_LOGS.md
docs/review/step-02-clean-repo-skeleton/FILE_MANIFEST.md
docs/review/step-02-clean-repo-skeleton/STEP_02_REPORT.md
docs/security/SECRET_HANDLING_POLICY.md
docs/templates/ARCHITECTURE_IMPACT_STATEMENT.md
docs/templates/CHANGE_REPORT_TEMPLATE.md
docs/templates/DOMAIN_README_TEMPLATE.md
docs/templates/EVIDENCE_BUNDLE_TEMPLATE.md
docs/templates/PRE_COMMIT_DECISION.md
docs/templates/UI_SHELL_README_TEMPLATE.md
eslint.config.js
index.html
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
README.md
scripts/arch-check-v2-placeholder.mjs
scripts/rules-check-placeholder.mjs
server/domains-v2/communities-v2/.gitkeep
server/domains-v2/content-v2/.gitkeep
server/domains-v2/identity/.gitkeep
server/domains-v2/media/.gitkeep
server/domains-v2/social/.gitkeep
server/domains-v2/system/.gitkeep
server/index.test.ts
server/index.ts
shared/.gitkeep
tsconfig.json
tsconfig.node.json
vite.config.ts
vite-env.d.ts
vitest.config.ts
ZIP_MANIFEST.md
```

---

## Excluded from ZIP

| Excluded | Reason |
|---|---|
| `node_modules/` | Dependencies — install via `pnpm install` |
| `dist/` | Build output — rebuild via `pnpm build` |
| `coverage/` | Test coverage output |
| `.git/` | Git history |
| `.env` | Real environment variables (none exists) |
| `.env.local` | Local overrides (none exists) |
| Nested ZIPs | Not allowed |
