# Step 11 — Final Local BRAMKA Audit Matrix

| # | Requirement | File/Script | Status | Evidence |
|---|---|---|---|---|
| 1 | Governance docs exist | docs/ | EXISTS | 60+ markdown files |
| 2 | rules:check real umbrella gate | scripts/rules-check.mjs | REAL | 14 sub-guards, exit 1 on failure |
| 3 | arch:check:v2 real gate | scripts/arch-check-v2.mjs | REAL | 6 sub-guards |
| 4 | check-diff-safety works | scripts/check-diff-safety.mjs | WORKS | RT12: caught onClick/alert/confirm |
| 5 | no-commit-if-dirty-gates works | scripts/no-commit-if-dirty-gates.mjs | WORKS | 10 sub-checks, COMMIT_ALLOWED |
| 6 | fake DONE checker works | scripts/check-fake-done.mjs | WORKS | RT1: caught BRAMKA_COMPLETE + FULL_DONE |
| 7 | domain-status checker works | scripts/check-domain-status.mjs | WORKS | validates domain-status.md |
| 8 | removed product areas works | scripts/check-removed-product-areas.mjs | WORKS | RT3: caught seller/tasks/fundraiser |
| 9 | no-legacy-imports works (incl. relative) | scripts/check-no-legacy-imports.mjs | WORKS | RT2: caught relative ../features/ |
| 10 | domain boundary audit works (incl. relative) | scripts/audit-domain-boundaries.mjs | WORKS | RT4: caught ../social/repository |
| 11 | test env safety works | scripts/check-test-env-safety.mjs | WORKS | RT8: caught dotenv.config .env |
| 12 | env/secret safety works (no example bypass) | scripts/check-env-safety.mjs | WORKS | RT7: caught postgresql://example |
| 13 | public DTO PII checker works | scripts/check-public-dto-pii.mjs | WORKS | RT5: caught email/phone/dateOfBirth |
| 14 | media base64 checker works | scripts/check-media-base64.mjs | WORKS | RT6: caught readAsDataURL/dataUrl/base64 |
| 15 | pagination checker works (incl. db.select) | scripts/check-pagination.mjs | WORKS | RT9: caught db.select().from() |
| 16 | file complexity checker works | scripts/check-file-complexity.mjs | WORKS | RT11: caught 366 > 350 |
| 17 | build artifact checker works | scripts/check-build-artifacts.mjs | WORKS | PASS (no removed chunks) |
| 18 | Supabase migration safety works | scripts/check-supabase-migrations-safety.mjs | WORKS | PASS (no migrations) |
| 19 | bundle validator works | scripts/validate-bundle.mjs | WORKS | RT10: 7/7 patterns, real ZIP validation |
| 20 | Husky pre-commit exists | .husky/pre-commit | EXISTS | 8 gates |
| 21 | Husky pre-push exists | .husky/pre-push | EXISTS | 9 gates |
| 22 | lint-staged works | package.json lint-staged | WORKS | eslint on staged files |
| 23 | commitlint works | commitlint.config.mjs | WORKS | type+scope enum, blocked messages |
| 24 | local secret scanner works | scripts/check-local-secret-scan.mjs | WORKS | regex patterns for keys/tokens |
| 25 | dependency boundary guard works | scripts/audit-domain-boundaries.mjs | WORKS | cross-domain + legacy |
| 26 | CODEOWNERS exists | .github/CODEOWNERS | EXISTS | @dgolansky-ux |
| 27 | PR template exists | .github/pull_request_template.md | EXISTS | Architecture Impact Statement |
| 28 | ADR folder/templates exist | docs/architecture/adr/ | EXISTS | ADR-000 through ADR-008 |
| 29 | Domain Ownership Matrix exists | docs/architecture/ | EXISTS | domain ownership documented |
| 30 | REVIEW_REPORTS_INDEX exists | docs/review/ | EXISTS | step-01 through step-11 |
| 31 | AI forbidden actions exists | docs/ai/ | EXISTS | AI_FORBIDDEN_ACTIONS.md |
| 32 | Reference pack policy exists | docs/ai/ | EXISTS | REFERENCE_PACK_POLICY.md |
| 33 | Railway/Supabase policies exist | docs/ai/ | EXISTS | RAILWAY_DEPLOY_POLICY.md, SUPABASE_ACCESS_POLICY.md |
| 34 | GitHub/manual gates marked PENDING | docs/review/step-11 | PENDING | MANUAL_GITHUB_PENDING.md |
