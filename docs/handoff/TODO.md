# TODO / Kolejka zadań — PlatformaX V2

> Cel tego pliku: trwała kolejka zadań, żeby **inny Claude mógł przejąć** niedokończoną
> pracę, jeśli poprzedni nie zdążył przed końcem tokenów. Każde zadanie ma osobny plik
> handoff z **pełną, dosłowną komendą** (`docs/handoff/HAND00N.md`). Trigger: user wpisuje
> `hand00N` → otwierasz `HAND00N.md` i działasz autonomicznie po polsku.
>
> Zasady nadrzędne (zawsze): NIE generuj ZIP-a (`ZIP_NOT_GENERATED_BY_OPUS`), NIE `--no-verify`,
> NIE osłabiaj guardów, NIE direct push do main, NIE fake DONE. Zasady kodowania/governance wygrywają z komendą.

Ostatnia aktualizacja: 2026-05-25.

## Stan main (punkt odniesienia)

- `origin/main` HEAD: `9f64ec2 feat(media): add avatar and banner upload runtime (#20)`
- Na main są: Supabase Auth adapter (#11), auth/register/onboarding shell (#9/#10), `/onboarding`, `/profile` (#12–#16),
  guard hardening (#18 `06b0afb`), identity profile persistence + onboarding runtime (#17 `91ca595`),
  media avatar/banner upload-intent runtime (#20 `9f64ec2`, env-required storage),
  `docs/profile/PROFILE_RUNTIME_LOGIC_BLUEPRINT_FROM_LEGACY.md`.

## Kolejka (PENDING)

| # | Zadanie | Handoff | Pre-flight zależności | Status |
|---|---|---|---|---|
| 1 | `PROFILE_RUNTIME_WIRING_IDENTITY_AND_MEDIA_REFS` (step-33) | [HAND006](HAND006.md) | identity = OK (#17); media runtime = **OK (#20)** → **ODBLOKOWANE** | PENDING |
| 2 | `PROFILE_FULL_PARITY_AND_CODE_QUALITY_FIXES` (step-29) | [HAND004](HAND004.md) | guard hardening na main = **OK (PR #18)** → **ODBLOKOWANE** | PENDING |

### Rekomendowana kolejność
`step-33 (profile wiring)` → `step-29 (profile parity)`.
- Oba są odblokowane.
- step-29 i step-33 mocno dotykają tego samego obszaru `client/src/app-v2/profile` — rób je po kolei, nie równolegle, żeby uniknąć konfliktów.

## DONE (log, nie ruszać)

- **step-32 / `MEDIA_AVATAR_BANNER_UPLOAD_RUNTIME`** — zmergowane jako **PR #20** (`9f64ec2`).
  Domena `media` SCAFFOLD_ONLY→PARTIAL (DTO/policy/service/repository in-memory + env-required storage port),
  `features-v2/media` adapter, profile avatar/banner upload sheet (walidacja + object-URL preview + disabled-policy save).
  Migracja `0002_media_assets.sql` jako kod. Status: `STORAGE_ADAPTER_ENV_REQUIRED`, `LIVE_UPLOAD_NOT_STARTED`,
  media ref NIE jest jeszcze zapisywany na profilu identity (to step-33). Raport: `docs/review/step-32-media-avatar-banner-runtime/STEP_32_REPORT.md`.
- **step-31 / `IDENTITY_PROFILE_PERSISTENCE_AND_ONBOARDING_RUNTIME`** — zmergowane jako **PR #17** (`91ca595`).
  Uwaga: w repo udokumentowane jako `docs/review/step-27-identity-profile-persistence/STEP_27_REPORT.md` (nie powstał osobny step-31 report, bo deliverable był już w PR #17).
  Status truth: persistence in-memory (`isPersistent:false`), migracja `supabase/migrations/0001_identity_private_profiles.sql` jako kod, **brak live db push**.
- **Merge guardów + identity** — PR #18 (`06b0afb`, guard hardening) i PR #17 zmergowane do main w tej kolejności.

## Uwagi środowiskowe (WAŻNE dla kolejnego Claude)
- Zaobserwowano `git reset --hard` mojego lokalnego brancha na `origin/main` w trakcie merge (reflog), mimo braku hooków Claude i braku hooka husky na merge — możliwa **równoległa sesja/proces** na tym katalogu. Sprawdź `git status`/reflog na starcie; nic nie zginęło, ale uważaj na czyszczenie lokalnej pracy. Untracked pliki (jak ten TODO) przeżywają `reset --hard`.
- `.husky/pre-push` odpala **pełny `pnpm lint` (eslint .)** — każdy untracked śmieć w root (np. stray `_tmp_*.mjs`) zablokuje push. `.husky/pre-commit` używa `lint:v2` (tylko V2). Trzymaj working tree czysty przed pushem.
- Scope commitlint enum: `v2, governance, guards, architecture, routing, identity, social, content, media, system, ci, docs`. Jeśli komenda każe użyć scope `profile` — nie istnieje; użyj najbliższego (`v2`/`identity`/`media`) i odnotuj w raporcie.
- Raporty review: walidowane są nazwy `STEP_NN_REPORT.md` (przez `check-pre-commit-decision`/`check-self-audit`), nie `_REVIEW.md` — sprawdź `scripts/check-review-reports-index.mjs` i istniejące raporty przed wyborem nazwy.
- **Stan git po housekeepingu handoffów (oczekiwany, NIE blokujący):** usunięto (staged) `docs/handoff/HAND001.md` i `HAND003.md` (stare/nieaktualne), dodano untracked `docs/handoff/{TODO,HAND004,HAND005,HAND006}.md`. To jedyna „brudna" rzecz w drzewie i jest to **meta-scaffolding**, nie zmiana produktu. Jeśli pre-flight zadania wymaga clean tree — to NIE jest realny `WORKING_TREE_NOT_CLEAN` w kodzie; albo zignoruj te meta-pliki, albo (czyściej) zacommituj je osobno jako `docs(handoff): ...` na własnym branchu + PR. Untracked pliki przeżyją `git reset --hard`; staged deletion HAND001/003 może cofnąć ewentualny reset.
