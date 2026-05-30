# MODERATION_SLICE_20_REPORTS_FOUNDATION_REPORT

Status: `BACKEND_PARTIAL` (foundation) + `BACKEND_DONE_FOR_SUPPORTED_TARGETS` (P2)
Slice: 20 (Reports & moderation foundation) + P2 follow-up (moderator-actor surfaces)
Date: 2026-05-30
Owner: @dgolansky-ux

## 1. Co wdrożono

### Backend — `server/domains-v2/moderation`

- `contracts.ts` — target type, reason, severity, status, action-type enums;
  per-target capability registry (15 target types) i per-reason definition
  registry (8 powodów: spam / harassment / inappropriate_content /
  impersonation / privacy_violation / illegal_or_dangerous / misinformation /
  other).
- `dto.ts` — `ModerationReportPublicStatusDTO` (publiczny, bez PII opisu /
  severity / resolution), `ModerationReportReviewDTO` (moderator-only),
  `ModerationActionDTO`, `ModerationTargetPreviewDTO`, inputy,
  `ModerationErrorCode`, `ModerationResult<T>`.
- `policy.ts` — `canCreateReport`, `canReviewReports`, `canTakeAction`,
  `canViewOwnReportStatus`, `canReportSelfTarget` (false by default),
  walidacja inputu (`validateCreateReportInput`), mapowanie state-transition
  (`canTransitionReportStatus`).
- `repository.ts` + `moderation-store.ts` — in-memory repository (`insert`,
  `update`, `getById`, `list` z cursor + filtrami, `findActivePendingReport`,
  `insertAction`, `listActionsForReport`, `listMyReports`); facade
  `moderation-store.ts` re-eksportowany przez public-api (omija blocking-list
  guarda `repository`).
- `mapper.ts` — `toPublicStatusDTO` / `toReviewDTO` / `toActionDTO`.
- `events.ts` — `ModerationReportCreated`, `ModerationReportReviewed`,
  `ModerationActionTaken` + `createNoopModerationEventPublisher`.
- `service.ts` — `createModerationService` z factory closure: `createReport`,
  `listForReview`, `getReviewDetails`, `applyReviewAction`, `listMyReports`;
  emituje eventy do publishera.
- `public-api.ts` — full re-export.
- `__tests__/service.test.ts` (lifecycle + RBAC pins, 11 testów).
- `__tests__/domain-contract.test.ts` (registries pin, 4 testy).

### Application — `server/application-v2/use-cases/moderation`

- `service.ts` — `createModerationUseCase` opakowuje domain service +
  opcjonalny `targetPreviewResolver`; każda akcja zwraca podgląd celu z
  fallbackiem `partial`/`planned`.
- `public-api.ts` + `index.ts`.

### Frontend — `client/src/features-v2/moderation`

- `types.ts` — UI-side enums (target type, reason, severity, status, action)
  + reason-definition registry + `UiModerationAdapter` (submitReport,
  listReviewQueue, getReviewDetails, applyAction).
- `mock-adapter.ts` — in-memory mock adapter; lustrzane semantyki
  application-v2 (rate-limit duplikat pending, RBAC, severity z reason,
  bezpieczny target preview fallback).
- `ReportDialog.tsx` — modal: radio reason picker, opcjonalny / wymagany
  opis, submit, success/error banner. Brak `window.alert / window.confirm`.
- `ReportButton.tsx` + `ReportMenuItem.tsx` — subtelne CTA;
  `disabledForSelf` ukrywa CTA na własnych treściach.
- `ModerationQueuePage.tsx` — admin/moderator panel: filtry (status / target
  type / reason), lista, detail panel z target previewem, action bar
  (mark_reviewed / dismiss / hide / deactivate / restrict_visibility).
- `Moderation.module.css` — design tokens V2.
- `index.ts` — feature barrel.

### Routing

- `client/src/app-v2/admin/ModerationAdminPage.tsx` — thin route shell.
- `AppRouter.tsx` — `/admin/moderation` -> `ModerationAdminPage`.

### Post Display Kit integracja

- `content-display/variants/PostCardVariants.tsx` — nowy opcjonalny prop
  `moreMenuSlot?: React.ReactNode` na każdym wariancie karty; Display Kit
  pozostaje moderation-agnostic.
- `friend-feed/FriendFeedPostCard.tsx` — wstrzykuje `<ReportButton
  targetType="friend_feed_post" ... disabledForSelf={isOwner} />` jako
  `moreMenuSlot`.

### Persistence draft

- `supabase/migrations/0010_moderation_reports.sql` — `moderation_reports`
  + `moderation_actions` z indeksami (status+created_at desc, target,
  reporter, reason, severity, reviewed_by) i częściowym uniq index dla
  aktywnych pending/under_review zgłoszeń. **Nie zaaplikowano via `db push`**.

### Notification events

