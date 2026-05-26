# PROFILE_PARITY_AUDIT — step-29

**Status:** `MANUAL_REVIEW_REQUIRED`

## Source of truth

- Mobile parity blueprint: `docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md`
- Runtime/logic blueprint: `docs/profile/PROFILE_RUNTIME_LOGIC_BLUEPRINT_FROM_LEGACY.md`
- Legacy source folder: `~/Desktop/Starykod-4` — **not mounted on the machine
  that produced this PR**, so a pixel-by-pixel diff cannot be re-run here.

This audit therefore consolidates the parity decisions already made in PR #16
(step-22 → step-26) and the runtime composition added in PR #17 / PR #20 /
PR #22, and lists every area as `MANUAL_REVIEW_REQUIRED` until the owner can
re-mount legacy and verify visually.

## Per-area summary

### Personal profile header (`ProfileHeader` / `ProfileAvatar` / `ProfileBanner`)

- Built in PR #16 per blueprint §6.1: name → avatar+bio row (animated
  separator) → status pill + status photo → mode switcher → banner.
- PR #22 added optional `avatarUrl` / `bannerUrl` pass-through resolved via
  the media boundary; fallback stays at the legacy gradient + initial.
- `VISUAL_DELTA`: parity not re-verified against legacy in this PR. Owner
  should compare on a real device once legacy is mounted again.

### Personal bio (`ProfileBio` / `ProfileBioSheet`)

- Read view from PR #16 (legacy §6.3 bio block).
- Owner edit sheet added in PR #22 (single field, BIO_RUNTIME_PARTIAL).
- Multi-line typewriter / 6×24 char editor (blueprint §9) is intentionally
  deferred — would need a dedicated editor PR.
- `VISUAL_DELTA`: editor is a generic textarea, not the legacy 6-line bio
  editor. Documented; not a fake DONE.

### Status bar (`ProfileStatusBar`)

- Visual shell shipped in PR #16 (pulse + sparkle keyframes).
- step-29 (this PR): status pill is now a disabled-policy button for *all*
  viewers — owners no longer see an enabled button with no handler.
  Honest title points to blueprint §10 (status DTO slice).
- `VISUAL_DELTA`: status photo upload remains disabled until media confirms
  a stored asset.

### Social links (`ProfileSocialLinks`)

- Built in PR #16; renders only when fixture supplies links. Currently no
  identity-side public DTO for social links yet — only fixtures.
- Not changed by this PR.

### Portal cards (`ProfilePortalCards`)

- Built in PR #16 — three disabled-policy CTAs (`Społeczności`, `Kanały`,
  `Feed znajomych`) with per-card accent. Already correct.

### Contacts carousel (`ProfileContacts`)

- Built in PR #16 with tab filtering + per-tab color scheme.
- step-29 (this PR): individual contact cards changed from enabled buttons
  with no handler → disabled-policy with per-contact honest title (social
  runtime not wired). Tab buttons remain enabled real CTAs.
- `VISUAL_DELTA`: requestAnimationFrame auto-scroll engine + duplication
  when ≥4 friends (blueprint §15.3) is deferred to the social runtime PR.

### Quick feed preview (`ProfileQuickFeed`)

- Built in PR #16 per blueprint §16: expandable panel, stacked avatars,
  LIVE pulse, skeleton shimmer, local PostDetailSheet, max-height +
  cubic-bezier animation.
- No feed runtime; reactions/comments are honest disabled placeholders.
- `VISUAL_DELTA`: skeleton timing (350ms stub) vs legacy shimmer not
  re-measured here.

### Personal content sections (`ProfilePersonalSections`)

- Built in PR #16 — `Prezentacja profilu` + `Ważne wydarzenia` empty states
  with disabled `+` add button (honest title).
- No content runtime; counts are wired through view-model from fixture.

### Professional layer (`ProfileProfessionalLayer` / `ProfessionBlock` /
`ProfileSpecialists` / `ProfileProfessionalActivities`)

- Built in PR #16 — visual parity with legacy professional section.
- Mode switcher (`ProfileModeSwitcher`) ensures it is a mode of the
  identity profile, **not a separate `professional-profile` domain**.
- `Moja praca` disabled-policy anchor + `Moduł w budowie` warning card +
  add-activity local sheet with five disabled-policy work types
  (Stanowisko / Organizacja / Projekt / Usługa / Produkt).
- `VISUAL_DELTA`: profession editor (blueprint §13) and activity editors
  (blueprint §14) are later PRs.

### Floating navigation (`navigation/FloatingNav`)

- Built in PR #16 — glassmorphism pill, central Home + Profil island,
  scroll hide/show, slide+fade entry, bounce micro-animation,
  `prefers-reduced-motion`. Real CTAs for `/` and `/profile`, local
  "Wkrótce" modal for Szukaj, disabled-policy for Alerty/Chat/Kontakty.
- Not changed by this PR.
- `VISUAL_DELTA`: legacy slide/bounce timings not re-verified vs
  `Starykod-4`.

### CheckEmail route copy (`app-v2/auth/CheckEmailRoute`)

- step-29 (this PR): replaced "auth backend nie istnieje" wording (stale
  since PR #11) with honest configured/not-configured copy through
  `adapter.isConfigured()`. Configured: "Link aktywacyjny wysłany"; not
  configured: explicit `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` notice.

## Constraints honored in this audit

- Legacy source treated read-only (and currently absent — recorded as a
  limitation, not bypassed).
- No `professional-profile` domain created or referenced.
- No legacy runtime imports introduced.
- No Supabase DB / migrations / Railway touched.
- No `base64` / `dataUrl` / `localStorage` / `sessionStorage` as fake
  backend.
- No `href="#"` / no-op buttons / `window.alert` / `window.confirm`.

## Net VISUAL_DELTA closed by this PR

| Area | Before | After |
|---|---|---|
| `ProfileContacts` contact cards | enabled button, no handler (silent no-op) | disabled-policy with honest per-contact title |
| `ProfileStatusBar` owner status pill | enabled button, no handler (silent no-op) | disabled-policy with honest hint pointing at blueprint §10 |
| `CheckEmailRoute` copy | "auth backend nie istnieje" (stale since PR #11) | configured / not-configured copy via `adapter.isConfigured()` |
| `identity` registry | `SCAFFOLD_ONLY` / `hasDomainLogic: false` (stale) | `PARTIAL` / `hasDomainLogic: true` (matches README and runtime) |
| `app-v2/README.md`, `identity/README.md` | pre-PR #22 wording | refreshed to describe wired runtime + bio edit slice |

## Open items intentionally left for later PRs

- Multi-line 6×24 bio editor (blueprint §9).
- Status DTO + emoji/availability/visibility editor (blueprint §10).
- Profession & specialization editor + reference data (blueprint §13).
- Workplace + professional activities editors (blueprint §14).
- Social runtime (friends/relationship graph) for the contacts carousel.
- Content-v2 runtime for quick feed preview + reactions/comments.
- Live media upload (currently env-required storage).
- Pixel-level legacy re-verification when `~/Desktop/Starykod-4` is
  mounted again.
