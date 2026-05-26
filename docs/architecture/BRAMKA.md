# PlatformaX V2 — BRAMKA (Governance Gate)

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

## Purpose

BRAMKA is the governance framework that ensures code quality, architectural integrity, security, and documentation standards for PlatformaX V2. No changes reach `main` without passing all gates.

## Enforcement layers

1. **Local pre-commit** — Husky + lint-staged + commitlint + diff-safety guards
2. **Local pre-push** — Full rules:check + arch:check:v2 + test + build
3. **GitHub CI** — Automated check on every PR (v2-gates.yml)
4. **Branch protection** — PR required, 1 approval, CODEOWNERS, status checks
5. **Documentation** — PRE-COMMIT DECISION + SELF-AUDIT in all Step 17+ reports

## Acceptance matrix

The final acceptance matrix consists of 25 verification points covering:

- Guard scripts (diff-safety, domain boundaries, fake-done, env-safety, complexity, secrets, etc.)
- Git hooks (Husky pre-commit, pre-push, lint-staged, commitlint)
- CI/CD (GitHub Actions workflow, required status checks)
- Branch protection (PR required, approvals, CODEOWNERS, no force push)
- Documentation (ADR folder, domain ownership, review reports index, BRAMKA document)
- Bundle validation (backslash paths, nested ZIP, banned files)
- Commit blocking (gates must pass before commit/merge)

## Guard inventory

| Guard | Scope |
|---|---|
| check-fake-done | Banned status strings |
| check-domain-status | Domain status consistency |
| check-no-legacy-imports | V1/legacy imports |
| check-removed-product-areas | Forbidden routes/features |
| audit-domain-boundaries | Cross-domain imports |
| check-test-env-safety | Test .env usage |
| check-env-safety | Secret patterns in code |
| check-public-dto-pii | PII in public DTOs |
| check-media-base64 | Base64/dataUrl usage |
| check-pagination | List query pagination |
| check-file-complexity | File size limits |
| check-build-artifacts | Build artifact leaks |
| check-supabase-migrations-safety | Migration safety |
| check-domain-registry | Domain registry consistency |
| check-domain-scaffold | Domain scaffold completeness |
| check-feature-registry | Feature registry consistency |
| check-secret-scan | Secret pattern scanning |
| check-review-reports-index | Review index completeness |
| check-pre-commit-decision | PRE-COMMIT DECISION enforcement |
| check-self-audit-evidence | SELF-AUDIT enforcement |
| check-bramka-acceptance | 25-point acceptance matrix |
| validate-bundle | ZIP/bundle validation |
| check-diff-safety | Staged diff safety |
| check-local-secret-scan | Local secret regex scan |
| check-script-safety | Script safety |

## Status

See `docs/review/step-18-final-bramka-acceptance/BRAMKA_ACCEPTANCE_MATRIX.md` for current acceptance matrix results.
