# app-v2 — Application Shell

Status: `UI_SHELL_ONLY`

## Purpose

Composition layer for the V2 frontend. Owns top-level routing, public marketing surface (landing page), public auth/onboarding UI shells, and shell composition. Does NOT own any domain data.

## Constraints

- May compose feature domains via their public APIs only
- Must NOT import from any feature domain's internal modules
- Must NOT import legacy code (features/, pages/, components/)
- Must NOT introduce removed product areas (marketplace, calendar, tasks, etc.)
- Must NOT own tables, repositories, or domain entities
- Must NOT call Supabase, Railway, any backend API, or perform real authentication
- Must NOT persist PII in `localStorage` / `sessionStorage`

## Contents

| Area | Purpose | Status |
|---|---|---|
| `AppRouter.tsx` | Top-level route composition (react-router-dom) | `UI_SHELL_ONLY` |
| `landing/` | Public landing page | `UI_SHELL_ONLY` |
| `auth/` | Public auth UI shell — login, register, reset, check-email | `UI_SHELL_ONLY` / `BACKEND_NOT_STARTED` |
| `onboarding/` | Registration onboarding flow (multi-step) | `UI_SHELL_ONLY` / `MOCK_LOCAL_ONLY` |

## Landing page

Public marketing surface served at `/`. Domain-free, no API calls. The `Zaloguj się` / `Załóż konto` CTAs in the header, hero and final CTA now navigate to the in-app `/login` and `/register` routes.

## Auth shell (`auth/`)

All four screens (`/login`, `/register`, `/reset-password`, `/check-email`) are pure UI shell:

- forms keep state with React `useState` only,
- validation runs in local state (`auth/forms/validation.ts`) without backend round-trip,
- submit on `/login` opens an honest `FormNotice` ("Logowanie nie jest jeszcze dostępne…") instead of a fake session,
- `/register` submit navigates to `/check-email?email=…` (no email is actually sent),
- `/reset-password` submit renders a UI shell "wiadomość przygotowana" state,
- `/check-email` shows an honest "UI shell — backend nie jest podłączony" notice and links to `/onboarding`.

No `localStorage`, no `sessionStorage`, no Supabase, no Railway, no tRPC.

## Onboarding shell (`onboarding/`)

Five steps in local React state, no persistence:

1. Imię + Nazwisko
2. Data urodzenia (private — explicit privacy hint, not stored anywhere)
3. Numer telefonu + checkbox potwierdzenia (private — not stored anywhere)
4. Avatar (UI-only; honest "po podłączeniu modułu mediów" message, "Pomiń" link)
5. Kierunek profilu (4 radio tiles)

PII (date of birth, phone) lives only in the component's `useState`. The post-flow summary explicitly omits PII fields and shows a note that no data was sent or stored.
