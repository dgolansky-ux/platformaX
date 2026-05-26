# ADR-008 — Public Hub and Modules Separation

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `Accepted`  
Date: 2026-05-24  
Owner: Public Hub / Modules

## Context

Public views and modules can easily become a hardcoded god-layer.

## Decision

`modules` owns definitions and enablement. `public-hub` composes public views. Neither owns source data for other domains.

## Consequences

- modules registry stays generic,
- public hub is composition/read view,
- owner domains remain source of truth,
- future modules can be added without hardcoded owner tabs.

## What this forbids

- public-hub storing module source data,
- modules owning content/community/event data,
- hardcoded module tabs inside owner domains,
- public-hub importing owner internals.

## Required enforcement

- module contract tests,
- public-hub composition tests,
- domain boundary audit,
- CODEOWNERS review for module/public-hub changes.
