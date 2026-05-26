# shared-ui â€” Shared UI Components

Status: `SCAFFOLD_ONLY`

## Purpose

Neutral UI component library shared across all feature domains. Provides reusable, domain-agnostic UI primitives.

## Constraints

- Must NOT contain domain-specific business logic
- Must NOT import from any domain's internal modules (repository, service, policy, etc.)
- Must NOT import from identity, social, content, communities, modules, or any other domain internals
- Must NOT import legacy code (features/, pages/, components/)
- May only use React, shared utilities, and design tokens
- Components must be stateless or use only local UI state

## What belongs here

- Generic buttons, inputs, modals, cards, layouts
- Typography, spacing, color primitives
- Shared hooks for UI-only concerns (e.g., useMediaQuery, useClickOutside)

## What does NOT belong here

- Domain entities, DTOs, contracts
- API calls or data fetching
- Business rules or validation logic
- Domain-specific routing

## Canonical governance

- Rules Registry: `docs/governance/RULES_REGISTRY.yml` (repo root)
- Governance Index: `docs/governance/GOVERNANCE_INDEX.md` (repo root)
- Domain Status Registry: `docs/governance/DOMAIN_STATUS_REGISTRY.yml` (repo root)
- Status Taxonomy: `docs/governance/STATUS_TAXONOMY.md` (repo root)

Local exceptions: none
