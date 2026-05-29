# Backend Runtime Foundation — MVP Core report

Status: `ACTIVE`
Branch: `feat/contacts-v2-clean-room-slice`
Mode: DEEP backend/architecture/security verification + targeted gap-closing.

This was largely a **verification + hardening** pass: the five MVP-core areas
already existed from prior slices. No new framework was introduced (per the
"don't build a big framework / use existing standards" constraint).

## 1. Scope

- **Identity / profile** — public/private DTO split, visibility + owner/viewer
  policy, service/repository(in-memory)/mapper/public-api, internal record +
  private DTO. PII separation covered by `public-mapper-no-pii.test.ts`.
- **Media avatar/banner** — asset ref, upload-intent, owner-only + purpose
  (`profile_avatar` / `profile_banner`) validation, public DTO without storage
  secrets. No base64/readAsDataURL runtime (asserted by `no-storage` /
  `public-mapper-no-leak` tests).
- **Contacts V2** — `contact_request` (identity, private fields + visibility
  policy) separate from `friend_request`/`friendship` (social); approved-field
  grants; address-book + specialist owner-local shortcuts; owner-local
  `friendCircle` groups; orchestrated by `application-v2/use-cases/contacts`
  through public-apis only.
- **Professions / Sekcja zawodowa** — 30 categories REFERENCE_DATA_READY;
  professions + specializations DATA_PENDING; dry-run import validator.
- **Social base** — relationship status, friend request/friendship lifecycle,
  owner-local shortcuts; no PII, no profile, no posts.

## 2. Deliberately NOT implemented

communities, chat, events, modules, channels, Public Hub, full friend feed,
posts/comments/reactions, production DB writes, production storage, db push,
Railway deploy. No unified RequestContext/Result framework — the repo's
established per-domain `Result` + `DomainError`-code pattern + optional branded
IDs is kept (introducing a global framework was explicitly out of scope).

## 3. Status truth

| Area | Status |
|---|---|
| Identity / profile | BACKEND_PARTIAL (in-memory repo, no live DB) |
| Media avatar/banner | BACKEND_PARTIAL (in-memory storage adapter) |
| Contacts V2 | BACKEND_PARTIAL + MOCK_LOCAL_ONLY (no transport) |
| Professions categories | REFERENCE_DATA_READY |
| Professions data | DATA_PENDING |
| Specializations data | DATA_PENDING |
| Import pipeline | IMPORT_CONTRACT_READY / DRY_RUN_ONLY |
| Social base | BACKEND_PARTIAL |

No area is IMPLEMENTED/PRODUCTION_READY (no transport/DB/deploy evidence).

## 4. Test evidence (added / changed this pass)

- `identity/__tests__/contact-access-service.test.ts` — **reverse-direction**
  contact request: A→B pending does NOT block B→A (separate per-direction
  request), complementing the existing same-direction `PENDING_DUPLICATE` test.
- `identity/professions/__tests__/professions.test.ts` — specialization import
  rules: empty specialization name flagged; duplicate specialization WITHIN a
  profession flagged; the SAME specialization slug under DIFFERENT professions
  is allowed and counted as two (per-profession keying).

Pre-existing coverage relied on (unchanged): contacts policy/service/application/
frontend (accept exposes only approved fields; reject exposes none; friendship
no auto-PII; address-book/specialist/owner-local-group no PII; public DTO zero
PII); identity public-mapper-no-pii; media public-mapper-no-leak + no-storage;
professions 30-categories / order / slug / DATA_PENDING / dry-run-no-persist.

## 5. Import validator — specialization rules (clarified)

- Profession slug is unique **globally**.
- Specialization slug is unique **per parent profession** (key
  `${professionSlug}::${specializationSlug}`). The same specialization slug may
  legitimately exist under different professions and is counted separately.
- Empty profession name and empty (declared) specialization name are rejected.
- Dry-run never persists (`report.persisted === false`).

## 6. Guard evidence

Run at the committed HEAD (see session log): `pnpm check`, `pnpm lint`,
`pnpm test`, `pnpm build`, `pnpm rules:check` (43), `pnpm arch:check:v2` (9),
`depcruise:check` (0 errors), `tooling:check` (gitleaks: no leaks). Audit ZIP
intentionally skipped this pass at the owner's request.

## 7. P0 / P1 / P2

- **P0:** none.
- **P1:** none.
- **P2 (cleanup, non-blocking):** branded IDs remain optional/non-enforced
  (documented `manual_gate`, flips when the first real transport ships);
  `ProfileContactCard` is prepared but not yet embedded on the profile page;
  professions/specializations data + real transport/DB are pending the owner's
  import package — all are truthful PARTIAL/DATA_PENDING statuses, not gaps.
