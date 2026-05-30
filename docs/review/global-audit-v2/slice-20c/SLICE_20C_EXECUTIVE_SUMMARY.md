# SLICE 20C — Executive Summary (Global PlatformaX V2 Audit)

- **Audit date:** 2026-05-30
- **Branch:** `feat/contacts-v2-clean-room-slice`
- **HEAD SHA:** `9d8fc1c435be0d98e81c40cf94a707dd3f8fee3c`
- **Working tree:** brudne (39 plików `M`, 4 `??`) — w większości CSS-tuning Slice 20B + AppShell (untracked) + nowy raport.
- **Scope:** Slice 1–20B (od `5917bcb feat(v2): add communities frontend shell` po `9d8fc1c feat(v2): slice 20B-21 — aggressive card visual polish`).

---

## 1. DECYZJA — READY_FOR_ZIP / NOT_READY_FOR_ZIP

**`READY_FOR_ZIP`** — pod warunkiem, że ZIP Slice 21 będzie pełnym ZIP-em kodu **z uczciwym statusem** `BACKEND_PARTIAL / UI_SHELL_ONLY / MOCK_LOCAL_ONLY` w manifestach i README slice'ów.

### Co przemawia za:
- **Wszystkie bramki krytyczne PASS** (tsc, eslint, vitest 1300 testów, vite build, `rules:check` 43/43, `arch:check:v2` 9/9, `guards:all-local` w pełni zielony, depcruise 0 errors).
- **Brak P0**: brak fake-save, brak PII leak, brak złamań granic domen, brak `as any`/`@ts-ignore` w produkcyjnym kodzie (jedynie test fixtures), brak `localStorage`/`sessionStorage`/`readAsDataURL` w runtime — guardy testowo wymuszone.
- **Composer trigger + modal foundation działa** (`ComposerTrigger` + `ComposerModal` z `features-v2/publishing`) i jest **realnie wpięty** w `FriendFeedPage` + `CommunityFeedsShell`. Submit przechodzi przez `publishing-adapter` per-domena, do mock adapterów które realnie mutują stan (nie udają zapisu).
- **Sidebar przebudowany na top-tier** (`DesktopSidebar` 280 px, mark + brandword + user card + grupy nav + "Wkrótce" + "Twoje konto" + Aktywni teraz). „Usługi" zostały usunięte; "Zarządzaj" jest realnym dashboardem (`/manage`).
- **Profil owner/viewer** rozdzielony na `/profile` (owner dashboard) i `/profile/:username` (unified personal profile).
- **Stare narzędzia odłączone** — `check-removed-product-areas.mjs` PASS, `check-no-legacy-imports.mjs` PASS, `audit-domain-boundaries.mjs` PASS.
- **PII guardy zielone**: `check-public-dto-pii.mjs`, `check-dto-privacy-classification.mjs`, `check-logging-pii-security.mjs` — wszystkie PASS.
- **MOCK_LOCAL_ONLY uczciwie oznaczone** w każdym mock-adapter (komentarze w nagłówku każdego pliku).

### Główne braki (P1, NIE blokery na ZIP raportowy):
1. **Mobile FAB w `FloatingNav` nie otwiera composera** — pokazuje modal „Wkrótce" zamiast publishing modal (`FloatingNav.tsx:94-95`). Desktop ma composer, mobile nie. Niespójność UX.
2. **Cały frontend ciągle MOCK_LOCAL_ONLY** — żaden submit nie jedzie do realnego backendu Supabase mimo że adapter Supabase istnieje (`features-v2/identity/auth/supabase-client.ts`). To jest świadoma decyzja per slice, ale powinno być widoczne na `/` (centrum) banerem statusu.
3. **`important_event` + `profile_presentation`** są `partial` z `blockedReason: backend_not_ready_v2` — composer poprawnie raportuje to użytkownikowi, ale na profilu i tak nie ma jeszcze sekcji „Ważne wydarzenia" / „Prezentacja profilu".
4. **AppShell.tsx** istnieje (untracked) i NIE jest jeszcze użyty przez route shells — każdy route shell ręcznie składa `DesktopSidebar` + `FloatingNav`. Czyste duplikowanie strukturalne.
5. **Bundle 724 KB** (gzip 206 KB) — Vite ostrzega o `>500 KB`. Brak code-splitting.
6. **Brakuje 25/25 BRAMKA** — pkt 19 (branch protection) `[EXT]` — nie do udowodnienia z working tree.

