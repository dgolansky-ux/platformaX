# Red-case — planted ALLOW_STATUS_TERM_IN_POLICY_DOC outside allowlist

> This file lives under `tests/architecture/fixtures/**` and is excluded
> from the guard's scan by default. To prove the guard fires, copy the
> line below into a real path (e.g. `docs/notes/test.md`) and run
> `node scripts/check-no-agent-bypass-language.mjs` — it must exit 1.

```
ALLOW_STATUS_TERM_IN_POLICY_DOC
```
