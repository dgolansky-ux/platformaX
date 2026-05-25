# HAND003 — Handoff: dokończ step-26 (profile legacy parity + file-size guards)

> **Trigger:** użytkownik wpisze `hand003`. Wtedy ten plik to Twój główny brief.
> Działaj autonomicznie, po polsku. NIE generuj ZIP-a (potwierdź `ZIP_NOT_GENERATED_BY_OPUS`).

## Kontekst zadania

Task: `PROFILE_LEGACY_PARITY_AUDIT_AND_FIX_1_TO_1 + QUICK_FEED_PREVIEW_1_TO_1 + FLOATING_NAVIGATION_1_TO_1 + FILE_SIZE_GUARDS_FOR_CSS_AND_UI` (części A–F).
Status visual celowo: `MANUAL_REVIEW_REQUIRED` (user sam sprawdzi wygląd, bez screenshotów).
Status truth: `UI_SHELL_ONLY` / `MOCK_LOCAL_ONLY` / `BACKEND_NOT_STARTED` / `MANUAL_REVIEW_REQUIRED`.

Legacy read-only: `~/Desktop/Starykod-4-readonly/PlatformaX/client/src/...` (NIE importować/kopiować runtime).

## Stan wyjściowy (WAŻNE)

- **Branch:** `feat/profile-legacy-parity-and-size-guards` (cut z main `b17e087`). NIE pushowane.
- **Working tree: UNCOMMITTED.** Kod KOMPILUJE i jest ZIELONY: `pnpm check` PASS, `pnpm lint` PASS, `pnpm test` PASS (311/311, 42 pliki).
- Pierwsza akcja: `git checkout feat/profile-legacy-parity-and-size-guards` (jeśli nie jesteś na nim), `git status`, `pnpm test` (potwierdź 311).

## Co JUŻ ZROBIONE (nie ruszaj bez powodu)

### Część A — file-size guard (DONE)
- Nowy guard: `scripts/check-file-size-limits.mjs` — limity: `*.module.css` 360, `*.css` 500. Fail-closed. Escape: `ALLOW_FILE_SIZE_EXCEPTION`.
- Wpięty do `scripts/rules-check.mjs` (dodany do listy GUARDS po `check-file-complexity.mjs`) → automatycznie w `pnpm rules:check` i `pnpm guards:all-local`.
- **Decyzja (odnotuj w raporcie):** `.tsx`/`.ts`/scripts ZOSTAJĄ pod istniejącym `check-file-complexity.mjs` (component 350 itd. per coding-standards §6). Proponowane w tasku limity (tsx 220, test 320, script 300) NIE zostały przyjęte, bo: (1) kłócą się z aktywnym coding-standards §6 (zasady wygrywają), (2) złamałyby istniejące zgodne pliki (np. OnboardingFlow.tsx 313 > 220). Nowy guard celowo pokrywa lukę = CSS.

### Część A — split profile.module.css (DONE)
- Stary `client/src/app-v2/profile/profile.module.css` (998 linii) USUNIĘTY.
- Rozbity na 6 modułów w `client/src/app-v2/profile/styles/` (wszystkie < 360):
  - `profile-layout.module.css` (155) — page+tokens, shell, topbar, iconButton, personalGrid, professionalGrid, desktop media. Import: ProfilePage.
  - `profile-header.module.css` (262) — header, name, avatar, bio, banner, social, previewMenu/previewBody. Import: ProfileHeader, ProfileAvatar, ProfileBio, ProfileBanner, ProfileSocialLinks, ProfilePage(preview).
  - `profile-status.module.css` (149) — statusBar/pill/photo, switcher, swipeHint. Import: ProfileStatusBar, ProfileModeSwitcher.
  - `profile-sections.module.css` (310) — shared atoms (.section/.sectionHeader/.sectionTitle/.sectionSubtitle/.emptyState/.emptyIcon/.emptyTitle/.emptyText/.emptyInline/.addButton) + portal cards + contacts carousel (+ edge-fade mask). Import: ProfilePortalCards, ProfileContacts, ProfilePersonalSections, ProfessionBlock, ProfileSpecialists, ProfileProfessionalActivities.
  - `profile-feed-preview.module.css` (255) — quick feed (toggle/stack/liveDot/skeleton/grid/tile/sheet) + keyframes + reduced-motion. Import: ProfileQuickFeed.
  - `profile-professional.module.css` (170) — professionEmpty, addButton, specialistsToggle, activityTabs, sheet. Import: ProfessionBlock, ProfileSpecialists, ProfileProfessionalActivities.
