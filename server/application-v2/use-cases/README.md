# application-v2/use-cases

Status: `PARTIAL`

Canonical location for flows that touch **2+ domains** (ADR-010, rule PX-APP-001).

A use-case orchestrates across domains by calling each domain's `public-api.ts` /
`contracts.ts` only — never a foreign `repository.ts` or `service.ts`. Domains
stay single-owner; cross-domain coordination lives here, not inside a domain
service.

## Active use-cases

- `profile/` — composes the **identity** and **media** domains into the
  profile view (owner + public). Canonical implementation under this directory
  (`service.ts`, `dto.ts`, `errors.ts`, `public-api.ts`, `__tests__/`). The
  frontend feature adapter depends only on `@shared/contracts/profile`; a
  future HTTP controller will mount on top of `./profile/public-api`.
- `contacts/` — composes **identity** (contact-access) and **social**
  (social-contacts) into the Kontakty surface + public-profile actions.
- `communities/` — `createCommunityWithDefaults`: **communities-v2** creates the
  community + founder membership, then **modules** enables a bounded set of
  default modules for it.
- `channels/` — `createChannelForCommunity`: checks the **communities-v2**
  `CommunityAuthorityResolver`, then delegates creation to **channels**.
- `public-hub/` — `getProfileHubView` / `getCommunityHubView`: adapts
  **identity** / **communities-v2** / **modules** public-api into the
  **public-hub** resolver contracts and composes the hub view model.
- `feed/` — `getFriendFeedFoundation`: resolves the viewer's friends from
  **social**, then queries the **content-v2** friend feed for that explicit
  author set (no global feed).

## Note

Onboarding, publishing and app-shell flows will be added here directly as they
gain real cross-domain runtime (today they are `SCAFFOLD_ONLY`).
