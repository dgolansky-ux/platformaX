# Step 37 — Hidden Rules Audit

## Scan scope

Scanned the following locations for normative phrases:

| Location | Files |
|---|---|
| docs/architecture/ | 14 |
| docs/architecture/adr/ | 10 |
| docs/ai/ | 6 |
| docs/security/ | 1 |
| docs/profile/ | 2 |
| docs/templates/ | 7 |
| server/domains-v2/**/README.md | 17 |
| .github/workflows/ | 1 |
| .husky/ | 3 |

## Normative phrases searched

`must`, `required`, `forbidden`, `never`, `always`, `only`, `block`, `fail`, `zakaz`, `nie wolno`, `musi`, `wymagane`, `tylko`, `blokuje`, `failuje`

## Findings by classification

### already_in_RULES_REGISTRY (26)

All normative phrases in `docs/ai/AGENT_OPERATING_STANDARD.md`, `docs/ai/AI_ALLOWED_ACTIONS.md`, `docs/ai/AI_FORBIDDEN_ACTIONS.md`, and most architecture docs are already covered by existing rules in RULES_REGISTRY.yml (PX-GOV-*, PX-AI-*, PX-ARCH-*, PX-SEC-*, etc.).

### duplicate_of_existing_rule (4)

| File | Phrase | Duplicates |
|---|---|---|
| `server/domains-v2/identity/README.md:50` | "PublicProfileDTO MUST NOT contain email, phone, dateOfBirth" | PX-SEC-001, PX-DTO-001 |
| `server/domains-v2/identity/README.md:51` | "Events carry only userId and timestamps — never PII" | PX-OBS-002 |
| `server/domains-v2/content-v2/README.md:34` | "Other domains must use content-v2/public-api, NOT submodule internals" | PX-ARCH-002, PX-ARCH-009 |
| Multiple domain READMEs | "not importable by other domains" | PX-ARCH-002 |

### local_domain_note (4)

| File | Phrase | Context |
|---|---|---|
| `server/domains-v2/media/README.md:9` | "never the file payload" | Domain-specific architecture note about MediaAssetRef |
| `server/domains-v2/media/README.md:16` | "never bytes" | Repository stores metadata only |
| `server/domains-v2/identity/README.md:7` | "runtime justification: required for..." | Local status justification |
| `server/domains-v2/media/README.md:17` | "env-required" | Local adapter dependency note |

### template_instruction (10)

All normative phrases in `docs/templates/*.md` are template scaffolding instructions (e.g., "Must not import from legacy", "Required bundle files") — not active rules.

### historical_report_only (0)

No historical-only normative phrases found.

### missing_from_registry (0)

No truly missing global rules found. All actionable normative rules are already tracked.

### conflict_with_registry (0)

No conflicts between any docs and the RULES_REGISTRY.yml.

## Resolution

- 0 new rules needed — governance registry is complete
- 21 authority docs received canonical governance header (KROK 6)
- 4 duplicate phrases left in place as local context (not harmful)
- Templates exempt from drift checking