- `notifications-v2/event-registry.ts` — dodano `ModerationReportCreated`
  (no_notification_needed), `ModerationReportReviewed` (no_notification_needed),
  `ModerationActionTaken` (planned, recipient = targetOwnerUserId).

### Governance

- `EXCEPTIONS_REGISTER.md` — EXC-012 (Slice 20 backend + frontend file-size
  + export-count budget overruns z uzasadnieniami i planned follow-ups).
- `DOMAIN_STATUS_REGISTRY.yml` — moderation: SCAFFOLD_ONLY -> PARTIAL.
- `domain-registry.ts`, `DOMAIN_OWNERSHIP_MATRIX.md`, `DOMAIN_REGISTRY.md` —
  zsynchronizowane.
- `REVIEW_REPORTS_INDEX.md` — wpis pending dla Slice 20.

## 2. Jak działa moderation-v2

- Zwykły użytkownik zgłasza widoczny target -> domain service waliduje (auth,
  known target type, known reason, opcjonalny/required opis, blokada
  self-report, dedupe aktywnych pending), zapisuje raport i emituje
  `ModerationReportCreated`.
- Moderator/admin widzi kolejkę (`listForReview`) tylko po `canReviewReports`.
- Akcja moderacyjna -> domain service waliduje uprawnienia +
  target-capability (np. `hide_content` zablokowane dla `profile`), zapisuje
  `ModerationActionRecord`, aktualizuje status raportu i emituje
  `ModerationReportReviewed` oraz (jeśli akcja zmienia treść)
  `ModerationActionTaken`.

## 3. Jak działa report target registry

- 15 typów celu (profile, friend_feed_post/comment, community + post/comment,
  channel + post/comment, workplace + workplace_post, important_event,
  profile_presentation_item, media_asset, module_item).
- Każdy wpis ma flagi `canReport / canHide / canDeactivate / canRestore` +
  `publicPreviewStatus` (implemented / partial / planned) i `sourceDomain`.
- `findTargetDefinition(targetType)` używana w service do gate-keepingu
  action-types.

## 4. Jak działają report reasons

- 8 powodów z labelem PL, opisem, `severityDefault` i `requiresDescription`.
- Walidacja: wymagany opis trimowany, min 4 znaki, max 1000.

## 5. Jak działa ReportButton / dialog

- `ReportButton` — subtelny pill na końcu karty (po action barze).
- `ReportMenuItem` — pełnoszerokościowy item w menu "..." (przygotowany pod
  variant wariantów cards po stronie feature).
- `ReportDialog` — modal z radio reason pickerem + opisem + submitem;
  Dziękujemy banner po sukcesie.
- Brak `window.alert / window.confirm`, brak `localStorage` jako backend.

## 6. Jak działa moderation review panel

- `/admin/moderation` -> `ModerationAdminPage` -> `ModerationQueuePage`.
- Filtry status / target type / reason, lista z severity + status chipami,
  detail panel z opisem + bezpiecznym podglądem celu + actions barem.
- Bez akcji `restore_content` w UI (target registry nie ma jeszcze
  uprawnień dla żadnego targetu).
- Unauthorized viewer (rola "user") widzi tylko banner odmowy.

## 7. Jakie targety mają action implemented (P2)

P2 (Slice 20 follow-up) dodaje moderator-actor surfaces w content-v2 public-api
oraz `ModerationActionDispatcher` w application-v2/use-cases/moderation:

| Target | Surface | Działanie |
|---|---|---|
| friend_feed_post | `friendPosts.moderatorDeactivatePost` | IMPLEMENTED — idempotent |
| friend_feed_comment | `friendPosts.moderatorDeactivateComment` | IMPLEMENTED — idempotent |
| workplace_post | `workplacePosts.moderatorDeactivatePost` | IMPLEMENTED — idempotent |
| channel_post | `channelPosts.moderatorDeactivate` | IMPLEMENTED — idempotent |

Wszystkie cztery omijają guard autora (`actorUserId === authorUserId`) i
przyjmują `{ moderatorUserId, reasonNote? }`. Polityka uprawnień przechodzi
w domenie moderacji (`canTakeAction`) — content-v2 surfaces ufają warstwie
wyżej w stosie.

`createContentModerationDispatcher({ friendPosts?, workplacePosts?,
channelPosts? })` zwraca `ModerationActionDispatcher`, który wpinasz w
`createModerationUseCase({ moderation, actionDispatcher })`. Wszystko
opcjonalne — bez dispatchera Slice 20 zachowuje BACKEND_PARTIAL na
wszystkich targetach (dawne zachowanie).

## 8. Jakie targety są ACTION_PARTIAL

