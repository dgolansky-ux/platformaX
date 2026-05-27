# ADR-011 — Single Read-Model Owner

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `Accepted`  
Date: 2026-05-27  
Owner: Architecture  
Rules: **PX-READMODEL-001**, **PX-ARCH-005**

## Context

Duplicate writers to the same projection (e.g. global social feed table) cause race conditions and unclear ownership.

## Decision

Every read model / projection / feed surface has **exactly one owner domain** documented in `DOMAIN_OWNERSHIP_MATRIX.md`.

Composition domains (e.g. public-hub) may **read** projections via public-api — they do not own writes.

## Consequences

- Friend feed read model owned by defined domain (see ADR-007).
- Clear migration and index ownership.

## Alternatives considered

- Shared `feeds` god-table — rejected (ADR-007).

## Migration / rollout

Document owner per projection before implementing runtime writes.

## Guard / enforcement

- **manual_gate** — ownership matrix + step report
- TODO: `scripts/check-read-model-single-owner.mjs`
