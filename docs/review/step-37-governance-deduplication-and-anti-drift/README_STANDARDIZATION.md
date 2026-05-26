# Step 37 — README Standardization

## Domain READMEs updated

All 15 domain READMEs in `server/domains-v2/` received a canonical governance links section:

| Domain | Status | Updated |
|---|---|---|
| identity | PARTIAL | YES |
| media | PARTIAL | YES |
| social | SCAFFOLD_ONLY | YES |
| content-v2 | SCAFFOLD_ONLY | YES |
| communities-v2 | SCAFFOLD_ONLY | YES |
| chat | SCAFFOLD_ONLY | YES |
| channels | SCAFFOLD_ONLY | YES |
| events | SCAFFOLD_ONLY | YES |
| moderation | SCAFFOLD_ONLY | YES |
| notifications | SCAFFOLD_ONLY | YES |
| search | SCAFFOLD_ONLY | YES |
| public-hub | SCAFFOLD_ONLY | YES |
| system | SCAFFOLD_ONLY | YES |
| audit | SCAFFOLD_ONLY | YES |
| modules | SCAFFOLD_ONLY | YES |

## Standard added

Each README now ends with:

```md
## Canonical governance

- [Rules Registry](../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: none
```

## Authority docs updated

21 authority docs received a canonical governance entrypoint header:

- 4 docs in `docs/ai/`
- 14 docs in `docs/architecture/` (including 9 ADRs + README)
- 1 doc in `docs/security/`

Header format:

```md
> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.
```

## What was NOT changed

- No content removed from any README
- No architecture meaning changed
- No rules removed or weakened
- No global rules duplicated into domain READMEs
