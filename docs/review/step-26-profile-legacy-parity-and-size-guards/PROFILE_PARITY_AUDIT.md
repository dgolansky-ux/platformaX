# Profile Legacy Parity Audit — Step 26

Status: `MANUAL_REVIEW_REQUIRED`
Source material: `~/Desktop/Starykod-4-readonly/PlatformaX/client/src/features/...` (read-only, never imported)
Blueprint: `docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md` (§4, §6, §10, §13, §14, §15, §21–§23, §32, §33)

## 1. Legacy files reviewed

| Legacy file | Used for V2 component |
|---|---|
| `features/identity/pages/ProfileView.tsx` | section order, mode switch state, preview menu wiring |
| `features/identity/components/ProfileHeader.tsx` | header order (name → avatar+bio row → status → switcher → banner) |
| `features/identity/components/ProfileHeaderAvatar.tsx` | 144x144 avatar, white outer pad + gradient ring + #EFF6FF inner, eye button colors |
| `features/identity/components/ProfileHeaderStatusBar.tsx` | status pill (67×67 photo), availability dropdown reference, ph-* keyframes |
| `features/identity/components/ProfileTopRow.tsx` | three portal cards, mode switcher, friends section + quick feed placement |
| `features/identity/components/ProfileTopRowCards.tsx` | portal card layout, accent color tinting, online dot + label, slide-in stagger |
| `features/identity/components/FriendsSection.tsx` | contacts header (icon + Sora title + search pill), per-tab color scheme, full-bleed carousel |
| `features/identity/components/FriendsSection.FriendCard.tsx` | friend card sizing (67/61), online dot, name typography |
| `features/identity/components/QuickFeedPreview.tsx` | toggle width/padding, stacked avatars, LIVE pulse, skeleton shimmer |
| `features/identity/components/ProfessionBlock.tsx` | profession block sizing/colors (read-only reference; V2 ships empty state only) |
| `features/identity/pages/ProfileSpecialists.tsx` | orange briefcase icon, 40×22 visibility switch, empty inline copy |
| `features/identity/pages/ProfileProfessionalSection.tsx` | "Moja praca" disabled anchor, "Moduł w budowie" warning card, work-type sheet |
| `features/_shared/components/BottomNav.tsx` | floating pill geometry, scroll hide/show, mounted-fade entry |
| `features/_shared/components/BottomNavButtons.tsx` + `.NavBtn.tsx` + `.MapNavBtn.tsx` | island center (Home + Profil), active state, badge |
| `features/_shared/components/FloatingBackButton.tsx` | reviewed — not ported in this step (no use-case yet on `/profile`) |
| `features/social/components/StatusTicker.tsx` | reviewed — runtime-dependent (statuses query); V2 profile shell exposes the status pill UI only, no global ticker yet |

Reviewed but intentionally **not** ported in this step (would require runtime
not yet available, or sit outside profile scope):

- `ProfileBioEditor.tsx` typewriter / 6-line edit grid (no edit runtime),
- `ProfilePostsSection.tsx` / `ProfileTimeline.tsx` cards (no content runtime),
- `StatusModal.tsx` / `StatusPhotoModal.tsx` (no upload runtime, base64 forbidden),
- `ImageCropEditor.tsx` (media domain not connected),
- `PublicProfile*.tsx` (separate audit when public hub is wired).

## 2. What was found vs what V2 shipped before step-26

