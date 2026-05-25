# Step 07 — BRAMKA Gap Matrix

| # | Requirement | Source | Local status | GitHub/manual status | Action taken | Evidence | Final status |
|---|---|---|---|---|---|---|---|
| 1 | Governance docs | Step 01 | ALREADY_IMPLEMENTED | N/A | — | docs/ai/, docs/architecture/, docs/security/, docs/quality-gates/, docs/release/, docs/templates/ | IMPLEMENTED_LOCAL |
| 2 | rules:check umbrella | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/rules-check.mjs (14 guards) | IMPLEMENTED_LOCAL |
| 3 | arch:check:v2 | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/arch-check-v2.mjs (6 guards) | IMPLEMENTED_LOCAL |
| 4 | check-diff-safety | Step 03/04 | ALREADY_IMPLEMENTED | N/A | — | scripts/check-diff-safety.mjs | IMPLEMENTED_LOCAL |
| 5 | no-commit-if-dirty-gates | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/no-commit-if-dirty-gates.mjs | IMPLEMENTED_LOCAL |
| 6 | Fake DONE / status truth | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/check-fake-done.mjs | IMPLEMENTED_LOCAL |
| 7 | Domain status checker | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/check-domain-status.mjs | IMPLEMENTED_LOCAL |
| 8 | Removed product areas | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/check-removed-product-areas.mjs | IMPLEMENTED_LOCAL |
| 9 | No legacy imports | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/check-no-legacy-imports.mjs | IMPLEMENTED_LOCAL |
| 10 | Domain boundary audit | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/audit-domain-boundaries.mjs | IMPLEMENTED_LOCAL |
| 11 | Test env safety | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/check-test-env-safety.mjs | IMPLEMENTED_LOCAL |
| 12 | Env/secret safety | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/check-env-safety.mjs | IMPLEMENTED_LOCAL |
| 13 | Public DTO PII | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/check-public-dto-pii.mjs | IMPLEMENTED_LOCAL |
| 14 | Media base64/dataUrl | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/check-media-base64.mjs | IMPLEMENTED_LOCAL |
| 15 | Pagination checker | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/check-pagination.mjs | IMPLEMENTED_LOCAL |
| 16 | File complexity | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/check-file-complexity.mjs | IMPLEMENTED_LOCAL |
| 17 | Build artifact checker | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/check-build-artifacts.mjs | IMPLEMENTED_LOCAL |
| 18 | Supabase migration safety | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/check-supabase-migrations-safety.mjs | IMPLEMENTED_LOCAL |
| 19 | Bundle validator | Step 03 | ALREADY_IMPLEMENTED | N/A | — | scripts/validate-bundle.mjs | IMPLEMENTED_LOCAL |
| 20 | Husky pre-commit | Step 04 | ALREADY_IMPLEMENTED | N/A | — | .husky/pre-commit | IMPLEMENTED_LOCAL |
| 21 | Husky pre-push | Step 04 | ALREADY_IMPLEMENTED | N/A | — | .husky/pre-push | IMPLEMENTED_LOCAL |
| 22 | lint-staged | Step 04 | ALREADY_IMPLEMENTED | N/A | — | package.json lint-staged config | IMPLEMENTED_LOCAL |
| 23 | commitlint | Step 04 | ALREADY_IMPLEMENTED | N/A | — | commitlint.config.mjs | IMPLEMENTED_LOCAL |
| 24 | Secret scanner (local) | Step 07 | IMPLEMENTED_LOCAL | N/A | Created check-local-secret-scan.mjs | scripts/check-local-secret-scan.mjs | IMPLEMENTED_LOCAL |
| 25 | Dependency boundary checker | Step 03+07 | ALREADY_IMPLEMENTED | N/A | audit-domain-boundaries + guards:boundaries alias | scripts/audit-domain-boundaries.mjs | IMPLEMENTED_LOCAL |
| 26 | CODEOWNERS | Step 05+06.1 | ALREADY_IMPLEMENTED | MANUAL_DEFERRED | — | .github/CODEOWNERS (@dgolansky-ux) | IMPLEMENTED_LOCAL |
| 27 | PR template | Step 05 | ALREADY_IMPLEMENTED | N/A | — | .github/pull_request_template.md | IMPLEMENTED_LOCAL |
| 28 | ADR folder/templates | Step 01 | ALREADY_IMPLEMENTED | N/A | — | docs/architecture/adr/ (ADR-000 through ADR-008) | IMPLEMENTED_LOCAL |
| 29 | Domain Ownership Matrix | Step 01 | ALREADY_IMPLEMENTED | N/A | — | docs/architecture/DOMAIN_OWNERSHIP_MATRIX.md | IMPLEMENTED_LOCAL |
| 30 | Generator: domain scaffold | Step 07 | IMPLEMENTED_LOCAL | N/A | Created scaffold-domain.mjs | scripts/scaffold-domain.mjs | IMPLEMENTED_LOCAL |
| 31 | Generator: UI shell scaffold | Step 07 | IMPLEMENTED_LOCAL | N/A | Created scaffold-ui-shell.mjs | scripts/scaffold-ui-shell.mjs | IMPLEMENTED_LOCAL |
| 32 | Release checklist | Step 01 | ALREADY_IMPLEMENTED | N/A | — | docs/release/RELEASE_READINESS_CHECKLIST.md | IMPLEMENTED_LOCAL |
| 33 | Accessibility checklist | Step 07 | NOT_APPLICABLE_YET | N/A | No runtime UI to audit | deferred to domain implementation | NOT_APPLICABLE_YET |
| 34 | Observability/logging policy | Step 01 | NOT_APPLICABLE_YET | N/A | No runtime to instrument | deferred to domain implementation | NOT_APPLICABLE_YET |
| 35 | Review reports index | Step 01 | ALREADY_IMPLEMENTED | N/A | — | docs/review/REVIEW_REPORTS_INDEX.md | IMPLEMENTED_LOCAL |
| 36 | Evidence bundle standard | Step 01 | ALREADY_IMPLEMENTED | N/A | — | docs/templates/EVIDENCE_BUNDLE_TEMPLATE.md | IMPLEMENTED_LOCAL |
| 37 | AI forbidden actions | Step 01 | ALREADY_IMPLEMENTED | N/A | — | docs/ai/AI_FORBIDDEN_ACTIONS.md | IMPLEMENTED_LOCAL |
| 38 | Reference pack policy | Step 01 | ALREADY_IMPLEMENTED | N/A | — | docs/ai/REFERENCE_PACK_POLICY.md | IMPLEMENTED_LOCAL |
| 39 | Railway deploy policy | Step 01 | ALREADY_IMPLEMENTED | N/A | — | docs/ai/RAILWAY_DEPLOY_POLICY.md | IMPLEMENTED_LOCAL |
| 40 | Supabase access policy | Step 01 | ALREADY_IMPLEMENTED | N/A | — | docs/ai/SUPABASE_ACCESS_POLICY.md | IMPLEMENTED_LOCAL |

