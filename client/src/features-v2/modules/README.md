# features-v2/modules

**Status:** UI_SHELL_ONLY + MOCK_LOCAL_ONLY

Owner-agnostic module management UI. Use `ModulesManageView` with `ownerType`
and `ownerId` to render either a profile-side or community-side modules
screen — the component reads `canManage` from the owner context and toggles
the per-row CTA accordingly.

No `@server/*` imports. The mock adapter (`modulesMockAdapter`) is the only
data source and is shared with the `public-hub` feature so module enablement
flows visibly into the Public Hub slot rendering during local development.
