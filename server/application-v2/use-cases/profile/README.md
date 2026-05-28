# use-cases/profile

Status: `PARTIAL`
Owner domains touched: `identity` + `media`
Rule: **PX-APP-001** (ADR-010)

## Why it lives here

The profile view composes `identity.getMyProfile`/`getPublicProfile` with
`media.getPublicMediaUrl` and `media.verifyProfileAssetForAttach` to produce a
single owner/public view DTO. That is two owner domains, so per ADR-010 the
orchestration is a use-case, not a domain service.

## Canonical entry

```ts
import {
  createProfileApplicationService,
  type ProfileApplicationService,
} from "@server/application-v2/use-cases/profile/public-api";
```

The implementation currently lives at `server/application-v2/profile/`. This
folder re-exports it so the canonical import path matches the documented
standard. A future refactor may physically move the files here — the contract
will not change.

## Owner-only vs public

- `OwnerProfileView` — Private (owner-only). Contains `phone`,
  `dateOfBirth`. Returned only when the caller proves ownership
  (`currentUserId === profile.userId`).
- `PublicProfileView` — Public (any viewer). Zero PII.

## What this use-case never does

- write to `identity_*` or `media_*` tables directly;
- import from `server/domains-v2/identity/repository.ts`,
  `service.ts`, `policy.ts`, `mapper.ts`, or any `internal/*`;
- expose raw domain DTOs back through the application boundary.
