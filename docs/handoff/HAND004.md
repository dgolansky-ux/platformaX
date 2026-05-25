# HAND004 — PROFILE_FULL_PARITY_AND_CODE_QUALITY_FIXES (step-29)

> **Trigger:** user wpisze `hand004`. Działaj autonomicznie, po polsku.
> **Status:** PENDING. **Pre-flight zależność:** guard hardening na main = OK (PR #18 `06b0afb`) → ODBLOKOWANE.
> **Uwaga:** mocno dotyka `client/src/app-v2/profile` — nie rób równolegle ze step-33 (HAND006), żeby uniknąć konfliktów.
> Część prac z tego obszaru mogła już zostać zrobiona w poprzednich PR-ach (#16 profile legacy parity, floating nav, quick feed shell) — zweryfikuj aktualny stan na main zanim zaczniesz, nie duplikuj.

---

## PEŁNA KOMENDA (verbatim)

NAJPIERW PRZECZYTAJ ZASADY KODOWANIA I GOVERNANCE.

Masz wgrane zasady kodowania PlatformaX V2. Przeczytaj je dokładnie przed zmianami. Traktuj je jako nadrzędne.

Dodatkowo przeczytaj:
- docs/architecture/PlatformaX-V2-active-rules.md
- docs/architecture/PlatformaX-V2-coding-standards.md
- docs/architecture/PlatformaX-V2-architecture-enforcement.md
- docs/architecture/PlatformaX-V2-domain-status.md
- docs/architecture/PlatformaX-V2-legacy-containment.md
- docs/architecture/PlatformaX-V2-execution-map.md
- docs/review/REVIEW_REPORTS_INDEX.md
- docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md
- docs/profile/PROFILE_RUNTIME_LOGIC_BLUEPRINT_FROM_LEGACY.md

Jeśli komenda konfliktuje z zasadami, wygrywają zasady.
Jeśli czegoś nie da się zrobić zgodnie z zasadami, zakończ jako BLOCKED.
Nie rób fake DONE.
Nie osłabiaj guardów.
Nie generuj ZIP-a.

TASK:
PROFILE_FULL_PARITY_AND_CODE_QUALITY_FIXES

CEL:
Ogarnąć całą resztę po audycie:
- profil osobisty i zawodowy bliżej 1:1 z legacy,
- quick feed preview / narzędzie podglądu feedu znajomych 1:1 visual shell,
- pływająca nawigacja / floating buttons 1:1 visual shell,
- no-op buttons fix,
- status truth fix,
- stale copy fix,
- jakość kodu,
- zgodność z nowymi guardami,
- 100% zgodność z architekturą V2.

PRIORYTET P0:
Profil osobisty i zawodowy są najważniejszym elementem projektu.
Mobile-first.
Mobile legacy jest źródłem prawdy.
Desktop jest adaptacją.
Nie upraszczaj UX.
Nie zgaduj.
Nie zmieniaj flow bez VISUAL_DELTA w raporcie.

NIE WYMAGAJ SCREENSHOTÓW.
Visual status ma pozostać:
MANUAL_REVIEW_REQUIRED
Użytkownik sam sprawdzi wygląd.

TO NADAL JEST:
- UI shell,
- visual parity,
- local/mock fixtures,
- code quality hardening.

TO NIE JEST:
- backend persistence,
- Supabase DB,
- db push,
- migracje live,
- Railway,
- feed runtime,
- real comments/reactions runtime,
- media upload runtime.

PRE-FLIGHT:
1. git fetch origin
2. git checkout main
3. git pull --ff-only origin main
4. git status

Jeśli working tree nie jest clean:
zakończ jako BLOCKED: WORKING_TREE_NOT_CLEAN.

5. Sprawdź, że guard hardening jest już na main:
   - istnieje wzmocniony guard wielkości plików,
   - CSS/.module.css są objęte guardem,
   - no-op UI guard istnieje albo jest częścią rules:check,
   - status truth guard istnieje albo jest częścią rules:check,
   - docs/review/step-28-quality-guards-hardening/STEP_28_REVIEW.md istnieje.

Jeśli guard hardening nie jest na main:
zakończ jako BLOCKED: QUALITY_GUARDS_HARDENING_NOT_MERGED.

6. Sprawdź, że istnieją:
   - /profile
   - docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md
   - docs/profile/PROFILE_RUNTIME_LOGIC_BLUEPRINT_FROM_LEGACY.md
   - raporty step-22 do step-28.

Jeśli brakuje dokumentów profilu:
zakończ jako BLOCKED: PROFILE_BLUEPRINT_OR_RUNTIME_LOGIC_DOC_MISSING.

7. Utwórz branch:
git checkout -b feat/profile-full-parity-quality-fixes

LEGACY SOURCE:
Użyj tylko jako read-only:
~/Desktop/Starykod-4

Masz bardzo dokładnie przejrzeć legacy:
- profil osobisty,
- profil zawodowy,
- wszystko, co przynależało do profilu,
- quick feed preview / podgląd feedu znajomych,
- PostDetailSheet / sheet posta,
- friend/contact carousel,
- floating navigation buttons,
- floating back button,
- bottom nav,
- mobile sheets,
- animacje,
- keyframes,
- font sizes,
- spacing,
- kolory,
- CTA,
- empty states,
- microcopy.

NIE WOLNO:
- kopiować legacy runtime,
- kopiować hooks,
- kopiować tRPC,
- kopiować Supabase coupling,
- importować starego kodu,
- tworzyć osobnej domeny professional-profile,
- robić deep importów domen,
- robić fake DONE,
- dodawać Supabase DB,
- robić migracji,
- dotykać Railway,
- dodawać base64/dataUrl upload,
- używać localStorage/sessionStorage jako fake backend,
- dodawać public PII,
- robić href="#",
- robić no-op buttons,
- używać window.alert/window.confirm,
- osłabiać guardów,
- używać --no-verify,
- robić direct push do main.

CZĘŚĆ A — PROFILE LEGACY PARITY AUDIT AND FIX:

1. Porównaj V2 z legacy dla profilu osobistego i zawodowego.

Sprawdź i popraw:
- kolejność sekcji mobile,
- header,
- banner,
- avatar,
- avatar/badge positioning,
- bio,
- status bar,
- CTA,
- top cards,
- sekcje osobiste,
- warstwę zawodową,
- przełącznik Osobisty/Zawodowy,
- karty zawodowe,
- empty states,
- font sizes,
- line height,
- font weights,
- spacing,
- padding,
- radius,
- shadows,
- border,
- background gradients,
- mobile rhythm,
- desktop adaptation,
- hover/focus,
- reduced motion,
- animacje/keyframes.

2. Jeśli coś nie może być 1:1 bez backendu:
- zostaw jako visual shell,
- dodaj VISUAL_DELTA w raporcie,
- nie udawaj DONE.

3. Nie zmieniaj architektury domen.
Profil zawodowy ma zostać warstwą tego samego profilu.

CZĘŚĆ B — QUICK FEED PREVIEW 1:1 VISUAL SHELL:

Odtwórz maksymalnie wiernie narzędzie podglądu feedu znajomych.

Wymagania:
- mobile-first,
- rozsuwanie/zwijanie,
- animacja max-height/opacity/transform,
- stacked avatars ostatnich autorów,
- pulse/live indicator, jeśli był w legacy,
- skeleton/shimmer loading state,
- grid/lista kart jak w legacy,
- layout z dużym kaflem i mniejszymi kaflami, jeśli był w legacy,
- full-bleed / edge-to-edge tam, gdzie legacy tak działało,
- CTA do pełnego feedu jako route/disabled-policy shell,
- klik w post otwiera local PostDetailSheet visual shell,
- reakcje/komentarze/menu jako visual shell,
- mock fixtures,
- empty state,
- loading state,
- reduced motion.

NIE WOLNO:
- robić globalnego feedu,
- podłączać content-v2 runtime,
- udawać prawdziwych komentarzy/reakcji,
- robić Supabase DB.

CZĘŚĆ C — FLOATING NAVIGATION BUTTONS 1:1 VISUAL SHELL:

Odtwórz pływające przyciski nawigacji jako V2 app-shell UI.

W legacy sprawdź:
- BottomNav.tsx,
- BottomNavButtons.tsx,
- BottomNavButtons.NavBtn.tsx,
- BottomNavButtons.MapNavBtn.tsx,
- FloatingBackButton.tsx,
- style i animacje tych elementów.

Wymagania:
- glassmorphism floating pill, jeśli było,
- central island Home/Profile, jeśli było,
- active state,
- badge state,
- pressed/tap micro-state,
- hide on scroll down / show on scroll up,
- slide/fade/bounce entry,
- floating back button,
- prefers-reduced-motion,
- działa na profilu,
- przygotowane jako platformowy app-shell element,
- bez naruszenia route containment.

Umieść w czystej strukturze V2:
client/src/app-v2/navigation/
albo zgodnie z aktualnym app-v2.

Nie twórz domeny biznesowej dla nawigacji.

CZĘŚĆ D — NO-OP BUTTONS AND CTA FIX:

Napraw wszystkie istniejące naruszenia wykryte przez guardy albo audyt.

Szczególnie sprawdź:
- ProfileContacts.tsx
- ProfileStatusBar.tsx
- quick feed buttons
- floating nav buttons
- professional layer CTA
- profile cards CTA

Każdy przycisk musi mieć:
- realny route,
- modal/sheet/local state,
- submit action,
- albo jawny disabled/policy state.

Zakazane:
- button bez onClick/disabled/submit,
- href="#",
- pusty onClick,
- fake success,
- window.alert/window.confirm.

CZĘŚĆ E — STATUS TRUTH FIX:

Napraw niespójności statusów.

Sprawdź:
- client/src/features-v2/feature-registry.ts
- client/src/features-v2/identity/README.md
- docs/review/REVIEW_REPORTS_INDEX.md
- step reports
- domain/status docs, jeśli istnieją.

Przykład problemu:
README mówi AUTH_RUNTIME_PARTIAL/PARTIAL, a registry mówi SCAFFOLD_ONLY/hasDomainLogic false.

Zasada:
- status ma odpowiadać realnemu kodowi,
- nie wpisuj IMPLEMENTED bez pełnego runtime evidence,
- nie zawyżaj statusu,
- nie fake DONE.

CZĘŚĆ F — STALE COPY FIX:

Popraw nieaktualne teksty.

Szczególnie:
- CheckEmailRoute.tsx
- app-v2 README
- auth/onboarding copy

Jeśli Supabase Auth adapter działa:
copy nie może mówić, że auth backend w ogóle nie istnieje.

Precyzyjny status:
- Auth działa przez Supabase adapter,
- profile/onboarding persistence może nadal być not started/partial,
- nie obiecuj rzeczy, których runtime nie robi.

CZĘŚĆ G — CODE QUALITY:

Dostosuj kod do nowych guardów.

Wymagania:
- żadnych plików ponad nowe limity,
- żadnego CSS module na granicy limitu, jeśli da się sensownie rozbić,
- rozbij duże komponenty, jeśli guard wymaga,
- nie twórz jednego wielkiego pliku,
- nie duplikuj fixtures bez sensu,
- nie mieszaj visual shell z adapterami runtime,
- CSS modules sekcyjnie:
  profile header,
  professional,
  feed preview,
  floating nav,
  animations,
  layout.

Jeśli trzeba, rozbij:
- OnboardingFlow.tsx,
- duże CSS modules,
- duże testy.

Nie zmieniaj UX bez potrzeby.

CZĘŚĆ H — ARCHITEKTURA:

100% zgodność z V2.

Zasady:
- app-v2 = composition/UI shell,
- features-v2 nie importują internals innych domen,
- cross-domain tylko przez public-api/contracts/events,
- identity posiada profil i auth subject,
- professional profile = layer identity/profile,
- quick feed preview = visual shell, runtime później przez content-v2/social,
- floating nav = app-shell UI,
- media upload nie jest zakresem,
- Supabase DB nie jest zakresem.

Nie dodawaj backendu w tym PR.

TESTY:
Dodaj/aktualizuj testy dla:
- /profile renderuje profil osobisty,
- przełącznik Osobisty/Zawodowy działa,
- warstwa zawodowa renderuje się jako layer, nie osobna domena,
- quick feed preview renderuje się,
- quick feed preview można rozwinąć/zwinąć,
- klik postu otwiera local PostDetailSheet visual shell,
- quick feed ma empty/loading state,
- floating navigation renderuje się na profilu,
- floating nav ma active state,
- floating back button renderuje się, jeśli route/context tego wymaga,
- no-op buttons nie występują,
- href="#" nie występuje,
- Supabase nie jest importowany poza adapterem,
- brak localStorage/sessionStorage fake backend,
- brak public PII,
- brak base64/dataUrl,
- status registry/README nie są sprzeczne,
- pliki przechodzą nowe file-size guardy.

DOKUMENTACJA:
Dodaj raport:
docs/review/step-29-profile-full-parity-quality-fixes/STEP_29_REVIEW.md

Dodaj też audyt:
docs/review/step-29-profile-full-parity-quality-fixes/PROFILE_PARITY_AUDIT.md

Raport ma zawierać:
- status: PROFILE_FULL_PARITY_QUALITY_FIXES_PR_READY albo BLOCKED,
- zakres,
- zmienione pliki,
- Architecture Impact Statement,
- legacy files reviewed,
- co poprawiono w profilu osobistym,
- co poprawiono w profilu zawodowym,
- co poprawiono w quick feed preview,
- co poprawiono w floating navigation,
- co poprawiono w no-op CTA,
- co poprawiono w status truth,
- największe pliki po zmianie,
- potwierdzenie zgodności z file-size guardami,
- lista VISUAL_DELTA,
- no screenshots required,
- no legacy runtime imports,
- no Supabase DB,
- no Railway,
- no migrations,
- no separate professional-profile domain,
- status truth:
  UI_SHELL_ONLY
  MOCK_LOCAL_ONLY
  BACKEND_NOT_STARTED
  MANUAL_REVIEW_REQUIRED
- wyniki gate'ów,
- honest limitations.

Zaktualizuj:
docs/review/REVIEW_REPORTS_INDEX.md

PRZED COMMIT:
Wypisz:
- zmienione pliki,
- największe pliki i ich liczby linii,
- legacy files reviewed,
- lista VISUAL_DELTA,
- potwierdź:
  no legacy runtime imports,
  no separate professional-profile domain,
  no Supabase DB,
  no Railway,
  no migrations,
  no fake DONE,
  no public PII,
  no base64/dataUrl,
  no href="#",
  no no-op buttons,
  no localStorage/sessionStorage fake backend,
  no weakened guards,
  file-size guards PASS,
  mobile-first UX not downgraded.

URUCHOM GATE'Y:
- pnpm check
- pnpm lint
- pnpm test
- pnpm build
- pnpm rules:check
- pnpm arch:check:v2
- pnpm guards:domains
- pnpm guards:secrets
- pnpm guards:review
- pnpm guards:self-audit
- pnpm guards:bramka
- pnpm guards:all-local
- node scripts/check-build-artifacts.mjs

JEŚLI COKOLWIEK PADA:
- nie commituj,
- nie pushuj,
- napraw albo zakończ jako BLOCKED,
- raport ma mówić prawdę.

JEŚLI WSZYSTKO PASS:
1. Commit:
   feat(profile): finalize parity shell and quality fixes

2. Push:
   git push origin feat/profile-full-parity-quality-fixes

3. Utwórz PR do main z Architecture Impact Statement.

4. Poczekaj na GitHub CI / required checks.

5. Jeśli GitHub CI i required checks są zielone oraz branch protection pozwala:
   zmerguj PR przez GitHub PR.
   NIE rób direct push do main.

6. Jeśli merge jest zablokowany:
   zakończ jako MERGE_BLOCKED i podaj powód.

PO MERGE:
1. git checkout main
2. git pull --ff-only origin main
3. NIE generuj ZIP-a.

RAPORT KOŃCOWY:
Podaj krótko:
- branch,
- commit,
- PR link,
- merge status,
- gate'y,
- GitHub CI status,
- status końcowy,
- największe pliki po zmianie,
- co poprawiono w profilu,
- co poprawiono w quick feed preview,
- co poprawiono w floating navigation,
- co poprawiono w guard/status/no-op/copy,
- lista VISUAL_DELTA,
- czego świadomie NIE zrobiono,
- potwierdzenie: ZIP_NOT_GENERATED_BY_OPUS.

---

## Notatki dla przejmującego (NIE część oryginalnej komendy)
- Pre-flight pkt 5 wymaga `docs/review/step-28-quality-guards-hardening/STEP_28_REVIEW.md`. Guard hardening wszedł jako PR #18, ale udokumentowany jako **step-30** (`docs/review/step-30-architecture-quality-scalability-guards/STEP_30_REVIEW.md`), nie step-28. Zweryfikuj realny stan guardów na main (są: `check-file-size-limits`, `check-code-quality-structure`, `check-scalability-patterns`, `check-frontend-performance-patterns`, `check-status-truth-consistency`, `check-dependency-discipline`, `check-logging-pii-security`). Jeśli traktujesz pkt 5 dosłownie po nazwie pliku → to nie jest powód do BLOCKED; guard hardening JEST na main. Odnotuj rozbieżność nazwy w raporcie.
- Nazwa raportu: task mówi `STEP_29_REVIEW.md`, ale walidatory lubią `STEP_NN_REPORT.md` — sprawdź `scripts/check-review-reports-index.mjs` i `check-pre-commit-decision`/`check-self-audit` przed wyborem nazwy.
- Scope `profile` nie istnieje w commitlint enum → użyj `v2`, odnotuj.
- Dużo z części B/C (quick feed, floating nav) i splitu CSS było już zrobione w PR #16 — sprawdź `client/src/app-v2/profile/styles/*` i `client/src/app-v2/navigation/*` na main, nie duplikuj.