### Główne P2 (kosmetyka/polish):
- Card variants (`PostCardVariants.tsx`) wszystkie używają `StandardCard` — wizualne różnice **tylko** w `variantClassName`, więc faktycznie niewielka różnica między StaffFeedPostCard, CommunityFeedPostCard, RelationalFeedPostCard, ChannelPostCard, WorkplacePostCard. Slice 20B-21 polish to CSS-only.
- `WorkplaceTeaserCard` poprawnie nie pokazuje action bar reakcji/komentarzy (rule 10 — teaser ≠ post).
- Notifications icon w `FloatingNav` to emoji `🔔`, `👥`, `👤`, `🏠` — w sidebar są SVG ikony (`desktop-sidebar-icons`). Niespójność stylu ikon mobile/desktop.

---

## 2. STATYSTYKI

- **Plików w client/src + server**: ~954 modułów (wg depcruise), 2353 zależności.
- **Testów**: 1300 zielonych (164 test files).
- **Slices ocenionych**: 1–20B (~24 commitów feat).
- **Kart UI ocenionych**: 20 (lista w `SLICE_20C_UI_CARDS_AND_NAV_AUDIT.md`).
- **Funkcji A–L ocenionych**: 12 obszarów.
- **Wynik bramek**:
  - `tsc --noEmit` → PASS
  - `eslint . --max-warnings=0` → PASS
  - `vitest run` → **1300/1300 PASS** (164 test files)
  - `vite build` → PASS (warning chunk size 724 KB)
  - `pnpm rules:check` → **43/43 PASS**
  - `pnpm arch:check:v2` → **9/9 PASS**
  - `pnpm guards:all-local` → PASS (umbrella, ~25 sub-guardów)
  - `pnpm depcruise:check` → 0 errors, 44 warnings (no-orphans w pustych scaffoldach)

---

## 3. PRIORYTETY

- **P0**: 0 znalezionych.
- **P1**: 5 (mobile FAB, MOCK_LOCAL_ONLY platforma, brak runtime banera, brak presentation/important_event sekcji na profilu, AppShell niewdrożony).
- **P2**: ~8 (polish/CSS/ikony, code-splitting, kompletność kart).
- **P3**: ~6 (kosmetyka).

Pełne listy: `SLICE_20C_ACTION_PLAN_BEFORE_ZIP.md`.

---

## 4. REKOMENDACJA

1. **Zrobić ZIP raportowy 20C teraz** (ten ZIP).
2. **PRZED Slice 21 (pełnym ZIP-em platformy)** dotknąć przynajmniej:
   - Mobile FAB → realny `ComposerModal` (P1, ~30 min).
   - Banner runtime status na centrum/feedach „Działa na MOCK_LOCAL_ONLY" jeśli `?mock=1` lub po prostu zawsze (do czasu wdrożenia transportu) (P1, ~20 min).
   - Code-splitting `manualChunks` (vite.config.ts) — bundle < 500 KB (P2, ~15 min).
   - Wdrożyć `AppShell.tsx` w 6+ route shells (P2, ~30 min).
3. Reszta P2/P3 — bezpiecznie po Slice 21.

---

## 5. ARTIFACTS

- `reportsZipPath`: `ZIPY/PlatformaX_V2_SLICE_20C_GLOBAL_AUDIT_REPORTS_.zip`
- `reportsManifestPath`: `ZIPY/PlatformaX_V2_SLICE_20C_GLOBAL_AUDIT_REPORTS__MANIFEST.json`
- `reportsZipValidation`: PASS (zob. `SLICE_20C_TESTS_AND_GATES_REPORT.md` sekcja walidacji)
- Kopia ZIP-a: `C:\Users\dgola\Desktop\ZIPY\PlatformaX_V2_SLICE_20C_GLOBAL_AUDIT_REPORTS_.zip` (zgodnie z preferencją Dawida).

---

**Brutalna prawda**: bramki techniczne są zielone w 100 %. Platforma jest jednak ciągle **front-only/mock-only**; realnego back-endu (poza Supabase auth adapter) nikt jeszcze nie podłączył do feedów / publikacji / moderacji. To jest świadomy stan zaakceptowany przez governance (rule MOCK_LOCAL_ONLY + status `BACKEND_PARTIAL`). ZIP Slice 21 musi to powiedzieć wprost w README / manifeście.
