# PlatformaX V2 — Next Build Plan (post MVP-core foundation)

Status: `ACTIVE` · Branch of record: `feat/contacts-v2-clean-room-slice`
Scope: planning only — no new features coded here, no governance added.

## 1. Current state

| Area | Status |
|---|---|
| Identity / profile | PARTIAL (in-memory runtime, no live DB) |
| Media avatar/banner | PARTIAL (in-memory storage adapter) |
| Contacts V2 | PARTIAL (backend) + MOCK_LOCAL_ONLY (frontend, no transport) |
| Professions categories | READY (REFERENCE_DATA_READY, 30 rows) |
| Professions / specializations data | DATA_PENDING (owner ships dataset) |
| Professions import | IMPORT_CONTRACT_READY / DRY_RUN_ONLY |
| Social base | PARTIAL (friendship/relationship; no feed) |
| Content / friend feed | NOT_STARTED |
| Comments / reactions | NOT_STARTED |
| Communities | NOT_STARTED |
| Public Hub | NOT_STARTED |
| Modules | NOT_STARTED |
| Channels | NOT_STARTED |
| Chat / newsletter | NOT_STARTED |
| Events | NOT_STARTED |
| Notifications / search / moderation | NOT_STARTED (scaffold only) |
| Infra / staging (DB, storage, deploy) | BLOCKED_BY_DECISION (owner: Supabase/Railway go-ahead) |

## 2. Main decision

**We do NOT build everything at once.** The foundation is real but runs on
in-memory adapters + mock transport. The single biggest unblocker is the
**real transport + persistence layer** (HTTP API + Supabase/DB adapters). Most
of stages 3+ are gated on it and on owner-supplied data. Build vertically, one
runnable slice at a time, keeping every public DTO PII-free.

## 3. Stage order

1. **MVP Core runtime close** — real transport + DB/storage adapters for
   identity/profile, media, contacts, social; import the full professions
   dataset.
2. **Profile & professional section as real product** — public/private/manage
   profile, professional layer, profession+specialization selection (after
   import), visibility, profile CTA (embed `ProfileContactCard`).
3. **Content & friend feed** — posts, profile posts, friend feed, comments,
   reactions, batch counts, cursor pagination, owner read-model + outbox.
4. **Social extended** — friend requests UI, relationship states, contacts
   dashboard, profile relationship surface, privacy grants, minimal people
   search.
5. **Communities V2** — community profile, members/roles, invites/join,
   settings, feed settings (no posts inside communities domain).
6. **Public Hub + Modules** — module definitions, enablement, hub composition
   (topics/events/integrations/newsletter/channel as slots; no SoT duplication).
7. **Channels / RingPost** — channel owned by community, follows ≠ membership,
   discovery teaser (no global feed).
8. **Chat & newsletter** — direct chat, broadcast inbox, pagination, unread
   counters, worker fanout (no massive sync DM).
9. **Events / integrations / topics** — events without Stripe, simple-link
   integrations, topics via content-v2/topics, modules render-only.
10. **Staging / infra hardening** — Supabase/Railway staging, migrations,
    observability, rate limit, backups, security checks, audit logs.

## 4. Slice roadmap (condensed per slice)

For each slice: goal · domains · owner · needs use-case · DTO split · policy ·
repo · mapper · public-api/contracts/events · frontend · tests · gates · final
status · out-of-scope · P0/P1 risks · owner data needed.

### S1. Transport + persistence (MVP-core close)
Goal: replace in-memory/mock with HTTP + DB adapters. Domains: identity, media,
social, application/contacts. Use-case: yes (contacts). DTO: existing public/
private. Policy/repo/mapper/public-api: existing — add DB repository impls
behind the SAME ports. Frontend: swap `mock-adapter`/`reference-adapter` for
`http-adapter` (same interface). Tests: repository contract tests against DB,
transport integration. Gates: full. Final status: BACKEND_PARTIAL → IMPLEMENTED
only with DB+transport evidence. Out: feed/communities. P0 risk: PII leak via
new transport DTO; migration safety. Owner data: Supabase project + go-ahead.

### S2. Professions data import
Goal: ingest the owner's professions+specializations package via the existing
dry-run validator, then a real (idempotent) import. Domains: identity/professions.
Use-case: no (single domain). Frontend: enable step 2/3 selection + "Moje
zawody" save. Tests: import idempotency, selection max-3 + primary/additional.
Final: professions/specializations REFERENCE_DATA_READY. Owner data: the dataset.