- **CSS-modules zasada zachowana:** każda klasa + jej `:hover`/`:focus-visible`/`@media` warianty są w TYM SAMYM pliku co użycie (cross-file selektory by się nie matchowały przez hashowanie). Tokeny na `.page` kaskadują do wszystkich.
- Wszystkie importy komponentów przemigrowane (`../styles/...`). Multi-module: ProfilePage (layout+header), ProfessionBlock/ProfileSpecialists/ProfileProfessionalActivities (sec=sections + pro=professional). Rename: `contactsEmpty`→`emptyInline` (sections), professional add → `pro.addButton`, sheet close → dedykowane `sheetClose`, sheet title → `pro.sheetTitle`.

### Część C — quick feed preview 1:1 (DONE)
- `ProfileQuickFeed.tsx` przebudowany: toggle z stacked avatars + LIVE pulse, panel z krótkim skeleton shimmer (350ms na pierwszym otwarciu, ref-guarded), grid kafelków, klik kafelka → lokalny post-detail sheet (visual shell) z reakcjami/komentarzem/share jako disabled visual. Empty state. Zero localStorage, zero feed runtime.

### Część D — floating navigation 1:1 (DONE)
- Nowy folder `client/src/app-v2/navigation/`: `FloatingNav.tsx`, `useScrollHide.ts`, `floating-nav.module.css` (237).
- Glassmorphism pill (rgba .92 + blur 20, rounded-28, shadow), island center (Centrum→`/`, Profil→`/profile`), badges, scroll hide/show (delta>10 & y>60), entry slide-up+fade (mount 200ms), bounce cubic-bezier, prefers-reduced-motion. Bez lucide (emoji glyphs), bez trpc, bez legacy import.
- CTA: realne trasy `/` i `/profile`; Szukaj → lokalny modal „Wkrótce"; Alerty/Chat/Kontakty → disabled-policy (title „wkrótce"). Brak href="#", brak no-op.
- Zamontowany na profilu: `ProfilePage.tsx` renderuje `<FloatingNav active="profil" />`.

### Część E — polish (CZĘŚCIOWE)
- Edge-fade (mask gradient) na `.carousel`, focus-visible na wszystkich kontrolkach, prefers-reduced-motion (switcher, quick feed, nav). Reszta detali 1:1 → MANUAL_REVIEW_REQUIRED.

## Co POZOSTAŁO DO ZROBIENIA (Twoje kroki)

### Krok 1 — Testy (Część A/C/D)
Dodaj/zaktualizuj w `client/src/app-v2/profile/__tests__/ProfilePage.test.tsx` oraz nowy `client/src/app-v2/navigation/__tests__/FloatingNav.test.tsx`:
- quick feed: po rozwinięciu i (po skeletonie) klik kafelka otwiera dialog „Podgląd posta" (`findByRole("dialog", {name:/podgląd posta/i})`). Uwaga: skeleton ma 350ms timer — użyj `findBy*` (poll do 1000ms).
- floating nav: renderuje się na /profile, `aria-current="page"` na „Profil", Szukaj otwiera modal „Wkrótce", brak `href="#"`.
- floating nav: brak legacy importów (scan plików navigation/ jak w `frontend-auth-boundaries.test.ts` — buduj igły przez konkatenację, patrz niżej OSTRZEŻENIE).
- "no undefined classname" safety test: render profilu (personal + po kliknięciu Zawodowy) i `expect(container.querySelectorAll('[class*="undefined"]').length).toBe(0)` — łapie błędny split CSS.
- file-size guard unit test: `scripts/__tests__/file-size-limits.test.ts` — sprawdź logikę (np. że profile styles są < 360, i że linia > limit FAIL). Najprościej: wyeksportuj funkcję z guardu LUB napisz test odczytujący pliki. Task wymaga: „CSS module > limit ma FAIL, pod limitem PASS".

