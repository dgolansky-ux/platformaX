# ADR-001 — Modular Monolith V2

Status: `Accepted`  
Date: 2026-05-24  
Owner: Architecture

## Context

PlatformaX V2 needs strong domain boundaries without the operational cost of microservices at the beginning.

## Decision

PlatformaX V2 is a modular monolith. It is one system with separate internal domains and split-ready boundaries.

## Consequences

- one coherent repo/system at the start,
- lower operational complexity,
- strong internal ownership,
- future split into frontend/API/worker/realtime remains possible.

## What this forbids

- microservices by default,
- god-domain monolith,
- cross-domain internals,
- public-hub as source of truth,
- feature code bypassing owners.

## Required enforcement

- architecture boundary checker,
- domain ownership matrix,
- public-api/contracts/events rule,
- CI arch gate.
