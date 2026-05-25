# PlatformaX V2 — Step 01 Governance Foundation

Status: `L1_GOVERNANCE_READY_CANDIDATE`  
Scope: governance documents only  
Feature work: forbidden in this step

This package contains the first governance layer for PlatformaX V2. It is designed to be copied into a clean repository before any feature work starts.

The goal of this step is to make the project rules explicit, reviewable and enforceable by later gates. These files do not replace automated checks. They define what later `scripts/check-*`, Husky hooks, CI, branch protection and audit reports must enforce.

## Included areas

- Core active rules
- Coding standards
- Architecture enforcement
- Domain status truth
- Legacy containment
- Execution map
- Domain ownership matrix
- ADR system
- Agent operating policies
- Governance templates
- Review report index
- Gate acceptance matrix

## Non-goals

This package does not create application code.
This package does not implement `rules:check`.
This package does not configure GitHub, Supabase or Railway.
This package does not approve any production runtime.
This package does not allow legacy runtime imports.

## Required next step

After these files are reviewed and copied into the repo, proceed to Step 02: clean repository skeleton and package scripts.
