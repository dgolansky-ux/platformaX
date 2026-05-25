# HAND001 — Handoff: dokończ step-20 (auth + register + onboarding UI shell)

> **Trigger aktywacyjny:** użytkownik napisze `hand001` w nowej sesji. Wtedy ten plik staje się Twoim głównym briefem. Działaj autonomicznie i po polsku.

## Stan wyjściowy

- **Branch:** `feat/auth-register-onboarding-shell` (cut from `main` @ `884175c`)
- **Working tree:** UNCOMMITTED zmiany (zobacz sekcję „Zmienione pliki" niżej). Nic jeszcze nie commitowane na tym branchu.
- **Origin:** nie pushowane.
- **Landing page (step-19)** jest już na `main` (`884175c`) — pre-flight spełniony.
- **Stary kod** rozpakowany jako READ-ONLY w `~/Desktop/Starykod-4-readonly/`. Nie używaj go jako runtime, nie kopiuj. Zniknie wraz z tym zadaniem.

## Co jest zrobione (do zachowania bez zmian)

| Obszar | Plik(i) | Stan |
|---|---|---|
| Router | `client/src/app-v2/AppRouter.tsx` | Gotowy, BrowserRouter + 6 tras |
| App entry | `client/src/App.tsx` | Renderuje `<AppRouter />` |
| App entry test | `client/src/App.test.tsx` | Asercja na hero H1 |
| Wspólny layout auth | `client/src/app-v2/auth/AuthLayout.tsx`, `.module.css`, `AuthBrandPanel.tsx`, `.module.css` | Gotowe |
| Forms (collocated) | `client/src/app-v2/auth/forms/FormField.tsx`, `PasswordField.tsx`, `SubmitButton.tsx`, `validation.ts`, `*.module.css` | Gotowe |
| Login | `client/src/app-v2/auth/LoginRoute.tsx` | UI shell + honest FormNotice ("Logowanie nie jest jeszcze dostępne…") |
| Register | `client/src/app-v2/auth/RegisterRoute.tsx` | Walidacja local, submit → navigate `/check-email?email=…` |
| Reset password | `client/src/app-v2/auth/ResetPasswordRoute.tsx` | UI shell „wiadomość przygotowana" |
| Check email | `client/src/app-v2/auth/CheckEmailRoute.tsx` | Honest UI-shell notice + link do `/onboarding` |
| Onboarding | `client/src/app-v2/onboarding/OnboardingFlow.tsx` (313 linii, pod limitem 350) + `OnboardingProgress.tsx` + 5 kroków w `steps/` | Gotowy, mock-local state, PII nie wycieka |
| Landing CTA | `landing/sections/SiteHeader.tsx`, `HeroSection.tsx`, `FinalCtaSection.tsx` | Przepięte z `href="#"` na `<Link to="/login">` / `<Link to="/register">` |
| Landing test | `landing/__tests__/LandingPage.test.tsx` | Owinięty w `<MemoryRouter>`, zaktualizowany na real route'y |
| README app-v2 | `client/src/app-v2/README.md` | Zaktualizowany — auth + onboarding + constraints |
| Testy auth | `client/src/app-v2/auth/__tests__/{validation,RegisterRoute,LoginRoute,ResetPasswordRoute,CheckEmailRoute}.test.tsx` | 5 plików, używają fireEvent + MemoryRouter |
| Testy onboarding | `client/src/app-v2/onboarding/__tests__/OnboardingFlow.test.tsx` | 1 plik, test PII-no-leak + walidacje |
| Zależności | `package.json` + `pnpm-lock.yaml` | Dodano `react-router-dom@^7.1.0` (jedyna nowa) |

## Co JESZCZE NIE jest zrobione

1. **Raport step-20** — `docs/review/step-20-auth-register-onboarding-shell/STEP_20_REVIEW.md`
2. **Aktualizacja `docs/review/REVIEW_REPORTS_INDEX.md`** — dodać wiersz step-20
3. **Gate'y review** — `pnpm guards:review`, `pnpm guards:self-audit`, `pnpm guards:bramka`, `pnpm guards:all-local` (jeszcze nie odpalone, padną dopóki nie ma raportu)
4. **Commit** — wiadomość typu `feat(auth): add register login onboarding shell` (scope `auth` może nie być w enum — sprawdź `commitlint.config.mjs`. Allowed scopes: `v2`, `governance`, `guards`, `architecture`, `routing`, `identity`, `social`, `content`, `media`, `system`, `ci`, `docs`. **Użyj `routing` lub `identity`**)
5. **Push** branch
6. **PR** do `main` z Architecture Impact Statement
7. **ZIP** do `~/Desktop/ZIPY/platformax-v2-auth-register-onboarding-shell-ready.zip`

## Już potwierdzone PASS (przed handoffem)

```
pnpm check                          PASS  (tsc --noEmit)
pnpm lint                           PASS  (eslint, 0 warnings)
pnpm test                           PASS  279/279 tests in 39 files
pnpm build                          PASS  78 modules, ~85 kB JS gzip, ~5.4 kB CSS gzip
node scripts/check-build-artifacts  PASS
pnpm rules:check                    PASS  21/21 guards
pnpm arch:check:v2                  PASS  9/9 guards
pnpm guards:domains                 PASS
pnpm guards:secrets                 PASS
```

`guards:review` / `guards:self-audit` / `guards:bramka` / `guards:all-local` **nie były uruchamiane** — padną dopóki step-20 report nie istnieje (`check-review-reports-index` widzi folder bez wpisu w indeksie, `check-pre-commit-decision` i `check-self-audit-evidence` wymagają sekcji w raporcie).

## Pełna lista uncommitted plików (sprawdź `git status` po wejściu na branch)

Zmodyfikowane:
- `client/src/App.test.tsx`
- `client/src/App.tsx`
- `client/src/app-v2/README.md`
- `client/src/app-v2/landing/__tests__/LandingPage.test.tsx`
- `client/src/app-v2/landing/sections/FinalCtaSection.tsx`
- `client/src/app-v2/landing/sections/HeroSection.tsx`
- `client/src/app-v2/landing/sections/SiteHeader.tsx`
- `package.json`
- `pnpm-lock.yaml`

Nowe:
- `client/src/app-v2/AppRouter.tsx`
- `client/src/app-v2/auth/` (cały folder)
- `client/src/app-v2/onboarding/` (cały folder)
- `docs/handoff/HAND001.md` (ten plik)

## Twoje kroki (rób w tej kolejności)

### Krok 1 — wejdź na branch i zweryfikuj stan

```sh
git fetch origin
git checkout feat/auth-register-onboarding-shell
git status
git diff --stat
pnpm test  # potwierdź 279/279
```

### Krok 2 — napisz raport step-20

Stwórz `docs/review/step-20-auth-register-onboarding-shell/STEP_20_REVIEW.md`. Musi zawierać:

1. **Status:** `AUTH_REGISTER_ONBOARDING_SHELL_PR_READY` (jeśli wszystko PASS) albo `BLOCKED` (jeśli coś pada).
2. **Zakres** (lista 4 ekranów auth + onboarding 5-krokowy + landing CTA repoint).
3. **Changed files** — tabela (skopiuj z sekcji „Pełna lista uncommitted plików" wyżej i rozbij `auth/` i `onboarding/` na pojedyncze pliki przez `ls`).
4. **Legacy reference used:** `~/Desktop/Starykod-4-readonly/PlatformaX/client/src/features/system/pages/{LoginPage,RegisterPage,Onboarding,OnboardingSteps}.tsx` — **READ-ONLY**. Wykorzystane: mikrocopy, kolejność kroków onboardingu, pattern „show password toggle", pattern „privacy hint" dla PII. **Nie kopiowano** kodu, importów, hooks, tRPC ani Supabase coupling.
5. **Potwierdzenia (explicit):**
   - no legacy runtime imports
   - no Supabase / Railway / db push / migrations
   - no `localStorage` / `sessionStorage` jako fake auth
   - no `href="#"` placeholdery (wszystkie auth CTA mają realną trasę)
   - no `window.alert` / `window.confirm`
   - no fake DONE / banned status strings
   - no public PII (DTO nie istnieją; PII tylko w `useState`)
   - no cross-domain deep imports
   - no guard weakening
6. **Status truth:**
   - `app-v2/auth` — `UI_SHELL_ONLY` / `BACKEND_NOT_STARTED`
   - `app-v2/onboarding` — `UI_SHELL_ONLY` / `MOCK_LOCAL_ONLY` / `BACKEND_NOT_STARTED`
   - `app-v2/landing` — `UI_SHELL_ONLY` (pozostaje, tylko CTA przepięte)
   - `identity` (domena V2) — `BACKEND_NOT_STARTED` (bez zmian w `server/domains-v2/identity`)
7. **Architecture Impact Statement** — krótko: nowy app-shell composition, jedna nowa zależność (react-router-dom), żaden V2 domain (front ani back) nie został tknięty.
8. **PRE-COMMIT DECISION** (sekcja obowiązkowa, wymagana przez `scripts/check-pre-commit-decision.mjs`). Wymagane pola (patrz lista w skrypcie):
   - `Changed files:`
   - `Domains touched:`
   - `Cross-domain imports:`
   - `Legacy runtime imports:`
   - `Removed routes/nav/build chunks:`
   - `Public DTO PII:`
   - `Media base64/dataUrl:`
   - `List pagination/limit/cursor:`
   - `Fake DONE/status truth:`
   - `Env safety:`
   - `TypeScript:`
   - `V2 lint:`
   - `Tests:`
   - `Build:`
   - `Commit decision:`
9. **SELF-AUDIT / INDEPENDENT REVIEW PASS** (sekcja obowiązkowa, 12 pól, patrz `scripts/check-self-audit-evidence.mjs`).
10. **Honest limitations:**
    - brak prawdziwego logowania (UI shell)
    - brak persystencji onboardingu (refresh = utrata stanu)
    - brak e2e/visual regression
    - brak strony 404 dedykowanej (catch-all `<Navigate to="/" replace />` jest celowy)

### Krok 3 — zaktualizuj REVIEW_REPORTS_INDEX

Dodaj wiersz tabeli:
```
| step-20-auth-register-onboarding-shell | Auth + register + onboarding UI shell (app-v2) | pending | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_20_REVIEW.md |
```
i zmień nagłówek `Last updated:` na `2026-05-25 (Step 20)`.

### Krok 4 — uruchom wszystkie gate'y

```sh
pnpm check
pnpm lint
pnpm test
pnpm build
pnpm rules:check
pnpm arch:check:v2
pnpm guards:domains
pnpm guards:secrets
pnpm guards:review
pnpm guards:self-audit
pnpm guards:bramka
pnpm guards:all-local
node scripts/check-build-artifacts.mjs
```

Jeśli `guards:review` / `guards:self-audit` / `guards:bramka` padają — to znaczy że raport nie ma jakiegoś wymaganego pola. Spójrz na error i dopisz brakujące pole. **Nie modyfikuj guarda.**

### Krok 5 — commit + push + PR

Allowed commit scopes (z `commitlint.config.mjs`): `v2`, `governance`, `guards`, `architecture`, `routing`, `identity`, `social`, `content`, `media`, `system`, `ci`, `docs`. Użyj `routing`.

```sh
git add client/src/App.tsx client/src/App.test.tsx \
  client/src/app-v2/ \
  package.json pnpm-lock.yaml \
  docs/handoff/HAND001.md \
  docs/review/REVIEW_REPORTS_INDEX.md \
  docs/review/step-20-auth-register-onboarding-shell/

git commit -m "feat(routing): add auth register onboarding UI shell

(długi opis: 4 ekrany auth + 5-krokowy onboarding w mock-local
state + landing CTA przepięte na realne trasy + react-router-dom v7
jako jedyna nowa zależność. Bez backendu, bez Supabase, bez fake auth,
bez localStorage. PII tylko w useState. Wszystkie gate'y zielone.)"

git push -u origin feat/auth-register-onboarding-shell

gh pr create --base main --head feat/auth-register-onboarding-shell \
  --title "feat(routing): publiczny auth + onboarding UI shell" \
  --body "..."  # z Architecture Impact Statement
```

### Krok 6 — ZIP

```sh
mkdir -p ~/Desktop/ZIPY
# Generate ZIP wykluczając zakazane ścieżki
cd "$(git rev-parse --show-toplevel)"
zip -r ~/Desktop/ZIPY/platformax-v2-auth-register-onboarding-shell-ready.zip . \
  -x ".git/*" "node_modules/*" "dist/*" "coverage/*" ".env*" "*.log" \
  "Starykod-4*" "legacy/*" "*.zip"
```

Po utworzeniu — weryfikacja przez existing validator:
```sh
node scripts/validate-bundle.mjs ~/Desktop/ZIPY/platformax-v2-auth-register-onboarding-shell-ready.zip
```
(Jeśli skrypt wymaga innej formy wywołania, sprawdź `--help` lub `scripts/validate-bundle.mjs`.)

### Krok 7 — raport końcowy do użytkownika

Po PR + ZIP daj usera krótki raport (po polsku):
- branch + commit hash
- PR URL
- status: `AUTH_REGISTER_ONBOARDING_SHELL_PR_READY`
- gate'y (wszystkie PASS)
- ścieżka ZIP
- co świadomie NIE zrobione (lista honest limitations)
- legacy: tylko read-only material w `~/Desktop/Starykod-4-readonly/`, brak importów

## Zasady (NIE PRZEKRACZAĆ)

Te zasady są w memory projektu — Twoja pamięć powinna już mieć:
- `[[user-language-preference]]` — wszystko po polsku
- `[[feedback-low-friction]]` — przy zadaniach o jasnym workflow nie zadawaj 20 pytań

Dodatkowo z briefa zadania:
- NIE używać `--no-verify`
- NIE osłabiać guardów
- NIE udawać DONE bez evidence
- NIE importować legacy runtime
- NIE dotykać Supabase / Railway / db
- NIE dotykać domen V2 backendu (`server/domains-v2/`) ani frontu (`client/src/features-v2/`)
- NIE robić cross-domain deep importów
- Status `IMPLEMENTED` jest ZABRONIONY dla tej pracy — to `UI_SHELL_ONLY` / `MOCK_LOCAL_ONLY` / `BACKEND_NOT_STARTED`

## Co zrobić jeśli coś pada

Jeśli któryś z gate'ów po raporcie nadal pada:
1. NIE commituj
2. Diagnoza: przeczytaj komunikat błędu
3. Najczęstsze: brakujące pole w PRE-COMMIT DECISION lub SELF-AUDIT (scripts/check-pre-commit-decision.mjs i scripts/check-self-audit-evidence.mjs mają konkretne wymagane string-matche)
4. Jeśli sytuacja jest realnie blocked — raport STATUS: `BLOCKED`, wyjaśnij dlaczego, nie commituj
