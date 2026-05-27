# ADR-012 — Branded IDs and Result Boundary

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `Accepted`  
Date: 2026-05-27  
Owner: Architecture  
Rules: **PX-ID-001**, **PX-ERROR-001**

## Context

Raw `string` IDs for `userId`, `postId`, etc. allow accidental mixing at compile time. Throwing generic `Error` across domain boundaries leaks transport concerns.

## Decision

1. Use branded types at domain boundaries: `UserId`, `PostId`, `MediaAssetId`, `CommunityId` (in `shared/` or domain `contracts.ts`).

2. Public domain APIs return **`Result<T, DomainError>`** (or equivalent) for expected failures — not unchecked throws.

## Consequences

- Safer refactors; clearer error mapping in routers (Zod/transport only at edge).

## Alternatives considered

- Plain strings + runtime checks only — rejected for long-term safety.

## Migration / rollout

Introduce brands incrementally on touched domains; do not mass-refactor unrelated code in governance-only tasks.

## Guard / enforcement

- **manual_gate**
- TODO: `scripts/check-branded-id-types.mjs`
