# ADR-007 — Feed Ownership and No Global Social Feed

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `Accepted`  
Date: 2026-05-24  
Owner: Content / Social / Communities

## Context

A global undifferentiated feed creates ownership confusion and policy leaks.

## Decision

There is no generic global social feed. Feeds are scoped projections owned by `content-v2`, with policy inputs from owner domains.

## Consequences

- content-v2 owns feed projections,
- social owns relationship graph,
- communities owns membership/role policy,
- feeds require cursor pagination and read-model strategy.

## What this forbids

- global fetch-all feed,
- social owning posts,
- communities owning posts,
- per-card N+1 relation/reaction queries,
- feed without limit/cursor/fixed cap.

## Required enforcement

- pagination gate,
- contract tests,
- feed DTO tests,
- no N+1 review for hot paths.
