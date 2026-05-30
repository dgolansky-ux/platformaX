# SLICE 23 — UI truth cleanup report

> **Date:** 2026-05-30
> **Scope:** Re-scan of `client/src/**` for user-facing debug / mock /
> placeholder language after Slice 22A removed the obvious offenders.
> **Result:** **PASS** with one residual fix applied in this slice.

## 1. Search matrix

Each pattern was matched with `--ignore-case` against `client/src/**`.
Matches were classified as:
- ✅ JSDoc / comment / README (developer-only, no user impact)
- ✅ Test fixture (`makeFakeAuthAdapter`, etc. — established naming
  convention, not user-visible)
- ✅ HTML `placeholder` attribute (standard input hint text, not the
  forbidden "placeholder UI" concept)
- ⚠️ User-visible string requiring action

| Pattern | User-visible matches | Notes |
| --- | --- | --- |
| `MOCK_LOCAL_ONLY` | 0 | All occurrences in JSDoc / READMEs / feature-registry / mock-adapter file headers. |
| `BACKEND_PARTIAL` | 0 | Only in registry / feature-registry comment. |
| `UI_SHELL_ONLY` | 0 | Only in README / registry comments. |
| `SCAFFOLD_ONLY` | 0 | Only in README / registry comments. |
| `TODO` / `FIXME` | 0 (production code) | Scripts contain TODOs in their own self-doc, out of product UI scope. |
| `Wkrótce` / `wkrótce` | **1 found, 1 fixed** (see §2) | All other matches are JSDoc / tests / FloatingNav comment. |
| `coming soon` | 0 | — |
| `fake` | 0 user-visible | Only `makeFakeAuthAdapter` / `fakeAuth` test helpers (established convention). |
| `placeholder` | 0 user-visible | Only HTML `placeholder` attributes (standard hint text) and CSS `.input::placeholder`. |
| `demo-only` | 0 | — |

## 2. Action taken

`client/src/features-v2/identity/auth/auth-adapter.ts:17` previously
returned the user-facing error
`"Logowanie nie jest jeszcze skonfigurowane. Backend tożsamości
zostanie podłączony wkrótce."` when the Supabase Auth backend is not
configured. Slice 23 rewords it to
`"Logowanie nie jest jeszcze skonfigurowane. Backend tożsamości nie
jest jeszcze dostępny."` — same factual message, no implied promise of
"soon".

- File edited: `client/src/features-v2/identity/auth/auth-adapter.ts`.
- Diff: `Backend tożsamości zostanie podłączony wkrótce.` →
  `Backend tożsamości nie jest jeszcze dostępny.`
- No test asserts on the old string (verified by grep).

## 3. Residual `Wkrótce` mentions (all internal, no user impact)

These remain — they describe the historical state and are not rendered
to a user:

| File | Why kept |
| --- | --- |
| `client/src/app-v2/README.md:94` | Developer doc; describes the prior `Szukaj` modal that Slice 22A removed. |
| `client/src/app-v2/navigation/__tests__/FloatingNav.test.tsx:99,107,109` | Tests asserting the **absence** of "Wkrótce" modal — required guardrail. |
| `client/src/app-v2/manage/ManageSectionRoute.tsx:3` | JSDoc explaining what the route originally was. |
| `client/src/app-v2/navigation/DesktopSidebar.tsx:7` | JSDoc on a disabled-state convention. |
| `client/src/app-v2/navigation/FloatingNav.tsx:11` | JSDoc explaining the FAB no longer shows a Wkrótce modal. |
| `client/src/app-v2/navigation/floating-nav.module.css:7` | CSS module comment. |
| `client/src/app-v2/profile/sections/ProfilePortalCards.tsx:94` | JSDoc explaining disabled-policy convention. |

All seven mentions are JSDoc / comments / test guardrails. None render
to a user.

## 4. Confirmation

- No fake CTA exists.
- No "Wkrótce" string is rendered as a primary action.
- No no-op buttons remain in the captured visual evidence (see
  `docs/review/visual-v2/slice-23/screenshots/`).
- All disabled affordances either show "niedostępne" or "funkcja w
  przygotowaniu" tooltips (clean factual labels), never "Wkrótce".

## 5. Internal docs / READMEs / feature-registry

These intentionally keep technical statuses (`MOCK_LOCAL_ONLY`,
`PARTIAL_RUNTIME`, etc.). They are not user-facing; an external
auditor reading them is exactly the intended audience.

## 6. Result

**PASS** — product UI carries no user-facing debug / "wkrótce" /
"coming soon" / "placeholder" labels after the Slice 23 auth-adapter
fix. The seven residual mentions are all JSDoc / tests / READMEs and
do not reach the rendered output.

— End of Slice 23 UI truth cleanup report.
