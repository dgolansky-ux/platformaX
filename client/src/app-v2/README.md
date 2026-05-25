# app-v2 — Application Shell

Status: `UI_SHELL_ONLY`

## Purpose

Composition layer for the V2 frontend. Owns top-level routing, public marketing surface (landing page) and shell composition. Does NOT own any domain data.

## Constraints

- May compose feature domains via their public APIs only
- Must NOT import from any feature domain's internal modules
- Must NOT import legacy code (features/, pages/, components/)
- Must NOT introduce removed product areas (marketplace, calendar, tasks, etc.)
- Must NOT own tables, repositories, or domain entities

## Contents

| Area | Purpose | Status |
|---|---|---|
| `landing/` | Public landing page (marketing surface) | `UI_SHELL_ONLY` |

## Landing page

The landing page is the public marketing surface served at the root route. It is intentionally domain-free: it does not call any feature domain, does not load user data, and does not perform authenticated actions.

Auth-related CTAs (`Zaloguj się`, `Załóż konto`) are explicit placeholders — they render as anchor links with `href="#"` until the corresponding identity flow is wired. Each placeholder is commented at the call site.