## Additional items added in Step 07

| Item | Status | Evidence |
|---|---|---|
| check-script-safety.mjs | IMPLEMENTED_LOCAL | scripts/check-script-safety.mjs |
| scaffold-route.mjs | IMPLEMENTED_LOCAL | scripts/scaffold-route.mjs |
| VISUAL_MIGRATION_CHECKLIST_TEMPLATE.md | IMPLEMENTED_LOCAL | docs/templates/VISUAL_MIGRATION_CHECKLIST_TEMPLATE.md |
| guards:all-local umbrella | IMPLEMENTED_LOCAL | package.json |
| guards:secrets alias | IMPLEMENTED_LOCAL | package.json |
| guards:boundaries alias | IMPLEMENTED_LOCAL | package.json |
| guards:complexity alias | IMPLEMENTED_LOCAL | package.json |
| guards:migrations alias | IMPLEMENTED_LOCAL | package.json |
| guards:scripts alias | IMPLEMENTED_LOCAL | package.json |

## Summary

- **IMPLEMENTED_LOCAL:** 37
- **NOT_APPLICABLE_YET:** 2 (accessibility, observability — no runtime)
- **MANUAL_DEFERRED:** 1 (GitHub branch protection / CODEOWNERS enforcement)
- **BLOCKED:** 0
