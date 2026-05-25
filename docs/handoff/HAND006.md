# HAND006 — PROFILE_RUNTIME_WIRING_IDENTITY_AND_MEDIA_REFS (step-33)

> **Trigger:** user wpisze `hand006`. Działaj autonomicznie, po polsku.
> **Status:** PENDING — **BLOCKED do czasu merge step-32 (HAND005)**. Pre-flight wymaga media avatar/banner runtime na main.
> identity runtime = OK (PR #17). media runtime = jeszcze NIE na main → jeśli zaczynasz teraz, pre-flight da `BLOCKED: MEDIA_AVATAR_BANNER_RUNTIME_NOT_MERGED`. Zrób najpierw HAND005.

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
PROFILE_RUNTIME_WIRING_IDENTITY_AND_MEDIA_REFS

CEL:
Podpiąć istniejący /profile pod realne boundary identity + media refs:
- pobieranie mojego profilu,
- pobieranie publicznego profilu,
- update private profile,
- avatarMediaRef/bannerMediaRef z media domain,
- zachowanie visual shell 1:1,
- bez feed runtime.

TO JEST:
- profile runtime wiring partial,
- integration layer między app-v2/profile a identity public-api/contract,
- użycie media refs, jeśli media runtime jest gotowy.

TO NIE JEST:
- friend feed runtime,
- social graph,
- comments/reactions runtime,
- professional profile pełny backend,
- Railway,
- production deploy,
- live db push,
- migracje live.

PRE-FLIGHT:
1. git fetch origin
2. git checkout main
3. git pull --ff-only origin main
4. git status

Jeśli working tree nie jest clean:
zakończ jako BLOCKED: WORKING_TREE_NOT_CLEAN.

Sprawdź, że na main są:
- Supabase Auth adapter,
- identity profile persistence runtime,
- media avatar/banner runtime,
- /profile UI shell,
- guard hardening,
- docs/profile/PROFILE_RUNTIME_LOGIC_BLUEPRINT_FROM_LEGACY.md.

Jeśli identity runtime nie jest na main:
zakończ jako BLOCKED: IDENTITY_PROFILE_RUNTIME_NOT_MERGED.

Jeśli media runtime nie jest na main:
zakończ jako BLOCKED: MEDIA_AVATAR_BANNER_RUNTIME_NOT_MERGED.

Utwórz branch:
git checkout -b feat/profile-runtime-wiring

ARCHITEKTURA:
- app-v2/profile może składać UI i adaptery widoku.
- identity jest właścicielem profilu.
- media jest właścicielem assetów.
- profile UI nie importuje repository/service internals.
- cross-domain tylko przez public-api/contracts/events.
- profil zawodowy pozostaje layer tego samego profilu identity.
- feed preview nadal jest visual shell/mock; feed runtime później przez content-v2/social.

ZAKRES:
1. Dodaj profile data adapter/use-case dla app-v2:
   - getMyProfileView()
   - getPublicProfileView(userId)
   - updateMyProfile(input)
   - map identity DTO + media refs do ProfileViewModel.

2. Podłącz /profile:
   - dla zalogowanego usera pobierz mój profil przez identity boundary,
   - jeśli brak profilu, pokaż empty/onboarding-required state,
   - update bio/status/podstawowych pól przez updatePrivateProfile,
   - avatar/banner pokazuj przez media ref/public URL abstraction,
   - błędy runtime pokaż w UI.

3. Nie zmieniaj wyglądu bez potrzeby.
   Zachowaj mobile-first i aktualny visual shell.

4. Profil zawodowy:
   - nie twórz nowego backendu zawodowego,
   - jeśli dane zawodowe nie mają runtime, zostaw jako MOCK_LOCAL_ONLY / PROFESSIONAL_RUNTIME_NOT_STARTED,
   - nie fake DONE.

5. Quick feed preview:
   - zostaje visual shell/mock,
   - nie podłączaj content-v2/social,
   - nie rób prawdziwych komentarzy/reakcji.

6. Media:
   - używaj avatarMediaRef/bannerMediaRef,
   - nie przechowuj plików w identity,
   - nie używaj base64/dataUrl,
   - nie używaj readAsDataURL.

7. Auth/session:
   - użyj istniejącego Supabase Auth adaptera / identity auth boundary,
   - nie importuj Supabase SDK bezpośrednio w UI,
   - nie zapisuj sesji w localStorage/sessionStorage jako fake backend.

PII:
- PublicProfileDTO/ProfileView publiczny bez email/phone/dateOfBirth.
- Private fields tylko dla ownera.
- Nie loguj PII.
- Nie wystawiaj PII w renderze publicznym.

ZAKAZANE:
- legacy runtime imports,
- hooks/tRPC/Supabase coupling z legacy,
- direct Supabase SDK w UI,
- repository/service deep imports,
- SERVICE_ROLE_KEY we froncie,
- DATABASE_URL we froncie,
- public PII,
- db push,
- live migrations,
- Railway,
- base64/dataUrl,
- readAsDataURL,
- localStorage/sessionStorage fake backend,
- fake DONE,
- no-op buttons,
- osłabianie guardów,
- --no-verify,
- direct push do main.

TESTY:
Dodaj/aktualizuj testy:
- /profile używa profile runtime adaptera,
- owner dostaje PrivateProfile view bez publicznego wycieku PII,
- public profile nie zawiera email/phone/dateOfBirth,
- updateMyProfile woła identity boundary,
- avatarMediaRef/bannerMediaRef są mapowane przez media boundary,
- brak Supabase SDK importu w profile UI,
- brak identity repository/service deep importów w app-v2,
- empty state dla braku profilu,
- error state dla runtime błędu,
- professional layer nadal nie udaje backendu,
- quick feed preview nadal mock/visual shell,
- brak localStorage/sessionStorage fake backend,
- brak base64/dataUrl/readAsDataURL,
- guardy jakości PASS.

DOKUMENTACJA:
Dodaj raport:
docs/review/step-33-profile-runtime-wiring/STEP_33_REVIEW.md

Raport ma zawierać:
- status: PROFILE_RUNTIME_WIRING_PR_READY albo BLOCKED,
- zakres,
- zmienione pliki,
- Architecture Impact Statement,
- identity integration summary,
- media refs integration summary,
- public/private DTO safety,
- no public PII,
- no feed runtime,
- no professional backend runtime,
- no live db push,
- no Railway,
- no legacy runtime imports,
- status truth:
  PROFILE_RUNTIME_PARTIAL
  IDENTITY_PROFILE_RUNTIME_PARTIAL
  MEDIA_REFS_RUNTIME_PARTIAL
  PROFESSIONAL_PROFILE_RUNTIME_NOT_STARTED
  FEED_RUNTIME_NOT_STARTED
- wyniki gate'ów,
- honest limitations.

Zaktualizuj:
- docs/review/REVIEW_REPORTS_INDEX.md
- docs/architecture/PlatformaX-V2-domain-status.md, jeśli istnieje i wymaga aktualizacji
- feature-registry/status docs, jeśli dotyczy
- README profile/identity/media, jeśli istnieją

PRZED COMMIT:
Wypisz:
- zmienione pliki,
- dotknięte domeny,
- runtime boundaries,
- DTO public/private,
- największe pliki i liczby linii,
- status truth changes,
- potwierdź:
  no legacy runtime imports,
  no public PII,
  no direct Supabase SDK in UI,
  no repository/service deep imports,
  no db push,
  no live migrations,
  no Railway,
  no fake DONE,
  no separate professional-profile domain,
  no weakened guards.

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
- napraw albo zakończ jako BLOCKED.
- raport ma mówić prawdę.

JEŚLI WSZYSTKO PASS:
1. Commit:
   feat(profile): wire profile to identity and media refs

2. Push:
   git push origin feat/profile-runtime-wiring

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
- co zrobiono,
- czy /profile używa identity boundary,
- czy avatar/banner używają media refs,
- czy public profile nie ma PII,
- czego świadomie NIE zrobiono,
- ZIP_NOT_GENERATED_BY_OPUS.

---

## Notatki dla przejmującego (NIE część oryginalnej komendy)
- Scope `profile` nie istnieje w commitlint enum → użyj `v2` (lub `identity`), odnotuj.
- Identity public-api do użycia: `@server/domains-v2/identity/public-api` (`createIdentityService`, `getMyProfile`/`getPublicProfile`/`updatePrivateProfile`, DTO). Frontowy adapter już istnieje: `client/src/features-v2/identity/profile/profile-adapter.ts` (in-memory, `isPersistent:false`) — rozbuduj/podłącz go, nie rób deep importów internals.
- ProfilePage i komponenty profilu: `client/src/app-v2/profile/` (styles rozbite na moduły < 360 linii). Zachowaj visual shell.
- Pre-flight wymaga media runtime — najpierw HAND005 (step-32) musi być zmergowane.
