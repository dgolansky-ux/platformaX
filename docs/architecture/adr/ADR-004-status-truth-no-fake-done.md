# ADR-004 — Status Truth and No Fake DONE

Status: `Accepted`  
Date: 2026-05-24  
Owner: Governance

## Context

Reports can claim DONE while code, tests or visual evidence are incomplete.

## Decision

Status must match evidence. No fake DONE.

## Consequences

- partial work is labeled honestly,
- blockers are visible,
- trust improves,
- reports must include gates and evidence.

## What this forbids

- VISUAL_DONE without screenshots/manual evidence,
- BACKEND_DONE without runtime evidence,
- IMPLEMENTED for scaffold,
- FULL_DONE without full proof,
- clean/final/complete claims without gates.

## Required enforcement

- `check-fake-done`,
- `check-domain-status`,
- report index,
- pre-commit decision template,
- CI status truth gate.