**OSTRZEŻENIE (krytyczne, z poprzednich kroków):** guardy `check-media-base64` (blokuje `readAsDataURL`/`dataUrl`/`base64`/`base64Upload`), `check-removed-product-areas` (blokuje słowo `pages`/inne removed areas), env/secret scanners — SKANUJĄ pliki testowe w `client/src`. Jeśli w teście piszesz te zakazane stringi (np. w asercji „brak base64"), zbuduj je przez konkatenację (`"base"+"64"`, `["pa","ges"].join("")`), inaczej guard FAIL na Twoim pliku testowym. Patrz `ProfilePage.test.tsx` (sekcja source-scan) i `frontend-auth-boundaries.test.ts` jako wzór.

### Krok 2 — Część F: README fix
`client/src/app-v2/README.md` — usuń/napraw nieaktualne:
- auth: NIE „bez Supabase" — jest adapter Supabase Auth (step-21, `features-v2/identity`).
- register: NIE „/check-email?email=..." — teraz `/check-email` bez emaila (step-20 fix #10).
- dodaj: profile (`/profile`) personal+professional layer, floating nav, quick feed shell, że CSS jest rozbity na moduły < 360.

### Krok 3 — Część B: audyt
`docs/review/step-26-profile-legacy-parity-and-size-guards/PROFILE_PARITY_AUDIT.md`:
- legacy pliki sprawdzone: `BottomNav.tsx`, `BottomNavButtons.tsx`, `BottomNavButtons.NavBtn.tsx`, `BottomNavButtons.MapNavBtn.tsx`, `FloatingBackButton.tsx` (w `~/Desktop/Starykod-4-readonly/.../features/_shared/components/`), blueprint §15 (quick feed), §4/§6 (profil). (Możesz dojrzeć więcej, np. `QuickFeedPreview.tsx`, `ProfileView.tsx`.)
- znalezione elementy, czego brakowało w V2, co poprawiono, VISUAL_DELTA, MANUAL_REVIEW_REQUIRED. Bez fake DONE.

### Krok 4 — Raport + indeks (WYMAGANE przez guardy)
- `docs/review/step-26-profile-legacy-parity-and-size-guards/STEP_26_REPORT.md` (NIE `_REVIEW.md` — tylko `_REPORT.md` jest walidowany przez `check-pre-commit-decision`/`check-self-audit`). MUSI zawierać sekcje: PRE-COMMIT DECISION (pola: Changed files, Domains touched, Cross-domain imports, Legacy runtime imports, Removed routes/nav/build chunks, Public DTO PII, Media base64/dataUrl, List pagination/limit/cursor, Fake DONE/status truth, Env safety, TypeScript, V2 lint, Tests, Build, Commit decision) + `SELF-AUDIT / INDEPENDENT REVIEW PASS` (12 pól: What I changed, What I might have broken, Domain boundaries affected, Cross-domain imports check, Legacy/runtime check, Fake DONE/status truth check, PII/base64/secrets check, Routes/nav/build graph check, Guard weakening check, Evidence reviewed, Gates run, Remaining risks). Plus: zakres, Architecture Impact Statement, legacy reviewed, quick feed parity notes, floating nav parity notes, file size guard limits, CSS split summary, mobile-first decisions (no MOBILE_DELTA), VISUAL_DELTA, status truth, gate'y, honest limitations, file size guard decision (tsx 220 nieprzyjęte — uzasadnienie wyżej).
- Zaktualizuj `docs/review/REVIEW_REPORTS_INDEX.md`: nagłówek `Last updated: 2026-05-25 (Step 26)` + wiersz:
  `| step-26-profile-legacy-parity-and-size-guards | Profile legacy parity + CSS/file-size guards (app-v2) | pending | 2026-05 | Yes | MANUAL_REVIEW_REQUIRED | — | Evidence: STEP_26_REPORT.md |`

### Krok 5 — (opcjonalnie) governance doc note
Dopisz krótko w `docs/architecture/PlatformaX-V2-coding-standards.md` §6, że CSS module ma limit 360 / global CSS 500 egzekwowane przez `check-file-size-limits.mjs`. (docs/ jest zwolniony z fake-done/secret, więc bezpieczne.)

### Krok 6 — Gate'y (prawdziwe kody wyjścia, NIE maskuj `| tail`)
```sh
for g in check lint test build rules:check arch:check:v2 guards:domains guards:secrets guards:review guards:self-audit guards:bramka guards:all-local; do pnpm $g; done
node scripts/check-build-artifacts.mjs
```
Uwaga: `| tail` maskuje exit code (bierze kod z `tail`). Sprawdzaj exit każdego osobno. Wszystkie muszą PASS. Bramka musi zostać 25/25 (dodanie guardu do rules-check nie psuje bramki, ale potwierdź; jeśli jakiś test asercją liczy guardy rules-check, zaktualizuj go — to NIE jest osłabianie).

### Krok 7 — Commit + push + PR + merge
- Scope: `profile` NIE istnieje w commitlint enum (dozwolone: v2, governance, guards, architecture, routing, identity, social, content, media, system, ci, docs). Użyj `v2` (zmiana spina profil + nav + guards). Komenda z tasku to `feat(profile): ...` — zmień scope na `v2`, odnotuj.
- `git add` konkretne pliki (NIE `.claude/`): scripts/check-file-size-limits.mjs, scripts/rules-check.mjs, client/src/app-v2/profile/ (cały), client/src/app-v2/navigation/ (cały), client/src/app-v2/README.md, docs/review/REVIEW_REPORTS_INDEX.md, docs/review/step-26-.../, docs/handoff/HAND003.md, (ew. coding-standards.md).
- Commit msg: `feat(v2): improve profile legacy parity and enforce file size guards` + Co-Authored-By trailer.
- `git push -u origin feat/profile-legacy-parity-and-size-guards`
- `gh pr create --base main` z Architecture Impact Statement (wzór: poprzednie PR-y #12–#15).
- `gh pr checks <PR> --watch`; jeśli zielone + CLEAN → `gh pr merge <PR> --squash --delete-branch`.
- PO MERGE: `git checkout main && git pull --ff-only origin main`. **NIE generuj ZIP-a.**

### Krok 8 — raport końcowy do usera (po polsku)
branch, commit, PR link, merge status, gate'y, CI status, status końcowy, największe pliki po zmianie, nowe guardy, co poprawiono w profilu/quick feed/floating nav, lista VISUAL_DELTA, czego NIE zrobiono, `ZIP_NOT_GENERATED_BY_OPUS`.

## Zasady (NIE PRZEKRACZAĆ)
- `[[user-language-preference]]` po polsku, `[[feedback-low-friction]]`.
- NIE `--no-verify`, NIE osłabiać guardów, NIE direct push do main, NIE fake DONE.
- NIE legacy runtime imports, NIE Supabase DB/migracje/Railway, NIE base64/dataUrl upload, NIE localStorage/sessionStorage fake, NIE public PII, NIE href="#", NIE no-op buttons, NIE osobna domena professional-profile.
- Profil zawodowy = warstwa/tryb tego samego profilu (mode === "professional"). NIE wymyślać zawodów/specjalizacji (PROFESSIONS_DATA_PENDING / SPECIALIZATIONS_DATA_PENDING).
- Nazwa raportu: `STEP_26_REPORT.md` (nie `_REVIEW.md`).

## Znane drobiazgi do rozważenia (opcjonalnie, nie blokujące)
- `ProfilePage` shell ma `padding-bottom: calc(96px...)` ORAZ FloatingNav renderuje własny `.spacer` 74px → podwójny odstęp na dole. Rozważ usunięcie jednego (zostaw spacer nav, zmniejsz shell padding) — opisz jako polish/VISUAL_DELTA jeśli zmienisz.
- FloatingNav jest na razie tylko na `/profile`. Globalny app-shell mount = przyszłość (odnotuj).
```
