# ADR-003 — Cross-domain Integration Boundaries

Status: `Accepted`  
Date: 2026-05-24  
Owner: Architecture

## Context

Domain boundaries degrade when agents use deep imports for speed.

## Decision

Cross-domain integration is allowed only through:

- `public-api.ts`
- `contracts.ts`
- `events.ts`
- outbox/event contracts
- intentionally shared value objects

## Consequences

- boundaries are stable,
- future splitting remains possible,
- contracts become explicit,
- some short-term work is slower.

## What this forbids

- importing repository/service/policy/router/mapper/db/cache-keys from another domain,
- raw DB records crossing boundaries,
- frontend importing server internals,
- feature domains importing other feature internals.

## Required enforcement

- arch-check-v2,
- dependency boundary checker,
- public API surface tests,
- CODEOWNERS review for public API changes.
