# ADR-005 — Railway-first + Supabase Split-ready Infrastructure

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `Accepted`  
Date: 2026-05-24  
Owner: Infrastructure

## Context

PlatformaX V2 needs a practical deployment path while keeping API/worker/realtime split possible.

## Decision

The default infrastructure direction is Railway-first with Supabase, using staging/lab environments before production claims.

## Consequences

- frontend/API/worker separation remains possible,
- migrations are kept in repo,
- db push is gated,
- production confidence requires staging evidence.

## What this forbids

- dashboard SQL as primary schema workflow,
- production DB changes without migration safety,
- service role in frontend,
- direct deploy claims without CI evidence,
- calling lab/staging production-ready.

## Required enforcement

- migration safety gate,
- env safety gate,
- branch protection,
- release checklist,
- backup/rollback policy.
