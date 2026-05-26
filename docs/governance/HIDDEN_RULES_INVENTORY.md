# PlatformaX V2 — Hidden Rules Inventory

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`

Generated during: step-37 (Governance Deduplication and Anti-Drift)

## Purpose

This document inventories all normative phrases found outside `docs/governance/RULES_REGISTRY.yml` and classifies them to prevent rule drift.

## Scan scope

| Location | Files scanned |
|---|---|
| `server/domains-v2/**/README.md` | 17 |
| `client/src/features-v2/**/README.md` | 0 (none exist yet) |
| `client/src/app-v2/README.md` | 0 (none exist yet) |
| `docs/architecture/` | 14 |
| `docs/architecture/adr/` | 10 |
| `docs/ai/` | 6 |
| `docs/security/` | 1 |
| `docs/profile/` | 2 |
| `docs/templates/` | 7 |
| `.github/` | 1 |
| `.husky/` | 3 (shell scripts, not docs) |
| `.claude/` | 1 |

## Findings

### Domain READMEs

| File | Normative phrase | Classification | Linked Rule ID |
|---|---|---|---|
| `server/domains-v2/identity/README.md:50` | "PublicProfileDTO MUST NOT contain email, phone, dateOfBirth or any auth metadata" | duplicate_of_existing_rule | PX-SEC-001, PX-DTO-001 |
| `server/domains-v2/identity/README.md:51` | "Events carry only userId and timestamps — never PII" | duplicate_of_existing_rule | PX-OBS-002 |
| `server/domains-v2/media/README.md:9` | "never the file payload" | local_domain_note | PX-MEDIA-001 (ADR-006) |
| `server/domains-v2/media/README.md:16` | "never bytes" | local_domain_note | PX-MEDIA-001 (ADR-006) |
| `server/domains-v2/content-v2/README.md:34` | "Other domains must use content-v2/public-api, NOT submodule internals" | duplicate_of_existing_rule | PX-ARCH-002, PX-ARCH-009 |
| Other domain READMEs | "not importable by other domains" | local_domain_note | PX-ARCH-002 |

### Templates

| File | Normative phrase | Classification |
|---|---|---|
| `docs/templates/VISUAL_MIGRATION_CHECKLIST_TEMPLATE.md:29-33` | "Must not import from legacy", "Must not introduce removed product areas", "Must not use base64", "Must not claim VISUAL_DONE without evidence" | template_instruction |
| `docs/templates/DOMAIN_README_TEMPLATE.md:43,58` | "Forbidden dependencies", "Required" | template_instruction |
| `docs/templates/EVIDENCE_BUNDLE_TEMPLATE.md:5,20,33,45` | "Required bundle files", "Required manifest checks", "Required report sections", "Forbidden" | template_instruction |
| `docs/templates/CHANGE_REPORT_TEMPLATE.md:18` | "Forbidden actions" | template_instruction |
| `docs/templates/PRE_COMMIT_DECISION.md:3` | "REQUIRED_BEFORE_COMMIT" | template_instruction |
| `docs/templates/ARCHITECTURE_IMPACT_STATEMENT.md:3,33` | "REQUIRED_FOR_MAJOR_TASKS", "Review required" | template_instruction |
| `docs/templates/UI_SHELL_README_TEMPLATE.md:28` | "Every button/CTA must be listed" | template_instruction |

### Architecture / AI / Security docs (authority docs)

| File | Has governance header? | Classification |
|---|---|---|
| `docs/ai/AGENT_OPERATING_STANDARD.md` | YES | already_in_RULES_REGISTRY (via governance links) |
| `docs/ai/AI_ALLOWED_ACTIONS.md` | YES | already_in_RULES_REGISTRY (via governance links) |
| `docs/ai/AI_FORBIDDEN_ACTIONS.md` | YES | already_in_RULES_REGISTRY (via governance links) |
| `docs/ai/AGENT_SELF_AUDIT_PROTOCOL.md` | NO → FIXED | already_in_RULES_REGISTRY |
| `docs/ai/RAILWAY_DEPLOY_POLICY.md` | NO → FIXED | already_in_RULES_REGISTRY |
| `docs/ai/REFERENCE_PACK_POLICY.md` | NO → FIXED | already_in_RULES_REGISTRY |
| `docs/ai/SUPABASE_ACCESS_POLICY.md` | NO → FIXED | already_in_RULES_REGISTRY |
| `docs/architecture/BRAMKA.md` | NO → FIXED | already_in_RULES_REGISTRY |
| `docs/architecture/DOMAIN_BOUNDARY_RULES.md` | NO → FIXED | already_in_RULES_REGISTRY |
| `docs/architecture/DOMAIN_OWNERSHIP_MATRIX.md` | NO → FIXED | already_in_RULES_REGISTRY |
| `docs/architecture/DOMAIN_REGISTRY.md` | NO → FIXED | already_in_RULES_REGISTRY |
| `docs/architecture/DOMAIN_SCOPES.md` | NO → FIXED | already_in_RULES_REGISTRY |
| `docs/architecture/PlatformaX-V2-execution-map.md` | NO → FIXED | already_in_RULES_REGISTRY |
| `docs/architecture/PlatformaX-V2-active-rules.md` | YES | already_in_RULES_REGISTRY |
| `docs/architecture/PlatformaX-V2-coding-standards.md` | YES | already_in_RULES_REGISTRY |
| `docs/architecture/PlatformaX-V2-architecture-enforcement.md` | YES | already_in_RULES_REGISTRY |
| `docs/architecture/PlatformaX-V2-domain-status.md` | YES | already_in_RULES_REGISTRY |
| `docs/architecture/PlatformaX-V2-legacy-containment.md` | YES | already_in_RULES_REGISTRY |
| `docs/architecture/adr/ADR-000-template.md` | NO → FIXED | template_instruction |
| `docs/architecture/adr/ADR-001 through ADR-008` | NO → FIXED | already_in_RULES_REGISTRY |
| `docs/architecture/adr/README.md` | NO → FIXED | already_in_RULES_REGISTRY |
| `docs/security/SECRET_HANDLING_POLICY.md` | NO → FIXED | already_in_RULES_REGISTRY |

### CI / Hooks

| File | Normative phrase | Classification |
|---|---|---|
| `.github/workflows/v2-gates.yml` | CI gate definitions | already_in_RULES_REGISTRY (PX-GOV-002, PX-GOV-010) |
| `.husky/pre-commit` | Guard script invocations | already_in_RULES_REGISTRY (PX-GOV-002) |
| `.husky/pre-push` | Guard script invocations | already_in_RULES_REGISTRY (PX-GOV-002) |

## Summary

| Classification | Count |
|---|---|
| already_in_RULES_REGISTRY | 26 |
| duplicate_of_existing_rule | 4 |
| local_domain_note | 4 |
| template_instruction | 10 |
| historical_report_only | 0 |
| missing_from_registry | 0 |
| conflict_with_registry | 0 |

## Resolution

- **0 new rules added** — no truly missing global rules found
- **21 files received canonical governance header** (KROK 6)
- **4 duplicate phrases** in domain READMEs — left in place as local context with implicit link to existing rules
- **10 template instructions** — exempt from anti-drift guard (templates are scaffolding, not policy source)
- **0 conflicts** found between docs