| Element | Legacy | V2 before step-26 | V2 after step-26 |
|---|---|---|---|
| Avatar size | 144×144 w/ white pad → gradient ring → #EFF6FF inner | 120×120, solid `#eef2ff` inner | **144×144 with `avatarWrap`/`avatar`/`avatarRing`/`avatarInner` and the legacy 1.1s shadow transition** |
| Header separator | gradient + 0.45 opacity + drop+pulse animations + soft shadow | flat 1px gradient, no anim | **Drop + pulse animations, soft shadow, opacity 0.45** |
| Bio label | `font-bold` (700) uppercase | `font-weight: 500` | **`font-weight: 700`** |
| Status pill (set) | blue-50 bg, blue-200 1.5px border, ph-dot animated gradient dot, emoji + state/desc rows, edit pencil, friends icon | minimal pill with single state line | **Two-row pill, ph-dot animated dot, emoji, edit pencil, friends-only chip** |
| Status pill (empty) | slate-50 bg, sparkle ✶ with ph-sparkle animation | static pill with ✶ | **ph-sparkle animation + slate-50 bg** |
| Status photo | 67×67 violet dashed empty / glow when set | 56×56 dashed | **67×67 with violet dashed ring + idle pulse** |
| Mode switcher | 200px wide pill, `flex-1` buttons, scale 1.02 active, 0 3px 12px primary shadow | right-aligned, intrinsic width | **200px pill, flex-1 buttons, active scale 1.02 + shadow** |
| Portal cards | per-card accent (Społeczności blue / Kanały violet+featured / Feed pink), tinted icon bg + 1.5px tinted border + 18% shadow, soft radial gradient bg, online dot + "open" label, slide-in stagger | flat dark icon, no accent, no radial, no online dot | **Accent CSS variable per card, radial gradient `::before`, tinted icon, online dot + "wkrótce" label, 0/80/160 ms slide-in stagger** |
| Contacts header | gradient blue icon 28×28 + Sora bold title + search pill (max 140 / min 90) | `<h2>Kontakty</h2>` only | **Icon + Sora title + search pill** |
| Contacts tabs | per-tab color (#2563EB / #7C3AED / #EC4899 / #8B5CF6) on active border/bg, count pill tinted | one shared blue active style | **Per-tab inline accent on border/bg/count pill** |
| Carousel | full-bleed (`w-[calc(100%+40px)] ml-[-20px]`), gap-24, gray top border | section-padded, gap 6 | **Full-bleed margin `-16px`, gap 24, edge-fade mask preserved** |
| Quick feed toggle | full-bleed wrapper (`w-[calc(100%+40px)] -mx-5`) + `width calc(100% - 32px); margin-inline: 16px` | full width inside section padding | **`wrapper { margin: 0 -16px }` + `toggle { width: calc(100% - 32px); margin: 0 16px }`** |
| Specialists header | orange briefcase icon 32×32 + title + "{n} osób" + 40×22 visibility switch | single button "Widoczne"/"Ukryte" | **Orange icon, title + subtitle, real 40×22 switch with sliding knob** |
| Professional Klasyczny | "+ Moja praca" disabled placeholder + amber "Moduł w budowie" warning card | only activity tabs and add sheet | **Disabled "Moja praca" anchor + amber warning card + empty state preserved** |
| Social links | 48×48, `rounded-xl` | 44×44, `rounded-md` | **48×48, `rounded-lg`** |
| Banner | mobile 5/2, desktop 10/3, soft blue shadow | 5/2 mobile, 10/3 desktop, no shadow | **5/2 mobile, 10/3 desktop, `0 6px 24px rgba(15,60,201,0.18)` shadow** |
| Eye-preview button | active = primary, idle = `rgba(30,79,216,0.75)`, 2px white-on-color shadow | always primary, no variant | **Active vs idle variant, soft shadow** |
| Floating nav | glassmorphism pill, scroll hide/show, central Home+Profil island, bounce entry, prefers-reduced-motion | identical (shipped pre-step-26) | **No changes — kept as-is; only test coverage added** |

## 3. Keyframes restored (legacy → V2)

| Keyframe | Legacy use | V2 module |
|---|---|---|
| `px-divider-drop`, `px-divider-pulse` | header separator | `profile-header.module.css` |
| `px-dropdown-in` | preview menu | `profile-header.module.css` |
| `ph-dot`, `ph-sparkle` | status pill | `profile-status.module.css` |
| `status-photo-idle` | empty status photo | `profile-status.module.css` |
| `px-hint-fade` | swipe hint | `profile-status.module.css` |
| `ptr-slideIn`, `pxOnlinePulse` | portal cards | `profile-portal.module.css` |
| `qfp-pulse`, `qfp-shimmer`, `qfp-expand`, `qfp-slide-up` | quick feed | `profile-feed-preview.module.css` (already shipped) |

All animations honor `prefers-reduced-motion: reduce`.

## 4. VISUAL_DELTA — known gaps vs legacy 1:1

These are intentional gaps that warrant manual review. None of them block the
step-26 visual-shell goal; each has a documented reason.

| # | Area | Legacy | V2 step-26 | Reason |
|---|---|---|---|---|
| 1 | Bio editor | 6×24 char grid + typewriter pre-fill + pencil edit affordance | static `<p>` clamp at 6 lines | Bio edit needs identity write runtime; planned later step |
| 2 | Avatar parter glow (relationship) | conditional 12px 0 28px 6px amber glow when partner present | not rendered | Relationship runtime not in V2 yet |
| 3 | Banner image | Ken Burns parallax + shimmer + parallax scroll | empty gradient + share button | No banner image upload runtime (media domain pending) |
| 4 | Availability dropdown (professional) | 5-option STATUS_CONFIG dropdown with portal positioning | not rendered in V2 (only personal status pill) | Availability persistence requires identity mutation |
| 5 | Profession card | 120px tall active card + tags + linked activities + switcher chips | empty `Dodaj zawód` card | `PROFESSIONS_DATA_PENDING` / `SPECIALIZATIONS_DATA_PENDING` |
| 6 | Friends carousel auto-scroll | continuous CSS marquee duplication when ≥ 4 friends | static horizontal scroll | Engine ported as visual-only; auto-loop deferred |
| 7 | Quick feed real tiles | rich post cards (image, reactions, comments) | empty grid tiles (author + "dodał(a)…" + body sheet shell) | Feed runtime forbidden in this scope |
| 8 | Status photo upload flow | `FileReader.readAsDataURL` → base64 mutation | disabled button | Base64 upload is forbidden in V2 — media domain owns this |
| 9 | `StatusTicker` (global) | top-of-page friends-status marquee | not mounted | Statuses query is runtime-dependent (social/content) |
| 10 | Floating nav: globally mounted | mounted in app shell, not per page | mounted only on `/profile` | Global app-shell mount is a follow-up step |
| 11 | Lucide icons | Lucide React (Home, User, Search, Bell, Briefcase, Radio, Globe, Users…) | emoji glyphs / SVG inline | Adding Lucide would add a runtime dep — not in scope of a CSS-parity step |
| 12 | Public preview (friend / stranger) banners with full copy | full warning cards with copy mentioning "pasje" | local banner with `friend`/`stranger` body copy | "pasje" wording is a removed product area — used neutral wording |
| 13 | Edit profile modal | tabs Dane / Kontakt / Prywatność | top-bar edit icon disabled | Edit flow needs identity write runtime |

## 5. What is NOT in scope of step-26

Per the brief: no backend, no Supabase DB, no migrations, no Railway, no feed
runtime, no upload runtime, no profile persistence, no professional-profile
domain. Step-26 is a UI-shell parity pass on top of step-22/23/24/25.

## 6. Honest status

- Status truth: `UI_SHELL_ONLY` / `MOCK_LOCAL_ONLY` / `BACKEND_NOT_STARTED` / `MANUAL_REVIEW_REQUIRED`.
- Visual: `MANUAL_REVIEW_REQUIRED` — no screenshots taken; the user reviews
  by running `pnpm dev` locally and comparing `/profile` against the legacy
  reference at `~/Desktop/Starykod-4-readonly/PlatformaX`.
- Architecture: identity owns profile/professions, social owns relationships,
  content/media own posts/uploads. Professional layer remains a `mode` of
  `ProfilePage`, not a separate domain.
- File-size guard: every CSS module in `client/src/app-v2/profile/styles/` is
  under the 360-line limit (max: `profile-header.module.css` at 350 lines).

## 7. Reference

- Blueprint: `docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md`
- Coding standards: `docs/architecture/PlatformaX-V2-coding-standards.md` §6 (file size)
- Step report: `STEP_26_REPORT.md` (same directory)