### S3. Profile product
Goal: public/manage profile + professional layer + profile contact CTA. Domains:
identity, media, social (read), application. Frontend: `app-v2/profile` +
`/manage`. Tests: visibility matrix, PII. Out: posts/feed. Owner decision:
which profile fields are public vs friend-only by default.

### S4. Friend feed + content
Goal: posts/feed/comments/reactions. Domains: NEW `content-v2` (already
scaffolded), social. Use-case: yes (feed read-model composing social+content).
Must use outbox for fanout (PX-EVENT-001), cursor pagination (PX-LIST-004).
P0 risk: sync fanout, unbounded feed. Depends on S1.

### S5–S9 (communities / public-hub / modules / channels / chat / events)
Each: new domain behind public-api/contracts/events; no SoT duplication; render
slots only in Public Hub; no global feed. All depend on S1 + S3/S4.

### S10. Infra hardening
Migrations, observability, rate limit, backups, audit logs. Depends on owner
infra decision.

## 5. Dependency map

- **Before friend feed (S4):** S1 (transport/DB) + social base (done) + content-v2
  domain + outbox/read-model.
- **Before communities (S5):** S1 + profile (S3).
- **Before public hub (S6):** communities (S5) + modules definitions.
- **Before channels (S7):** communities (S5) + public hub (S6).
- **Before chat/newsletter (S8):** S1 + social + worker/outbox infra.
- **Needs real DB:** S1, S4, S5, S8, S10.
- **Can stay BACKEND_PARTIAL:** S2 logic (until data), S3 read paths.
- **Needs owner data:** S2 (professions dataset), S3 (default visibility).
- **Needs owner decision:** S1 (Supabase/Railway), S10 (infra), monetization
  (Stripe — explicitly deferred).

## 6. Agent command plan (order, not full commands yet)

- **DEEP** (backend/domain/security): `S1 transport+DB`, `S4 content/feed core`,
  `S5 communities core`, `S8 chat core`, `S10 infra hardening`. ZIP: only on
  explicit audit rounds.
- **STANDARD** (normal slices): `S2 professions import`, `S3 profile product`,
  `S4 comments/reactions`, `S6 public hub`, `S7 channels`, `S9 events`. ZIP: no.
- **FAST** (UI/microcopy/CSS): profile polish, contacts polish, professional
  section polish, empty/loading states. ZIP: no.
- **WEEKLY AUDIT**: red-team + gates + status-truth + audit ZIP. ZIP: yes.

Each command states: name · goal · scope · prohibitions · gates · expected
output · ZIP yes/no (default no; only WEEKLY AUDIT + explicit FINAL).

## 7. Priorities

- **P0 (foundation):** S1 transport+DB, professions import pipeline (done as
  contract), PII/boundary guards (done).
- **P1 (usable MVP):** S2 professions data, S3 profile product, S4 friend feed.
- **P2 (beta):** S5 communities, S6 public hub, S4 comments/reactions, people
  search.
- **P3 (later):** S7 channels, S8 chat/newsletter, S9 events/integrations,
  S10 full infra, monetization.

## 8. Data needed from owner

- Full professions + specializations dataset (S2).
- Default profile field visibility (public vs friend) (S3).
- Community taxonomy / roles model (S5).

## 9. Decisions needed from owner

- Supabase project + Railway staging go-ahead (S1/S10).
- Whether monetization/Stripe is in scope (currently OUT).
- Channels vs communities ownership model confirmation (S7).

## 10. What we are NOT doing now

communities, chat, events, modules, channels, Public Hub, full friend feed,
posts/comments/reactions, production DB writes, production storage, db push,
Railway deploy, Stripe, global feed, Playwright.

## 11. Next 3 recommended commands (after the full audit ZIP)

1. **DEEP — S1 Transport + persistence adapters** (identity/media/social/contacts
   DB repos behind existing ports + HTTP adapter; no behaviour change, full
   gates). Unblocks everything.
2. **STANDARD — S2 Professions data import** (run the owner's dataset through the
   dry-run validator, then idempotent import; enable selection UI).
3. **STANDARD — S3 Profile product** (public/manage profile + embed
   `ProfileContactCard`; visibility matrix tests).
