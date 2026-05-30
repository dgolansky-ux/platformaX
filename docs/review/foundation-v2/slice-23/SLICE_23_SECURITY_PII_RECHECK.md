# SLICE 23 — Security / PII recheck

> **Date:** 2026-05-30
> **Method:** Static grep + guard suite + gitleaks scan over the post-
> Slice 22A working tree plus all Slice 23 edits.
> **Result:** **PASS** — no P0 PII leak, no new injection-class risk, no
> secrets in repo / logs / ZIP.

## 1. Guard / scanner results

| Tool | Result | Detail |
| --- | --- | --- |
| `pnpm secrets:gitleaks` | **PASS** | 131 commits scanned, ~7 MB, no leaks. |
| `pnpm rules:check` (incl. `check-secret-scan.mjs`, `check-local-secret-scan.mjs`, `check-public-dto-pii.mjs`, `check-logging-pii-security.mjs`) | **PASS** | All 43 sub-guards PASS. |
| `pnpm arch:check:v2` (incl. `check-public-dto-pii.mjs`) | **PASS** | 9/9 sub-guards PASS. |
| `pnpm guards:all-local` | **PASS** | 24/25 (item 19 external branch protection — unchanged from Slice 22). |
| `pnpm check` (tsc) | **PASS** | 0 errors. |
| `pnpm depcruise:check` | **PASS** | 0 errors (44 orphan warnings classified). |

## 2. PII surface re-inspected

| Risk vector | Status | Evidence |
| --- | --- | --- |
| Public DTO carries `email` | **CLEAN** | `manage-dashboard-sections.ts` uses `accountEmailMasked: string \| null` + `fieldsAvailable: readonly ("email" \| "phone")[]` as enum literals only. No raw email in public payload. |
| Public DTO carries `phone` | **CLEAN** | Phone digits never appear in `shared/contracts/**` DTOs. The same enum-literal pattern as email. |
| Public DTO carries `dateOfBirth` | **CLEAN** | `check-dto-privacy-classification.mjs` PASS — no DTO exposes `dateOfBirth`. Profile test (`ProfilePage.test.tsx:249`) asserts the public render contains no "dateofbirth" or "data urodzenia". |
| Public DTO carries raw private profile records | **CLEAN** | Identity public mapper test (`identity/__tests__/public-mapper-no-pii.test.ts`) PASS. |
| Public DTO carries private media URLs | **CLEAN** | `media/__tests__/public-mapper-no-leak.test.ts` PASS. |
| Notification DTOs expose email/phone | **CLEAN** | `notifications-v2/contracts.ts` DTOs reference `ActorRef` / `SourceRef` only (typed IDs, no contact fields). |
| Workplace teaser exposes contact PII | **CLEAN** | Workplace public DTO carries display name + role only; tests assert no email/phone leak. |
| Moderation reports leak private contact data | **CLEAN** | `moderation/policy.ts` `canViewOwnReportStatus` controls visibility; no contact-field exposure in public report DTO. |
| Friendship implies contact access | **CLEAN — separation enforced** | `social/social-contacts-service` keeps contact consents independent of friendship; tests assert each transition. |
| Contact approval implies friendship | **CLEAN — separation enforced** | Same as above; approving a contact-access request does NOT add a friendship row. |

## 3. Web-layer risks re-checked

| Risk | Status | Notes |
| --- | --- | --- |
| `dangerouslySetInnerHTML` | **CLEAN** | 0 production uses; only mentioned in security tests as forbidden. |
| `javascript:` URL handling | **CLEAN** | Workplace adapter explicitly rejects `javascript:` (`mock-adapter.ts:261` validation), test asserts rejection. PublicHubView test asserts no `href` ever starts with `javascript:`. |
| `readAsDataURL` / `base64 upload` / `FileReader` | **CLEAN** | `check-media-base64.mjs` PASS; profile test enforces it for `client/src/app-v2/profile/**`. |
| `localStorage` / `sessionStorage` as backend | **CLEAN** | `no-storage.test.ts` files in identity/profile and media domains enforce the prohibition. Profile-runtime test asserts the rule for the profile subtree. |
| Secrets in docs / logs / ZIP | **CLEAN** | Slice 23 ZIP script (next section) excludes `.env`, `.env.*`, `secrets/`, `.claude/`. `pnpm secrets:gitleaks` PASS. |
| Service-role key in frontend | **CLEAN** | Frontend imports only `@supabase/supabase-js` (anon key path); no `service_role` reference. |

## 4. Slice 23 edits — incremental security review

Each Slice 23 file edit was reviewed for new attack surface:

| Edit | Reviewed | Verdict |
| --- | --- | --- |
| `client/src/app-v2/profile/ProfilePage.tsx` migrated to `AppShell` | yes | No new prop forwarding, no new fetch. Owner / viewer guard preserved (`editEnabled` boolean unchanged). |
| `client/src/app-v2/profile/styles/profile-layout.module.css` token rename | yes | CSS-only; no impact on runtime data. |
| Deletion of `client/src/features-v2/communities-v2/CommunitiesList.tsx` | yes | Orphan removal; nothing else to review. |
| `client/src/app-v2/profile/sections/ProfileStatusBar.tsx` (removed `ProfileStatusBar` wrapper) | yes | Behavior preserved via `ProfileCivilCard` + `ProfileStatusRow`; no data path changes. |
| `client/src/features-v2/identity/auth/auth-adapter.ts` (auth-error message wording) | yes | Polish-language reword; no logic / no secret in message. |
| `playwright.config.ts`, `tests/visual-v2/app-v2-screenshots.spec.ts` | yes | Test-only; no production import; runs locally / CI. |
| `package.json` (`@playwright/test` devDependency, `screenshots:v2` script) | yes | Verified via `pnpm secrets:gitleaks` PASS post-add. |

## 5. Remaining items (not P0)

- **P2**: Once a real Supabase Auth transport is wired, redo this
  recheck against the live SQL adapter to confirm:
  - No service-role key bleeds into the frontend bundle.
  - No private profile field is selected by an unintended `select(*)`.
- **P2**: Add `axe-core` or an a11y guard if budget allows (currently
  out of scope).

## 6. Result

**PASS, no P0.**

— End of Slice 23 security / PII recheck.
