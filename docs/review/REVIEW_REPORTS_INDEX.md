# Review Reports Index

Last updated: 2026-05-30 (Slice 23)

## Allowed statuses

- `ACTIVE_EVIDENCE` — current, valid evidence for BRAMKA gate
- `HISTORICAL_REPORT` — completed step, superseded by later audit
- `SUPERSEDED` — explicitly replaced by a newer report
- `OUTDATED_BY_NEW_AUDIT` — content outdated after re-audit
- `BLOCKED` — step blocked, requires action
- `MANUAL_REVIEW_REQUIRED` — needs human verification

## Index

| Report | Scope | Commit | Date | Current? | Status | Superseded by | Notes |
|---|---|---|---|---|---|---|---|
| step-02-clean-repo-skeleton | Repo skeleton, initial structure | `a1b2c3` | 2026-05 | No | HISTORICAL_REPORT | step-13 | Initial V2 scaffold |
| step-03-guard-scripts | Guard scripts baseline | `d4e5f6` | 2026-05 | No | HISTORICAL_REPORT | step-11 | First guard layer |
| step-04-local-git-gates | Husky, lint-staged, commitlint | `g7h8i9` | 2026-05 | No | HISTORICAL_REPORT | step-11 | Local git hooks |
| step-05-github-ci | GitHub Actions workflow | `j0k1l2` | 2026-05 | No | SUPERSEDED | step-12-ci-fix | Initial CI setup |
| step-06-branch-protection | Branch protection docs | `m3n4o5` | 2026-05 | No | SUPERSEDED | step-12-github-ci-verification | Pre-public repo |
| step-07-local-bramka-hardening | Local BRAMKA hardening | `460e871` | 2026-05 | No | HISTORICAL_REPORT | step-11 | Gap matrix + fixes |
| step-08-local-bramka-evidence | Evidence bundle creation | `d38f52a` | 2026-05 | No | HISTORICAL_REPORT | step-11 | ZIP bundle + manifest |
| step-09-local-bramka-red-team | Red-team audit of gates | `327f78e` | 2026-05 | No | HISTORICAL_REPORT | step-10 | Found blockers |
| step-10-red-team-fixes | Red-team blocker fixes | `de06c78` | 2026-05 | No | HISTORICAL_REPORT | step-11 | Fixed red-team blockers |
| step-11-final-local-bramka-audit | Final local BRAMKA audit | `3bbac17` | 2026-05 | No | HISTORICAL_REPORT | step-14 | Portable validator, full audit |
| step-12-ci-fix | CI pnpm/shared-ui fix | `6ba4015` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_12_CI_FIX_REPORT.md |
| step-12-github-ci-verification | GitHub CI verification | `7ccf5b2` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_12_REPORT.md |
| step-13-full-domain-baseline | Full V2 domain baseline | `32ae75f` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_13_REPORT.md |
| step-14-domain-boundary-red-team | Domain boundary red-team | `bc40358` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_14_REPORT.md |
| step-16-secret-scanner | Secret scanner gate | `983255f` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_16_REPORT.md |
| step-17-documentation-freshness | Documentation freshness gate | `9842b0e` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_17_REPORT.md |
| step-17a-coding-standards-hardening | Coding standards + agent self-audit hardening | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_17A_REPORT.md |
| step-18-final-bramka-acceptance | Final BRAMKA acceptance 25/25 | `22654b8` | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_18_REPORT.md |
| step-19-public-landing-page | Public landing page UI shell (app-v2) | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_19_REPORT.md |
| step-20-auth-register-onboarding-shell | Auth + register + onboarding UI shell (app-v2) | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_20_REPORT.md |
| step-21-supabase-auth-identity-adapter | Supabase Auth adapter + identity auth integration | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_21_REPORT.md |
| step-22-personal-profile-mobile-shell | Personal profile mobile UI shell (app-v2) | pending | 2026-05 | Yes | MANUAL_REVIEW_REQUIRED | — | Evidence: STEP_22_REPORT.md (visual parity manual review) |
| step-23-personal-profile-desktop-adaptation | Personal profile desktop/tablet adaptation (app-v2) | pending | 2026-05 | Yes | MANUAL_REVIEW_REQUIRED | — | Evidence: STEP_23_REPORT.md (desktop visual parity manual review) |
| step-24-professional-profile-mobile-layer | Professional profile mobile layer — mode of personal profile (app-v2) | pending | 2026-05 | Yes | MANUAL_REVIEW_REQUIRED | — | Evidence: STEP_24_REPORT.md (mobile UI shell, data pending) |
| step-25-professional-profile-desktop-adaptation | Professional profile desktop/tablet adaptation (app-v2) | pending | 2026-05 | Yes | MANUAL_REVIEW_REQUIRED | — | Evidence: STEP_25_REPORT.md (desktop visual parity manual review) |
| step-26-profile-legacy-parity-and-size-guards | Profile legacy parity + CSS/file-size guards (app-v2) | pending | 2026-05 | Yes | MANUAL_REVIEW_REQUIRED | — | Evidence: STEP_26_REPORT.md + PROFILE_PARITY_AUDIT.md |
| step-27-identity-profile-persistence | Identity profile persistence runtime + onboarding wiring | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_27_REPORT.md |
| step-30-architecture-quality-scalability-guards | Architecture quality + scalability guards hardening | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_30_REVIEW.md |
| step-32-media-avatar-banner-runtime | Media avatar/banner upload-intent runtime (in-memory, env-required storage) | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_32_REPORT.md |
| step-33-profile-runtime-wiring | Profile runtime wiring — identity + media refs composition for `/profile` | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_33_REPORT.md |
| step-29-profile-full-parity-quality-fixes | Profile parity & code quality hygiene — status truth, no-op CTA, CheckEmail copy | pending | 2026-05 | Yes | MANUAL_REVIEW_REQUIRED | — | Evidence: STEP_29_REPORT.md + PROFILE_PARITY_AUDIT.md |
| step-34-governance-foundation-pack | Governance foundation: canonical rules registry, guard coverage, status taxonomy | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_34_REPORT.md |
| step-35-governance-red-team | Red-team audit: permissions hardening, status conflict resolution, guard hardening | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_35_REPORT.md |
| step-36-production-grade-governance-hardening | Production-grade governance hardening: 9 new gates, 17 new rules | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_36_REPORT.md |
| step-37-governance-deduplication-and-anti-drift | Governance deduplication: hidden rules audit, anti-drift guard, README standardization | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_37_REPORT.md |
| step-38-final-governance-acceptance | Final governance acceptance audit: 20-point matrix, gate results, PR readiness | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_38_REPORT.md |
| step-42-profile-premium-visual-maturity | Profile premium visual maturity pass — avatar size locked | pending | 2026-05 | Yes | MANUAL_REVIEW_REQUIRED | — | Evidence: STEP_42_SUMMARY.md |
| step-43-profile-top-header-premium-polish | Profile top header premium polish — avatar size locked | pending | 2026-05 | Yes | MANUAL_REVIEW_REQUIRED | — | Evidence: STEP_43_SUMMARY.md |
| step-44-top-profile-composition-rebuild-premium | Top profile hero composition rebuild — avatar size locked | pending | 2026-05 | Yes | MANUAL_REVIEW_REQUIRED | — | Evidence: STEP_44_SUMMARY.md |
| step-45-profile-legacy-visual-direction-pass | Profile visual direction aligned with legacy mobile reference | pending | 2026-05 | Yes | MANUAL_REVIEW_REQUIRED | — | Evidence: STEP_45_SUMMARY.md |
| step-46-profile-runtime-identity-media-onboarding | Profile runtime vertical slice — application-v2/profile boundary composing identity + media; media verifyProfileAssetForAttach; frontend adapter migrated to view DTOs | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_46_SUMMARY.md (status: SERVER_READY_NOT_FULLY_HTTP_WIRED) |
| step-47-personal-profile-core-runtime | Personal profile core runtime in identity — status, socialLinks, civilStatus, location, slug; visibility-aware public mapper; statusPhoto media purpose; forward-additive migration 0003 | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_47_SUMMARY.md (status: SERVER_READY_NOT_FULLY_WIRED) |
| step-49-governance-backend-architecture-invariants | Governance: backend architecture invariants (owner/viewer/visibility/DTO privacy/media ownership/limits/outbox/idempotency/status truth) | pending | 2026-05-27 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_49_SUMMARY.md |
| step-49-governance-runtime-invariants-reconciliation | Governance: runtime invariants reconciliation (application use-cases, envelope+outbox, read-model ownership, cursor/idempotency/policy invariants) | pending | 2026-05-27 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_49_SUMMARY.md |
| communities-mvp-product-slice | Communities MVP: domains + application use-cases + Profile/Manage/Modules/Channels/Hub UI shells | pending | 2026-05-29 | Yes | ACTIVE_EVIDENCE | — | Evidence: communities-mvp-product-slice/REPORT.md |
| communities-v2-slice-1-list-and-create | Slice 1: legacy-parity list (cards/search/categories) + 4-step CreateCommunityWizard | pending | 2026-05-29 | Yes | ACTIVE_EVIDENCE | — | Evidence: communities-v2/SLICE_1_LIST_AND_CREATE_REPORT.md + LEGACY_COMMUNITIES_SLICE_1_UI_MAP.md |
| channels-v2-slice-8-content-feed | Slice 8: channel feed + lead publishing + pinned post | pending | 2026-05-29 | Yes | ACTIVE_EVIDENCE | — | Evidence: channels-v2/CHANNELS_SLICE_8_CONTENT_FEED_REPORT.md + LEGACY_RINGPOST_CHANNEL_CONTENT_UI_MAP.md |
| social-v2-slice-19-friends-consents | Slice 19: friendship + contact consent + blocking foundations (social/contact/profile/feed integration) | pending | 2026-05-30 | Yes | ACTIVE_EVIDENCE | — | Evidence: social-v2/SOCIAL_SLICE_19_FRIENDS_CONTACT_CONSENTS_REPORT.md |
| moderation-v2-slice-20-reports-foundation | Slice 20: moderation domain + report dialog + moderator queue + Post Display Kit integration | pending | 2026-05-30 | Yes | ACTIVE_EVIDENCE | — | Evidence: moderation-v2/MODERATION_SLICE_20_REPORTS_FOUNDATION_REPORT.md |
| ui-v2-slice-20b-21-global-cards-and-composer | Slice 20B-21: top-tier sidebar + composer trigger/modal foundation + feed cards polish | pending | 2026-05-30 | Yes | ACTIVE_EVIDENCE | — | Evidence: ui-v2/UI_POLISH_SLICE_20B_21_GLOBAL_CARDS_AND_COMPOSER_REPORT.md |
| ui-v2-slice-20b-fix-top-tier-redesign | Slice 20B-FIX: top-tier visual redesign (sidebar, nav, communities cards) | pending | 2026-05-30 | Yes | ACTIVE_EVIDENCE | — | Evidence: ui-v2/UI_POLISH_SLICE_20B_FIX_TOP_TIER_REDESIGN_REPORT.md |
| manage-v2-slice-21-account-privacy-settings-center | Slice 21: central manage dashboard (13 sections), privacy/contact/notifications editors, mock orchestrator | pending | 2026-05-30 | Yes | ACTIVE_EVIDENCE | — | Evidence: manage-v2/MANAGE_SLICE_21_ACCOUNT_PRIVACY_SETTINGS_CENTER_REPORT.md |
| global-audit-v2-slice-20c | Slice 20C: pre-ZIP global audit (architecture, features, dead code, security, UI, gates) | pending | 2026-05-30 | Yes | ACTIVE_EVIDENCE | — | Evidence: global-audit-v2/slice-20c/SLICE_20C_EXECUTIVE_SUMMARY.md |
| stabilization-v2-slice-22a | Slice 22A: P1 stabilization (AppShell consolidation, route-aware FAB, status truth, code-splitting, dead-code prune) | pending | 2026-05-30 | Yes | ACTIVE_EVIDENCE | — | Evidence: stabilization-v2/slice-22a/SLICE_22A_STABILIZATION_REPORT.md |
| slice-22-audit-package | Slice 22 full-source audit ZIP package (git state, gate results, validation) | pending | 2026-05-30 | Yes | ACTIVE_EVIDENCE | — | Evidence: slice-22-audit-package/SLICE_22_ZIP_GENERATION_REPORT.md |
| foundation-v2-slice-23 | Slice 23: foundation hardening — ProfilePage → AppShell, screenshot tooling, status truth, knip cleanup, audit ZIP | pending | 2026-05-30 | Yes | ACTIVE_EVIDENCE | — | Evidence: foundation-v2/slice-23/SLICE_23_FOUNDATION_HARDENING_REPORT.md |
| visual-v2-slice-23 | Slice 23 visual evidence — Playwright screenshots for 8 routes × desktop + mobile | pending | 2026-05-30 | Yes | ACTIVE_EVIDENCE | — | Evidence: visual-v2/slice-23/SLICE_23_VISUAL_SCREENSHOT_REPORT.md |
