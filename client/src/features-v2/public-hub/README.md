# features-v2/public-hub

**Status:** UI_SHELL_ONLY + MOCK_LOCAL_ONLY

Owner-agnostic Public Hub renderer. Use `PublicHubView` with `ownerType`
and `ownerId` to render the composed public surface for a personal profile
or a community. The view reads enablement from the `modules` mock adapter
and per-slot sample data from the `public-hub` mock adapter.

No `@server/*` imports. The 4 module slots (Tematy, Wydarzenia, Integracje,
Newsletter chatowy) are dedicated components under `./slots/`; rendering is
slot-driven, so disabling a module at the management screen is immediately
reflected here.
