# PlatformaX V2 — Railway Deploy Policy

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `ACTIVE`  
Owner: Infrastructure

## 1. Purpose

This file defines safe Railway deployment rules.

## 2. Default environment

The first deployment environment is lab/staging, not production.

## 3. Rules

- deploy only after CI gates pass,
- frontend and backend env variables are separated,
- service role is backend-only,
- healthcheck must exist before claiming runtime readiness,
- deploy logs must not contain secrets,
- production deploy requires explicit owner approval,
- migrations are not run implicitly in normal deploy without gate.

## 4. Required before production claim

- green CI,
- migration safety green,
- staging deploy green,
- env inventory reviewed,
- rollback path documented,
- backup/restore plan,
- no secrets in logs,
- release notes.

## 5. Acceptance

Railway config is acceptable when deploy cannot bypass gates and production is not confused with lab/staging.
