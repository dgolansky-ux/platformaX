# HAND005 — MEDIA_AVATAR_BANNER_UPLOAD_RUNTIME (step-32)

> **Trigger:** user wpisze `hand005`. Działaj autonomicznie, po polsku.
> **Status:** PENDING — **NASTĘPNE W KOLEJCE**. **Pre-flight zależność:** identity profile persistence na main = OK (PR #17 `91ca595`) → ODBLOKOWANE.
> Blokuje step-33 (HAND006), które wymaga media runtime na main.

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
MEDIA_AVATAR_BANNER_UPLOAD_RUNTIME

CEL:
Dodać pierwszy runtime media dla profilu:
- avatar upload,
- banner upload,
- media refs dla identity profile,
- walidacja plików,
- bez base64/dataUrl,
- czysty media domain,
- integracja z profile UI jako runtime partial.

TO JEST:
- media domain slice,
- avatar/banner runtime partial,
- przygotowanie pod profil osobisty/zawodowy.

TO NIE JEST:
- pełny CDN,
- image cropper 1:1 final,
- feed media,
- chat media,
- Railway,
- production setup,
- live db push.

PRE-FLIGHT:
1. git fetch origin
2. git checkout main
3. git pull --ff-only origin main
4. git status

Jeśli working tree nie jest clean:
zakończ jako BLOCKED: WORKING_TREE_NOT_CLEAN.

5. Sprawdź, że na main są:
- Supabase Auth adapter,
- identity profile persistence runtime,
- onboarding runtime partial,
- /profile,
- docs/profile/PROFILE_RUNTIME_LOGIC_BLUEPRINT_FROM_LEGACY.md.

Jeśli identity profile persistence nie jest na main:
zakończ jako BLOCKED: IDENTITY_PROFILE_RUNTIME_NOT_MERGED.

6. Utwórz branch:
git checkout -b feat/media-avatar-banner-runtime

ARCHITEKTURA:
Media domain posiada:
- media asset metadata,
- validation,
- owned refs,
- publicUrl/cdnUrl abstraction,
- upload intent/presigned flow albo bezpieczny adapter,
- zero base64/dataUrl.

Identity profile trzyma tylko:
- avatarMediaRef
- bannerMediaRef

Identity NIE przechowuje pliku.
Media NIE posiada profilu.
Cross-domain tylko przez public-api/contracts/events.

STRUKTURA:
Użyj istniejącego wzorca albo utwórz:

server/domains-v2/media/
- public-api.ts
- contracts.ts
- dto.ts
- policy.ts
- service.ts
- repository.ts
- mapper.ts
- events.ts, jeśli potrzebne
- README.md
- tests

ZAKRES MEDIA:
Dodaj:
- MediaAssetDTO
- MediaRefDTO
- UploadIntentDTO
- createAvatarUploadIntent(userId, fileMeta)
- createBannerUploadIntent(userId, fileMeta)
- confirmProfileMediaUpload(userId, mediaAssetId)
- getPublicMediaUrl(mediaRef)

WALIDACJA:
- allowed MIME: image/jpeg, image/png, image/webp
- max avatar size
- max banner size
- reject svg unless explicitly justified
- reject base64/dataUrl
- reject unknown MIME
- owner required
- stable media ref

SUPABASE STORAGE:
Jeśli projekt ma Supabase Storage adapter pattern:
- dodaj adapter zgodnie z boundary.
- nie dawaj SERVICE_ROLE_KEY do frontu.
- nie hardcoduj bucketów/URL.
- nie twórz bucketów live.
- nie rób produkcyjnego setupu.

Jeśli nie ma jeszcze backend transport/storage pattern:
- dodaj MediaStoragePort interface,
- dodaj test/in-memory adapter,
- dodaj SupabaseStorageAdapter jako NOT_CONNECTED/ENV_REQUIRED tylko jeśli da się to zrobić czysto,
- raport musi jasno rozdzielać:
  MEDIA_DOMAIN_RUNTIME_PARTIAL
  STORAGE_ADAPTER_ENV_REQUIRED
  LIVE_UPLOAD_NOT_STARTED

UI PROFILE:
Podepnij profil UI do media boundary jako runtime partial:
- avatar edit button otwiera modal/sheet upload shell,
- banner edit button otwiera modal/sheet upload shell,
- wybór pliku przechodzi przez walidację,
- błędy walidacji są pokazane,
- sukces aktualizuje local/runtime state zgodnie z aktualnym adapterem,
- jeśli brak realnego storage transportu, pokaż jasny disabled/policy/runtime state.

NIE używaj:
- FileReader.readAsDataURL
- base64 preview
- localStorage/sessionStorage persistence
- fake success jako final backend.

Preview lokalny może użyć:
- URL.createObjectURL
ale musi mieć:
- revokeObjectURL cleanup.

IDENTITY INTEGRATION:
Jeśli identity profile runtime ma updatePrivateProfile:
- aktualizuj avatarMediaRef/bannerMediaRef przez identity public API/contract.
- nie importuj identity internals.
- nie rób deep importów repository/service.

MIGRACJE:
Jeśli repo ma migration pattern:
- dodaj migration file dla media_assets, jeśli potrzebne.
- NIE rób live db push.
- NIE uruchamiaj migracji zdalnie.

Tabela/model powinien wspierać:
- id
- owner_type
- owner_id
- purpose avatar/banner
- provider
- storage_path
- public_url/cdn_url nullable
- mime_type
- size_bytes
- width/height nullable
- status
- created_at
- updated_at

ZAKAZANE:
- legacy runtime imports,
- hooks/tRPC/Supabase coupling z legacy,
- SERVICE_ROLE_KEY we froncie,
- DATABASE_URL we froncie,
- base64/dataUrl,
- FileReader.readAsDataURL,
- db push,
- live migrations,
- Railway,
- public PII,
- fake DONE,
- no-op buttons,
- osłabianie guardów,
- --no-verify,
- direct push do main.

TESTY:
Dodaj/aktualizuj testy:
- avatar upload intent wymaga ownera,
- banner upload intent wymaga ownera,
- MIME validation działa,
- size validation działa,
- svg/unknown MIME reject,
- base64/dataUrl reject,
- MediaAssetDTO nie zawiera prywatnych danych,
- identity trzyma tylko media ref,
- profile avatar/banner UI pokazuje validation errors,
- URL.createObjectURL ma cleanup,
- brak readAsDataURL,
- brak SERVICE_ROLE_KEY/DATABASE_URL w client,
- brak legacy imports,
- no db push/live migrations,
- no direct cross-domain internals.

DOKUMENTACJA:
Dodaj raport:
docs/review/step-32-media-avatar-banner-runtime/STEP_32_REVIEW.md

Raport ma zawierać:
- status: MEDIA_AVATAR_BANNER_RUNTIME_PR_READY albo BLOCKED,
- zakres,
- zmienione pliki,
- Architecture Impact Statement,
- media domain summary,
- identity integration summary,
- storage adapter status,
- migration summary, jeśli dodano migration file,
- no base64/dataUrl,
- no live db push,
- no Railway,
- no legacy runtime imports,
- status truth:
  MEDIA_AVATAR_BANNER_RUNTIME_PARTIAL
  STORAGE_ADAPTER_ENV_REQUIRED albo STORAGE_ADAPTER_PARTIAL
  PROFILE_MEDIA_REFS_PARTIAL
  FEED_MEDIA_NOT_STARTED
- wyniki gate'ów,
- honest limitations.

Zaktualizuj:
- docs/review/REVIEW_REPORTS_INDEX.md
- docs/architecture/PlatformaX-V2-domain-status.md, jeśli istnieje
- feature-registry/status docs, jeśli dotyczy
- README media/identity, jeśli istnieją.

PRZED COMMIT:
Wypisz:
- zmienione pliki,
- dotknięte domeny,
- DTO/contract summary,
- policy summary,
- największe pliki i liczby linii,
- status truth changes,
- potwierdź:
  no legacy runtime imports,
  no base64/dataUrl,
  no readAsDataURL,
  no public PII,
  no db push,
  no live migrations,
  no Railway,
  no fake DONE,
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

JEŚLI WSZYSTKO PASS:
1. Commit:
   feat(media): add avatar and banner upload runtime

2. Push:
   git push origin feat/media-avatar-banner-runtime

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
- jakie DTO/policy/adaptery dodano,
- czy avatar/banner są podpięte jako runtime partial,
- czy live db push NIE był uruchamiany,
- czego świadomie NIE zrobiono,
- ZIP_NOT_GENERATED_BY_OPUS.

---

## Notatki dla przejmującego (NIE część oryginalnej komendy)
- Wzorzec domeny do skopiowania: `server/domains-v2/identity/` (public-api.ts, contracts.ts, dto.ts, policy.ts, service.ts, repository.ts (interface + in-memory), mapper.ts, events.ts, internal/, __tests__/). Migracja jako kod: `supabase/migrations/0001_identity_private_profiles.sql` (NIE aplikowana, RLS fail-closed) — analogicznie zrób `000N_media_assets.sql`.
- Guardy skanujące zakazane stringi (`check-media-base64` blokuje `readAsDataURL`/`dataUrl`/`base64`, secret/env scanners) działają na `client/src`+`server`. W testach asercje typu „brak base64/readAsDataURL" buduj przez konkatenację (`"read"+"AsDataURL"`), inaczej guard FAIL na pliku testowym.
- Scope commitlint: `media` JEST w enum → commit `feat(media): ...` przejdzie.
- `MediaAssetRef`/`MediaAssetDTO` już istnieje typ `MediaAssetRef = { assetId: string }` w identity dto.ts — media domain ma być WŁAŚCICIELEM assetu; identity trzyma tylko ref. Nie rób cross-importu internals.
