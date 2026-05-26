# app-v2 — Application Shell

Status: `PARTIAL` — auth + profile + onboarding compose real identity and media adapters (in-memory boundary, env-required storage); landing remains `UI_SHELL_ONLY`.

## Purpose

Composition layer for the V2 frontend. Owns top-level routing, public marketing surface (landing page), public auth/onboarding UI shells, the personal+professional profile mobile shell, and the floating navigation bar. Does NOT own any domain data.

## Constraints

- May compose feature domains via their public APIs only
- Must NOT import from any feature domain's internal modules
- Must NOT import legacy code (features/, pages/, components/)
- Must NOT introduce removed product areas (marketplace, calendar, tasks, etc.)
- Must NOT own tables, repositories, or domain entities
- Must NOT persist PII in `localStorage` / `sessionStorage`
- The professional profile is a MODE of the personal profile (`identity`), not a separate `professional-profile` domain

## Contents

| Area | Purpose | Status |
|---|---|---|
| `AppRouter.tsx` | Top-level route composition (react-router-dom) | `UI_SHELL_ONLY` |
| `landing/` | Public landing page | `UI_SHELL_ONLY` |
| `auth/` | Public auth UI shell + Supabase Auth adapter integration (`/login` and `/register` submit through the real adapter; `/check-email` shows configured/not-configured copy honestly) | `PARTIAL` |
| `onboarding/` | Registration onboarding flow (multi-step) — final step writes through the identity `profileAdapter` (in-memory, `isPersistent: false`) | `PARTIAL` |
| `profile/` | Personal profile mobile shell + professional layer + quick feed preview; runtime composed via `useProfileData` (auth + identity + media URLs) | `PARTIAL` / `MOCK_LOCAL_ONLY` (contacts/feed) / `MANUAL_REVIEW_REQUIRED` (visual parity) |
| `navigation/` | Floating bottom navigation (glassmorphism pill, central Home + Profil island) | `UI_SHELL_ONLY` |

## Landing page

Public marketing surface served at `/`. Domain-free, no API calls. The `Zaloguj się` / `Załóż konto` CTAs in the header, hero and final CTA navigate to the in-app `/login` and `/register` routes.

## Auth shell (`auth/`)

Four screens (`/login`, `/register`, `/reset-password`, `/check-email`) plus a real Supabase Auth adapter (step-21, `features-v2/identity/auth`):

- forms keep state with React `useState` only,
- validation runs in local state (`auth/forms/validation.ts`) without backend round-trip,
- `/login` submit calls `identityAuthAdapter.signIn` and navigates to `/onboarding` on success (surfaces a safe Polish error message otherwise),
- `/register` submit calls `identityAuthAdapter.signUp` and navigates to `/check-email` on success (no email parameter is passed — confirmation copy is route-scoped),
- `/reset-password` submit triggers the Supabase password-reset flow through the adapter and renders the "wiadomość przygotowana" state,
- `/check-email` reads `adapter.isConfigured()` and renders either "Link aktywacyjny wysłany" (configured) or an explicit `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` not-configured notice — both link to `/onboarding`.

No `localStorage`, no `sessionStorage`, no direct Supabase calls from components — the adapter layer handles that surface.

## Onboarding shell (`onboarding/`)

Five steps in local React state. The final step submits through the identity
`profileAdapter.completeOnboarding` (in-memory boundary, `isPersistent: false`)
so the entered name lands in the same identity service that `/profile` reads
from in the current session; reloading wipes state because the Supabase
repository is not wired yet.

1. Imię + Nazwisko
2. Data urodzenia (private — explicit privacy hint, not stored anywhere)
3. Numer telefonu + checkbox potwierdzenia (private — not stored anywhere)
4. Avatar (UI-only; honest "po podłączeniu modułu mediów" message, "Pomiń" link)
5. Kierunek profilu (4 radio tiles)

PII (date of birth, phone) lives only in the component's `useState` until
`completeOnboarding` is called; from there the identity service holds it
behind its private DTO (never publicly readable). The post-flow summary
explicitly omits PII fields and shows a note that no data was sent to a
remote backend (because the adapter remains in-memory).

## Profile shell (`profile/`)

Personal profile mobile shell with a switchable professional layer (step-22 →
step-26), runtime-wired in step-33. The page reads `useProfileData` which
composes `identityAuthAdapter` (current user), `profileAdapter.getMyProfile`
(identity boundary) and `mediaAdapter.getPublicMediaUrl` (avatar/banner)
into a `PersonalProfileView`. Anonymous viewers render the demo fixture
(no fake auth); empty/error states surface honestly above the shell.

Visual parity with legacy `features/identity/ProfileView*` 1:1 per
`docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md`:

- header order: name → avatar/bio row (with animated separator) → status pill + status photo → mode switcher → banner → social links,
- portal cards (Społeczności / Kanały / Feed znajomych) as disabled-policy CTAs with per-card accent colors,
- contacts carousel with per-tab color scheme and edge-fade mask,
- quick feed preview (`ProfileQuickFeed`): expandable panel, stacked avatars, LIVE pulse, skeleton shimmer, local post-detail sheet — zero feed runtime,
- professional layer: profession block (empty `Dodaj zawód` card), specialists section with orange briefcase icon + visibility switch, activities tabs (Klasyczny / Sieć) with `Moja praca` disabled anchor + `Moduł w budowie` warning card.

CSS is split into six focused modules under `profile/styles/` (`profile-layout`, `profile-header`, `profile-status`, `profile-sections`, `profile-portal`, `profile-feed-preview`, `profile-professional`), each kept below the 360-line CSS module limit enforced by `scripts/check-file-size-limits.mjs`.

The professional profile is a `mode` of the same `ProfilePage`, not a separate route or domain. There is no `professional-profile` folder anywhere.

## Floating navigation (`navigation/`)

`FloatingNav` is an app-shell UI component currently mounted on `/profile`. Glassmorphism pill, central Home + Profil island, scroll hide/show (threshold 10px, only after 60px), slide-up + fade entry, bounce micro-animations, `prefers-reduced-motion` respected. CTAs:

- `/` (Centrum) and `/profile` (Profil) — real routes,
- `Szukaj` — opens a local "Wkrótce" modal,
- `Alerty`, `Chat`, `Kontakty` — disabled-policy with explicit `title`.

No `href="#"`, no no-op buttons, no legacy runtime imports.

## Canonical governance

- [Rules Registry](../../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: none
