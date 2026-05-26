# Step 42 — Profile Premium Visual Maturity Pass

Status: `PROFILE_PREMIUM_VISUAL_MATURITY_READY_FOR_MANUAL_REVIEW`

## What was changed

### Typography
- Font stack updated: **Sora** for headings (`--font-heading`), **DM Sans** for body (`--font-sans`)
- Heading hierarchy refined: section titles use Sora 600, body text uses DM Sans
- Text colors tightened: primary `#111827`, secondary `#374151`, muted `#94A3B8`

### Design tokens (profile-layout.module.css)
- Shadows reduced to subtle values (card: `0 1px 2px + 0 8px 24px`)
- Avatar shadow de-neonized: `0 4px 16px rgba(15,23,42,0.12)`
- Accent color changed from indigo `#6366f1` to slate `#475569`
- Gradient primary: deep navy `#0f3cc9 → #1e4fd8 → #334155`

### Avatar (LOCKED — no size change)
- **AVATAR_SIZE_LOCKED**: mobile 144×144, desktop 190×190 — unchanged
- Ring gradient: from pastel lilac to professional blue (`#1e4fd8 → #2563eb → #3b82f6`)
- Inner background: `#f8fafc` with navy initial color `#1e3a5f`
- Camera button: emoji `📷` replaced with inline SVG camera icon, bg `rgba(30,79,216,0.92)`, border 2px white, subtle shadow
- Eye/preview button: emoji `👁` replaced with inline SVG eye icon

### Banner
- Gradient: `#102a6b → #1e4fd8 → #334155` (deep navy, not neon)
- Skeleton cells: opacity reduced to 0.08–0.16 (barely visible abstract pattern)
- Chart SVG strokes: opacity 0.25 (from 0.85)
- Share button: 36px (from 44px), more subtle glass effect
- Banner edit: emoji replaced with SVG camera icon

### Status bar
- Status dot: solid `#1e4fd8` (removed gradient animation)
- Pill border: `#d8e2f0` (was `#d1d5db`)
- Sparkle animation removed (static icon)
- Status photo: camera emoji replaced with SVG, text `foto` at 9px
- Switcher: uses Sora font

### Portal cards
- Cards: `border-radius: 16px`, `border: 1px solid #e5e7eb`, white bg
- Radial gradient overlay removed (`content: none`)
- Icon box: uniform `#eef2ff` bg with `#e0e7ff` border
- Accent colors unified to navy/slate palette
- Hover: `translateY(-1px)` with subtle shadow increase
- Online dot: 8px, no pulse animation
- Badges toned down (lighter backgrounds)

### Contacts
- Contact avatars: `#f1f5f9` bg with `#475569` text (was primary blue)
- Online dot: 10px (from 12px)
- Tab active state: unified `#1E4FD8` / `#EEF2FF` for all categories
- Tabs: `border: 1px solid #e5e7eb`, white bg
- Carousel bg opacity reduced

### Quick feed
- Toggle: flat `#f8fafc` background (removed gradient)
- LIVE dot: 8px (from 14px), no pulse animation
- LIVE text: 11px font-size (from 13px/800 weight)
- Section title: Sora font, 600 weight

### Empty states
- Background: `#ffffff` (was `#fafbff`)
- Border: dashed `#d8e2f0`
- Icon box: `48px` with `#f8fafc` bg and `#e5e7eb` border
- Title: Sora 14px/600, color `#374151`
- Description: `#94a3b8`

### Professional mode
- Profession empty card: white bg, dashed `#d8e2f0` border (was primary-soft + primary dashed)
- Specialists icon: `#fff7ed` bg with `#fed7aa` border (was gradient)
- Toggle: `#1e4fd8` (was `#ea580c`)
- Workplace anchor: `#f8fafc` bg, dashed `#d8e2f0`

### Desktop layout
- Page background: `#f3f4f6` (light neutral grey)
- Shell: `max-width: 960px`, `padding: 24px 32px`

### Desktop sidebar
- Logo: Sora 18px/700, color `#1e4fd8` (was Inter 20px/800, `#7c3aed`)
- User avatar: navy gradient `#1e4fd8 → #2563eb` (was violet gradient)
- Active now avatars: navy/slate palette (was violet palette)
- Nav items: DM Sans 13px/500, color `#374151`

## What was NOT changed

- **AVATAR_SIZE_LOCKED** — avatar dimensions untouched (144×144 mobile, 190×190 desktop)
- **DESKTOP_SIDEBAR_PRESERVED** — sidebar remains, visible on >=1024px
- Profile structure (personal/professional mode, switcher, portal cards, contacts, quick feed)
- Component hierarchy and file structure
- Backend, domains, Railway, dependencies
- Route structure and navigation

## Screenshots

SCREENSHOT_ENV_UNAVAILABLE — Playwright MCP tools not available in this environment.

Paths prepared:
- `docs/review/step-42-profile-premium-visual-maturity/screenshots/before/`
- `docs/review/step-42-profile-premium-visual-maturity/screenshots/after/`

## Requires manual review

- Visual regression on all breakpoints (390×844, 430×932, 1024×900, 1440×1000)
- Personal and professional mode on mobile and desktop
- Avatar size confirmation (must remain 144px mobile, 190px desktop)
- Banner gradient and skeleton pattern appearance
- Typography hierarchy readability

## Gates result

| Gate | Result |
|------|--------|
| `pnpm check` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (484/484) |
| `pnpm build` | PASS |
| `pnpm rules:check` | PASS (43/43) |
| `pnpm arch:check:v2` | PASS (9/9) |

## Regression tests added

- Desktop sidebar is rendered
- Portal cards render in fixed order
- No `href="#"` in profile source
- No `transition: all` in profile CSS
- No `window.alert`/`window.confirm` in profile source
