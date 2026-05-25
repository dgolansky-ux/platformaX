# app-v2 — Application Shell

Status: `UI_SHELL_ONLY` (+ `PARTIAL` for auth, see below)

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
| `auth/` | Public auth UI shell + Supabase Auth adapter integration | `PARTIAL` (UI shell + adapter; backend gating not exposed yet) |
| `onboarding/` | Registration onboarding flow (multi-step) | `UI_SHELL_ONLY` / `MOCK_LOCAL_ONLY` |
| `profile/` | Personal profile mobile shell + professional layer + quick feed preview | `UI_SHELL_ONLY` / `MOCK_LOCAL_ONLY` / `MANUAL_REVIEW_REQUIRED` |
| `navigation/` | Floating bottom navigation (glassmorphism pill, central Home + Profil island) | `UI_SHELL_ONLY` |

## Landing page

Public marketing surface served at `/`. Domain-free, no API calls. The `Zaloguj się` / `Załóż konto` CTAs in the header, hero and final CTA navigate to the in-app `/login` and `/register` routes.

## Auth shell (`auth/`)

Four screens (`/login`, `/register`, `/reset-password`, `/check-email`) plus a real Supabase Auth adapter (step-21, `features-v2/identity/auth`):

- forms keep state with React `useState` only,
- validation runs in local state (`auth/forms/validation.ts`) without backend round-trip,
- `/login` submit currently renders a `FormNotice` ("Logowanie nie jest jeszcze dostępne…") — the Supabase Auth adapter exists but the gating UI is not wired yet,
- `/register` submit navigates to `/check-email` (no email parameter is passed — confirmation copy is route-scoped),
- `/reset-password` submit renders a UI shell "wiadomość przygotowana" state,
- `/check-email` shows an honest "UI shell — backend nie jest podłączony" notice and links to `/onboarding`.

No `localStorage`, no `sessionStorage`, no direct Supabase calls from components — the adapter layer handles that surface.

## Onboarding shell (`onboarding/`)

Five steps in local React state, no persistence:

1. Imię + Nazwisko
2. Data urodzenia (private — explicit privacy hint, not stored anywhere)
3. Numer telefonu + checkbox potwierdzenia (private — not stored anywhere)
4. Avatar (UI-only; honest "po podłączeniu modułu mediów" message, "Pomiń" link)
5. Kierunek profilu (4 radio tiles)

PII (date of birth, phone) lives only in the component's `useState`. The post-flow summary explicitly omits PII fields and shows a note that no data was sent or stored.

## Profile shell (`profile/`)

Personal profile mobile shell with a switchable professional layer (step-22 → step-26). Visual parity with legacy `features/identity/ProfileView*` 1:1 per `docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md`:

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
