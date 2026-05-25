# ADR-002 — Legacy Source Material Only

Status: `Accepted`  
Date: 2026-05-24  
Owner: Architecture

## Context

Legacy code may contain product knowledge, visual patterns and flow ideas, but it also contains old coupling and runtime assumptions.

## Decision

Legacy is source material only. It is not runtime for V2.

## Consequences

- V2 is written cleanly,
- old runtime cannot silently return,
- reference material must be isolated,
- useful value can be manually reimplemented.

## What this forbids

- legacy imports,
- active legacy routes,
- active legacy backend routers,
- legacy build chunks,
- copying old folders into V2 workspace,
- temporary compatibility without explicit expiry and guard exception.

## Required enforcement

- `check-no-legacy-imports`,
- `check-removed-product-areas`,
- build chunk gate,
- reference pack policy,
- CI legacy containment gate.
