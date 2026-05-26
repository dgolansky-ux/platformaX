# PlatformaX V2 — Secret Handling Policy

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `ACTIVE`  
Owner: Security / Infrastructure

## 1. Purpose

No secret may enter source control, logs, reports, bundles or frontend runtime.

## 2. Secret types

Hard fail if found in repo/logs/bundles:

- `DATABASE_URL`
- `postgresql://`
- Supabase service role key
- JWT secret
- OpenAI/API provider keys
- Stripe keys
- private tokens
- real `.env`
- access tokens
- refresh tokens
- webhook secrets

## 3. Environment files

Allowed in repo:

- `.env.example`
- `.env.test.example`

Forbidden in repo:

- `.env`
- `.env.local`
- `.env.production`
- `.env.staging` with real values
- copied env files in docs/reports

## 4. Frontend rule

Frontend may only receive public-safe variables.

Service role, database URL and private server secrets are backend-only.

## 5. Test rule

Tests must use safe fake values or explicit test containers/mocks. Tests must not require real project secrets.

## 6. Reporting rule

Secret scanners must mask values. Reports may show secret type and file path, not the secret.

## 7. Required gates

- check-env-safety
- check-diff-safety
- gitleaks or equivalent
- GitHub secret scanning if available
- bundle validator secret scan
