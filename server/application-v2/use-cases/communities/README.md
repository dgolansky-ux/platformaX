# application-v2/use-cases/communities

Status: `PARTIAL`

Cross-domain flow (ADR-010, rule PX-APP-001) composing **communities-v2** and
**modules**.

`createCommunityWithDefaults(input)`:

1. `communities.createCommunity(input)` — the domain creates the community and
   the founder membership atomically. On failure the error is propagated as-is.
2. For each (bounded) `defaultModuleKeys` entry, `modules.enableForOwner` for the
   new community. Unknown / disallowed keys are skipped — they never fail the
   community creation.

Returns `{ community, enabledModules }`. The use-case owns no data and calls only
each domain's `public-api.ts`.
