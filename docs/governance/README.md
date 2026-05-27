# PlatformaX V2 — Governance Center

Status: `ACTIVE`
Owner: Architecture / Governance

## Purpose

This folder is the **canonical governance center** for PlatformaX V2. It provides a single, machine-readable, agent-readable source of truth for all project rules, guards, statuses, permissions, and enforcement mappings.

## Precedence

If any document, command, prompt, or local shortcut conflicts with the files in `docs/governance/`, governance wins.

Historical documents in `docs/architecture/`, `docs/ai/`, `docs/security/`, and `docs/profile/` remain the **source of detailed content**. This folder indexes, cross-references, and enforces them — it does not replace their substance.

## Canonical Files

| File | Purpose |
|---|---|
| `GOVERNANCE_INDEX.md` | Central map of all rules by category |
| `RULES_REGISTRY.yml` | Machine-readable registry of every rule with ID, severity, enforcement |
| `GUARDS_REGISTRY.yml` | Machine-readable registry of every guard script |
| `RULES_TO_GUARDS_MATRIX.md` | Gap analysis: which rules have automated enforcement |
| `STATUS_TAXONOMY.md` | Allowed status labels, evidence requirements, forbidden patterns |
| `DOMAIN_STATUS_REGISTRY.yml` | Machine-readable domain status with conflict detection |
| `AI_AGENT_PERMISSIONS_POLICY.md` | What AI agents may and must not do |
| `AGENT_COMMAND_STANDARD.md` | Standard structure for every agent task |
| `EXCEPTIONS_REGISTER.md` | Active exceptions to rules |
| `REQUIRED_DOCS_BY_SCOPE.yml` | Required reading per task type |
| `BACKEND_ARCHITECTURE_INVARIANTS.md` | Hard backend invariants (owner/viewer/DTO/media/list/outbox) |

## Where to Start

1. **AI agents**: Read `GOVERNANCE_INDEX.md` first, then `RULES_REGISTRY.yml`.
2. **Humans**: Read `GOVERNANCE_INDEX.md` for the full map.
3. **Guard scripts**: Validate against `RULES_REGISTRY.yml` and `GUARDS_REGISTRY.yml`.
4. **Status checks**: Use `DOMAIN_STATUS_REGISTRY.yml` and `STATUS_TAXONOMY.md`.

## Rule

If a document or command conflicts with governance, governance wins.
If governance itself has a conflict, the higher-severity rule (P0 > P1 > P2) wins.
If severity is equal, the more restrictive interpretation wins.
