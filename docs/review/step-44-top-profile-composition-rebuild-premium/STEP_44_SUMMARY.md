# Step 44 — Top Profile Composition Rebuild Premium

Status: `TOP_PROFILE_COMPOSITION_PREMIUM_READY_FOR_MANUAL_REVIEW`

## What was rebuilt

### Hero container (desktop)
- `.header` becomes a unified hero card on desktop (>=1024px)
- Background `#FFFFFF` with border `1px solid #E5E7EB`
- Border-radius `22px`
- Shadow `0 1px 3px rgba(15,23,42,0.04), 0 12px 34px rgba(15,23,42,0.06)`
- Padding `24px 28px 28px`
- All header elements (avatar, bio, status, location, switcher, banner) live inside this container

### Desktop grid for avatar/bio row
- `.avatarBioRow` switches from `display: flex` to `display: grid` on desktop
- Grid: `grid-template-columns: auto 1px minmax(0, 1fr)` with proper column-gap
- Left column: avatar (190x190, unchanged)
- Center: 1px separator with blue gradient
- Right column: bio block

### Bio block
- Label `O MNIE`: 800 weight, `0.08em` letter-spacing, `#64748b`, 8px bottom margin
- Bio text: 16px desktop / 14px mobile, line-height 1.65/1.6
- Color: `#172033` (deep ink)
- Max-width: 680px desktop

### Separator
- Gradient: `transparent → rgba(30,79,216,0.28) → transparent`
- Desktop margin: `0 24px` (centered in grid column)
- Stretches full height of avatar/bio row

### Status row
- Desktop top padding: 18px (bio → status rhythm)
- Gap: 18px between pill and photo circle
- Pill: min-height 52px, text 14px/800, desc 13px
- Photo circle: 72px, `#f8fafc` bg, subtle shadow

### Location
- Margin-top: 12px (consistent rhythm from status)
- Pin icon: rose `#e11d48` at 70% opacity
- Desktop font-size: 14px with 8px gap

### Switcher
- Desktop padding-top: 16px from location
- Aligned right (`justify-content: flex-end`)
- Inside the hero container, directly above banner

### Banner
- Mobile margin-top: 14px
- Desktop margin: `16px 0 0` (inside hero, no side margins)
- Desktop radius: 18px
- Gradient: `#0f2f7a → #1e4fd8 52% → #334155`
- Shadow: `0 12px 32px rgba(15,23,42,0.08)`

### Mobile
- No visual container (no border/radius/shadow on mobile)
- All spacing preserved for mobile-first flow
- Avatar size unchanged: 144x144

## Confirmations

- **AVATAR_SIZE_LOCKED**: 144px mobile, 190px desktop — no change
- **DESKTOP_SIDEBAR_PRESERVED**: sidebar visible at >=1024px, `Mój profil` active
- **Mobile checked**: layout unchanged on mobile, hero container only applies at >=1024px
- **No lower sections modified**: portal cards, contacts, quick feed, etc. untouched

## Screenshots

SCREENSHOT_ENV_UNAVAILABLE — Playwright MCP tools not available.

Paths prepared:
- `docs/review/step-44-top-profile-composition-rebuild-premium/screenshots/before/`
- `docs/review/step-44-top-profile-composition-rebuild-premium/screenshots/after/`

## Gates result

| Gate | Result |
|------|--------|
| `pnpm check` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (484/484) |
| `pnpm build` | PASS |
| `pnpm rules:check` | PASS (43/43) |
| `pnpm arch:check:v2` | PASS (9/9) |
