# ADR-015 — Idempotency Table

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `Accepted`  
Date: 2026-05-27  
Owner: Architecture  
Rules: **PX-IDEMP-001**, **PX-IDEMPOTENCY-001**

## Context

Create, publish, upload, and finalize operations are retried by clients and workers. Without persisted idempotency keys, duplicates corrupt data.

## Decision

1. Clients send `idempotencyKey` on retry-sensitive commands.

2. Server persists keys in an **idempotency table** (domain-owned or shared operational schema) and returns the same result on replay.

3. Until table exists, tasks must document exemption in Architecture Impact Statement.

## Consequences

- Requires migration (code only until db push approved).
- EventEnvelope includes `idempotencyKey` for consumers (ADR-009).

## Alternatives considered

- Best-effort dedupe in memory — rejected for multi-instance deploys.

## Migration / rollout

1. Add migration in repo when approved.
2. Wire repository check in media/identity/content publish paths incrementally.

## Guard / enforcement

- **manual_gate**
- TODO: `scripts/check-idempotency-flows.mjs`
