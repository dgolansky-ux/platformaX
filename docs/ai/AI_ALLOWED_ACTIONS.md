# PlatformaX V2 — AI Allowed Actions

Status: `ACTIVE`  
Owner: Governance  
Governance Index: `docs/governance/GOVERNANCE_INDEX.md`  
Permissions Policy: `docs/governance/AI_AGENT_PERMISSIONS_POLICY.md`

> **Note:** `docs/governance/` is the central governance index and registry.
> This file remains the authoritative source of allowed AI actions.

## 1. Purpose

This file defines what an AI agent may do without separate owner approval.

## 2. Always allowed within requested scope

- read project docs,
- inspect code,
- run local checks,
- create or update files explicitly requested,
- add tests for touched code,
- add typed fixtures,
- improve docs related to touched scope,
- report blockers honestly,
- stop when gates fail,
- create evidence reports,
- create manifests and logs.

## 3. Allowed with explicit task scope

- add a new V2 domain scaffold,
- add a new UI shell scaffold,
- add a new route,
- add a new guard script,
- update CI,
- update CODEOWNERS,
- update PR template,
- update ADR,
- update domain status,
- add Supabase migration,
- add Railway config,
- change package scripts,
- delete obsolete code.

## 4. Allowed only with explicit owner approval

- destructive DB migration,
- production deployment,
- production secrets rotation,
- branch protection/ruleset changes,
- using `--no-verify`,
- changing accepted ADRs,
- weakening guards,
- adding broad allowlists,
- moving reference material into active workspace.

## 5. Required behavior

The agent may choose `BLOCKED` instead of forcing completion.

That is correct behavior.
