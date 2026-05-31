# integrations-v2

**Status:** FOUNDATION_READY (in-memory store, no HTTP transport)

Owns the **Integracje** module's data. Integrations are simple, safe link
records — there is no OAuth, no token storage, no API sync in this slice.

## Security

- URL validation rejects everything except `http:`, `https:`, `mailto:`.
  `javascript:`, `data:`, `file:`, `vbscript:` schemes are blocked.
- Public DTO carries no `createdByUserId`, no tokens, no secrets.
- `embed_placeholder` is intentionally a placeholder type — actual embed
  rendering is out of scope until a CSP / sanitiser policy is added.

## Public surface

Import only from `public-api.ts`.
