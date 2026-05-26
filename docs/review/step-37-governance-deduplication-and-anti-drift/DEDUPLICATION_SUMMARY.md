# Step 37 — Deduplication Summary

## Before

- 42 rules in RULES_REGISTRY.yml
- 46 guards in GUARDS_REGISTRY.yml
- Normative phrases scattered across 21 authority docs without canonical governance links
- Domain READMEs contained duplicate normative language without Rule ID references
- No automated check preventing new hidden rules

## After

- 43 rules in RULES_REGISTRY.yml (+1: PX-GOV-005)
- 47 guards in GUARDS_REGISTRY.yml (+1: GUARD-047)
- All 21 authority docs have canonical governance entrypoint header
- All 15 domain READMEs have canonical governance links section
- `check-governance-drift.mjs` blocks new global rules without Rule ID
- `HIDDEN_RULES_INVENTORY.md` documents the full audit

## Deduplication actions

| Action | Count |
|---|---|
| Rules already tracked | 26 |
| Duplicates identified (left as local context) | 4 |
| Local notes (not rules) | 4 |
| Template instructions (exempt) | 10 |
| Historical reports | 0 |
| Missing rules found | 0 |
| Conflicts found | 0 |
| New rules added | 1 (PX-GOV-005: anti-drift) |
| Docs with governance header added | 21 |
| Domain READMEs with governance links added | 15 |

## Net change

- No rules removed
- No rules weakened
- No duplicates introduced
- 1 new governance meta-rule added to prevent future drift