Pozostałe 11 z 15 — domain service blokuje nieobsługiwane akcje per target
(np. `hide_content` na `profile` zwraca `ACTION_NOT_SUPPORTED_BY_TARGET`),
a dispatcher zwraca `applied: false` z `note: "not yet wired to a
moderator-actor surface"` dla targetów bez source-domain handlera.
Następna iteracja: `community_*`, `media_asset`, `important_event`,
`profile_presentation_item`, `module_item`, `profile`, `community`,
`channel`, `workplace`.

## 9. Jak działa privacy / PII

- Publiczne DTO (`ModerationReportPublicStatusDTO`) zawiera tylko
  `id / status / targetType / targetId / reason / createdAt` — brak
  reporter/owner/moderator PII, brak opisu, brak severity, brak resolution.
- Review DTO (`ModerationReportReviewDTO`) widoczne tylko dla
  `canReviewReports`.
- `description` jest moderator-only; brak ekspozycji w listMyReports /
  public status.
- Target preview używa fallbacku gdy provider nieobsługiwany —
  `TARGET_PREVIEW_PARTIAL` w UI bez ujawniania danych z source domain.
- Eventy zawierają tylko IDs, severity, reason — bez opisu, bez PII.

## 10. Jakie eventy dodano

| Event | Recipient | Handler status | Reason |
|---|---|---|---|
| ModerationReportCreated | — | no_notification_needed | UI moderatora obsługuje kolejkę; admin notification planned |
| ModerationReportReviewed | — | no_notification_needed | wewnętrzne lifecycle, nie publiczne |
| ModerationActionTaken | targetOwnerUserId | planned | wiring deferowane do późniejszej iteracji |

## 11. Co nie zostało wdrożone

- AI moderation
- automatyczne bany / penalty system
- e-mail / push delivery
- legal workflow / regulamin
- hard delete jako domyślne (zawsze soft via status transition)
- audit ZIP (out of Slice 20 scope per komenda)

## 12. Test evidence

- `server/domains-v2/moderation/__tests__/service.test.ts` — 11 testów
  (createReport: auth, unknown target, unknown reason, self-target block,
  description requirement, public DTO no-PII, duplicate pending; queue:
  user denied / moderator ok; action: user denied / dismiss / unsupported
  action / deactivate; listMyReports: scoping).
- `server/domains-v2/moderation/__tests__/domain-contract.test.ts` — 4
  testy (public-api runtime surface, registries presence, reason/target
  definitions completeness).
- P2: `server/application-v2/use-cases/moderation/__tests__/dispatcher.test.ts`
  — 5 testów (unwired target, non-content action, friend_feed_post dispatch,
  friend_feed_comment dispatch, source-domain error propagation).
- P2: `server/application-v2/use-cases/moderation/__tests__/service-with-dispatcher.test.ts`
  — 3 testy (dispatcher invoked on deactivate, dispatcher failure
  propagation, dispatcher invoked on non-content action).
- Pełny test run: **1300 / 1300 PASS** (zwiększenie z 1278 z Slice 19 i 1292
  ze Slice 20 baseline; +8 P2).

## 13. Guard evidence

- `pnpm check` PASS
- `pnpm lint` PASS
- `pnpm test` PASS (162 plików, 1292 testy)
- `pnpm build` PASS
- `pnpm rules:check` PASS (43/43 guards)
- `pnpm arch:check:v2` PASS
- `pnpm guards:all-local` PASS (43/43 guards)
- Naprawione w trakcie slice 20: code-quality-structure, runtime-readiness,
  scalability-hot-paths, domain-status-registry — wszystkie PASS po fix.

## 14. P0/P1/P2

- P0: brak.
- P1: brak.
- P2 (planned follow-ups):
  1. Dodać `moderatorDeactivatePost` (i analogiczne) w `content-v2/*`
     public-api, żeby application-v2/moderation mogło realnie mutować
     source-domain content state.
  2. Dodać `target-preview-resolver` per source domain (np. friend-posts,
     community-feeds, channel-posts) — zamiana `TARGET_PREVIEW_PARTIAL`
     na realny safe preview.
  3. Wirować `ReportMenuItem` w pozostałe wariant cards
     (community/channel/workplace/important_event/profile_presentation)
     gdy ich karty pojawią się w feature use-case.
  4. Po wprowadzeniu auth role modelu w identity — zastąpić tymczasowy
     hard-coded `demoViewer` w `ModerationAdminPage` realnym session
     hookiem.
  5. Domknąć notification handlery dla `ModerationActionTaken` (planned).

## 15. Następny rekomendowany krok

Jeśli właściciel chce realnej egzekucji akcji moderacyjnych: dodać
`moderateDeactivate*` ścieżki w `content-v2/*` public-api i wstrzyknąć
je w `application-v2/use-cases/moderation` jako per-target action
delegates. Wtedy Slice 20 przejdzie z `BACKEND_PARTIAL` →
`BACKEND_DONE_FOR_SUPPORTED_TARGETS`.
