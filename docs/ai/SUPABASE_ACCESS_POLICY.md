# PlatformaX V2 — Supabase Access Policy

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `ACTIVE`  
Owner: Infrastructure / Security

## 1. Purpose

This file defines how Supabase may be used safely.

## 2. Environment levels

| Environment | Purpose | Data expectation |
|---|---|---|
| local | developer checks | disposable |
| lab/staging | integration validation | non-production |
| production | real users/data | explicit approval only |

## 3. Rules

- migrations are code in repo,
- dashboard SQL is not the primary workflow,
- db push requires migration safety gate,
- destructive SQL requires review,
- service role never reaches frontend,
- secrets are only in environment managers, never repo,
- `.env.example` uses placeholders,
- `.env.test.example` uses safe fake values,
- tests must not require real Supabase secrets.

## 4. Destructive operations requiring explicit approval

- DROP TABLE
- TRUNCATE
- ALTER TABLE DROP COLUMN
- DISABLE RLS
- broad public policy
- production migration
- production secret rotation
- data deletion scripts

## 5. Required gate

`check-supabase-migrations-safety.mjs` must block unsafe migrations unless they contain explicit reviewed markers.

## 6. Acceptance

Supabase is acceptable only when env safety, migration safety and secret scanning are active.
