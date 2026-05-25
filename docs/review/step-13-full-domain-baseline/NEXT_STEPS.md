# Step 13 — Next Steps

## Domain implementation order (suggested)

1. **identity** — auth subject, profile (foundation for all other domains)
2. **social** — contact graph (depends on identity public-api)
3. **communities-v2** — community core (depends on identity, social)
4. **content-v2** — posts, feeds (depends on identity, communities-v2)
5. **channels** — channel management (depends on communities-v2)
6. **chat** — messaging (depends on channels, identity)
7. **events** — event lifecycle (depends on identity, communities-v2)
8. **modules** — module registry (depends on communities-v2)
9. **media** — media assets (depends on identity)
10. **public-hub** — public composition (depends on identity, communities-v2, content-v2)
11. **notifications** — notification delivery (depends on identity events)
12. **search** — search indexing (depends on all domain events)
13. **moderation** — moderation (depends on content-v2, communities-v2 events)
14. **audit** — audit trail (depends on all domain events)
15. **system** — system ops (independent)

## Pending GitHub gates

- Branch protection enforcement: PLAN_LIMITATION
- CODEOWNERS review: PLAN_LIMITATION
- Secret scanning: PLAN_LIMITATION

## Implementation rules

- Each domain moves from SCAFFOLD_ONLY to next status only with evidence
- Runtime code (service, repository, router) requires updated README + contract tests
- Cross-domain communication only via public-api/contracts/events
- No domain may bypass the registry
