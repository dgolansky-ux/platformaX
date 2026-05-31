# SLICE 20C — Slice-by-Slice Audit (Slice 1 → Slice 20B)

Status legenda: PASS, PARTIAL, GAP, BROKEN, DOC_ONLY, UI_SHELL_ONLY, BACKEND_ONLY, DEAD_CODE, PLACEHOLDER, FAKE, PII_RISK.

**Globalna konwencja platformy:** całość frontu Slice 1-20B pracuje na `MOCK_LOCAL_ONLY` adapterach (per-feature `*-mock-adapter.ts`), domeny backendowe są `BACKEND_PARTIAL` (services + DTO + policy + store + tests, ale bez transportu HTTP do Supabase). Jest to status **zaakceptowany** przez governance (`docs/architecture/DOMAIN_STATUS_REGISTRY.md`, guardy `check-domain-status-registry.mjs` zielone).

---

## Slice 1 — Communities MVP (list + cards + 4-step wizard)

| Aspekt | Wynik |
|---|---|
| Co zlecono | Lista społeczności, karty, kreator 4-step, wizard, clean room. |
| Evidence | `client/src/features-v2/communities-v2/CommunitiesShell.tsx`, `cards/*`, `wizard/CreateCommunityWizard.tsx`, `mock-adapter.ts`. Backend: `server/domains-v2/communities-v2/{service.ts, store.ts, dto.ts, policy.ts}`. |
| Route | `/communities`, `/communities/new` (`app-v2/communities/CommunitiesPage.tsx`, `CreateCommunityPage.tsx`). |
| Use-case | `server/application-v2/use-cases/communities/`. |
| Used by app | YES. |
| Stare usunięte | YES — `check-removed-product-areas.mjs` PASS. |
| Tests | YES — `CommunitiesShell.test.tsx`, `CreateCommunityWizard.test.tsx`, `__tests__/CreateCommunityForm.test.tsx`, domain service tests. |
| Status | **PASS** (UI_SHELL_ONLY + MOCK_LOCAL_ONLY zgodnie z polityką). |
| Priority | — |

## Slice 2 — Communities profile + join/request/leave

| Aspekt | Wynik |
|---|---|
| Evidence | `CommunityProfileShell.tsx`, `app-v2/communities/CommunityProfilePage.tsx`. Service: `service-member-ops.ts`, `service-invite-bridge.ts`. |
| Route | `/communities/:slug`. |
| Tests | `CommunityProfileShell.test.tsx`. |
| Status | **PASS**. |

## Slice 3 — Communities manage (settings/members/roles/requests/invites)

| Aspekt | Wynik |
|---|---|
| Evidence | `CommunityManageShell.tsx`, `manage/{DangerZone,InvitesPanel}.tsx`. |
| Route | `/communities/:slug/manage`. |
| Tests | `CommunityManageShell.test.tsx`. |
| Status | **PASS**. |

## Slice 4 — Communities structure & subcommunities

| Aspekt | Wynik |
|---|---|
| Evidence | `structure/{CommunityStructureShell,CreateSubcommunityWizard,SubcommunityCard,EditSubcommunityDialog}.tsx`, `structure-mock-adapter.ts`, domeny: `service-structure*.ts`. |
| Route | `/communities/:slug/structure`. |
| Tests | `CommunityStructureShell.test.tsx`. |
| Status | **PASS**. |

## Slice 5 — Three feeds + descendant publishing

| Aspekt | Wynik |
|---|---|
| Evidence | `feeds/CommunityFeedsShell.tsx`, `CommunityFeedTabs.tsx`, `CommunityFeedComposer.tsx`, `community-feeds-mock-adapter.ts`. Backend: `domains-v2/content-v2/community-feeds/`, `application-v2/use-cases/community-feeds/`. |
| Route | `/communities/:slug/feed`. |
| Feedy (3) | `community_all`, `relational`, `staff_only` — widoczność per-rola. |
| Descendant publishing | `listDescendantTargets` + `selectedDescendantCommunityIds` w kompozytorze. |
| Status | **PASS**. |

## Slice 6 — Comments + reactions (clean-room)

| Aspekt | Wynik |
|---|---|
| Evidence | `feeds/interactions/{CommunityPostInteractions,CommunityCommentComposer,CommunityCommentItem,CommunityCommentsToggle,CommunityReactionButton}.tsx`, `community-interactions-mock-adapter.ts`. |
| Backend | `content-v2/comments/`, `content-v2/reactions/`. |
| Tests | `CommunityPostInteractions.test.tsx`. |
| Status | **PASS**. |

## Slice 7 — Channels foundation

| Aspekt | Wynik |
|---|---|
| Evidence | `features-v2/channels/{ChannelsShell,ChannelProfileShell,channels-mock-adapter}.tsx`, `app-v2/channels/{ChannelsPage,ChannelProfilePage}.tsx`. Backend: `domains-v2/channels/{service.ts,service-read.ts,service-leads.ts,service-interactions.ts}`. |
| Route | `/channels`, `/channels/:slug`. |
| Sidebar entry | YES — `DesktopSidebar.tsx:135`. |
| Status | **PASS**. |

## Slice 8 — Channels content feed

| Aspekt | Wynik |
|---|---|
| Evidence | `ChannelProfileShell.tsx`, `ChannelPostCard.tsx`. Backend: `content-v2/channel-posts/`. |
| Status | **PASS**. |

## Slice 9 — Channels interactions (follow + leads + comments)

| Aspekt | Wynik |
|---|---|
| Evidence | `ChannelInteractionSettingsPanel.tsx`, `ChannelPostInteractions.tsx`, `ChannelCommentComponents.tsx`, `ChannelLeadsPanel.tsx`. |
| Backend | `domains-v2/channels/service-interactions.ts`, `interaction-policy.ts`, `interaction-settings.ts`. |
| Status | **PASS**. |

## Slice 10 — Modules / Public Hub

| Aspekt | Wynik |
|---|---|
| Evidence | `features-v2/modules/{ModulesManageView,mock-adapter}.tsx`, `features-v2/public-hub/{PublicHubView,slots/*}.tsx`. Backend: `domains-v2/modules/`, `domains-v2/public-hub/`, `domains-v2/topics-v2/`, `domains-v2/events-v2/`, `domains-v2/integrations-v2/`, `domains-v2/newsletter-chat-v2/`. |
| Route | `/communities/:slug/manage/modules`, `/communities/:slug/hub`. |
| Slots | Topics, Events, Integrations, NewsletterChat — wszystkie `slots/*Slot.tsx`. |
| Tests | `CommunityModulesManage.test.tsx`, `CommunityPublicHubView.test.tsx`, `ModulesManageView.test.tsx`. |
| Status | **PASS** (per-domain backendy `BACKEND_PARTIAL`, slots mockowe). |

## Slice 11 — Friend feed foundation

| Aspekt | Wynik |
|---|---|
| Evidence | `features-v2/friend-feed/{FriendFeedPage,FriendFeedPostCard,mock-adapter}.tsx`. Backend: `domains-v2/content-v2/friend-posts/`. |
| Route | `/friends-feed`. |
| Status | **PASS**. |

## Slice 12 — Professional profile / workplaces / mikro-feed / teasers

| Aspekt | Wynik |
|---|---|
| Evidence | `features-v2/professional-profile/{WorkplacePage,WorkplaceWizard,WorkplaceMicroFeed,ProfileProfessionalLayer,publishing-adapter,mock-adapter}.tsx`, route shells `app-v2/profile/workplaces/{WorkplaceCreateRoute,WorkplacePageRoute}.tsx`. Backend: `content-v2/workplace-posts/`, `content-v2/workplace-teasers/`. |
| Route | `/manage/profile/workplaces/new`, `/profile/workplaces/:slug`. |
| Teasers na feedzie znajomych | YES — `FriendFeedWorkplaceTeaserCard` w `FriendFeedPage`. |
| NO community-copy | PASS — guard `check-removed-product-areas.mjs`. |
| Status | **PASS**. |

## Slice 13 — Friend feed interactions

| Aspekt | Wynik |
|---|---|
| Evidence | `FriendFeedPostCard.tsx`, `useFriendFeedPostCardState.ts`, `FriendFeedComments.tsx`. |
| Status | **PASS**. |

## Slice 14 — Notifications / Activity center

| Aspekt | Wynik |
|---|---|
| Evidence | `features-v2/notifications-v2/{NotificationsPage,NotificationCard,mock-adapter,useNotificationsUnreadCount}.tsx`. Backend: `domains-v2/notifications-v2/{service,event-registry,settings-dto,service-settings}.ts`. |
| Route | `/notifications`. |
| Badge sidebar | YES — `DesktopSidebar.tsx:140`. |
| Settings | YES — `service-settings.ts`, `settings-dto.ts`. |
| Status | **PASS**. |

## Slice 15 — Unified owner/viewer profile

| Aspekt | Wynik |
|---|---|
| Evidence | `features-v2/personal-profile/PersonalProfilePage.tsx`, `app-v2/profile/PersonalProfileRoute.tsx`. |
| Route | `/profile/:username` (viewer) + `/profile` (owner — `ProfilePage.tsx`). |
| Status | **PASS** (oba route podpięte). |

## Slice 16 — Important events + presentation profile

| Aspekt | Wynik |
|---|---|
| Evidence | Karty `ImportantEventCard`, `ProfilePresentationCard` w `PostCardVariants.tsx`. Composer: `publishing/composers/{ImportantEventComposer,ProfilePresentationComposer}.tsx`. |
| Backend | Composer mock zwraca `partial` z `blockedReason: backend_not_ready_v2`. Brak realnej sekcji na profilu. |
| Status | **PARTIAL** — komponenty są, route docelowy `/profile/me/important-events` i `/profile/me/presentation` **nie istnieje** w routerze. |
| Priority | P1 — research deliverable, nie blokuje ZIP-a, ale powinien być widoczny jako roadmap. |

## Slice 17 — Unified publishing + Display Kit

| Aspekt | Wynik |
|---|---|
| Evidence | `features-v2/publishing/{ComposerTrigger,ComposerModal,PublishingComposerCore,composers/*}.tsx`, `features-v2/content-display/{PostDisplayKit,PostActionBar,variants/PostCardVariants}.tsx`. Backend: `application-v2/use-cases/publishing/{service,registry,preview,targets/*}.ts`. |
| Composer variants | friend / community / staff / relational / channel / workplace / important_event / profile_presentation — wszystkie 8 obecne. |
| Display Kit | Wspólne `StandardCard` + `PostDisplayHeader`, `PostBody`, `PostMediaGrid`, `PostStatsRow`, `PostActionBar`. |
| Wpięcie | Tak — `FriendFeedPage`, `CommunityFeedsShell`, `WorkplaceMicroFeed`, `ChannelPostComposer` (via per-domain `publishing-adapter.ts`). |
| Status | **PASS**. |

## Slice 18 — Media

| Aspekt | Wynik |
|---|---|
| Evidence | `features-v2/media/{useMediaUpload,media-adapter,BrokenMediaFallback,index}.tsx`, `domains-v2/media/{service,policy,purpose-registry,limits,public-api}.ts`. Internal: `domains-v2/media/internal/`. |
| Upload intent | Tak — `useMediaUpload.ts`, no `localStorage`, no `readAsDataURL` (guard `check-media-base64.mjs` PASS). |
| Media purpose registry | `purpose-registry.ts`. |
| Avatar/banner | `app-v2/profile/sections/{ProfileAvatar,ProfileBanner,ProfileMediaSheet}.tsx`. |
| Media picker | `publishing/PublishingMediaPicker.tsx`. |
| Status | **PASS**. |

## Slice 19 — Friends + contact consents + blocking

| Aspekt | Wynik |
|---|---|
| Evidence | `app-v2/friends/{FriendsPage,FriendRequestsPage}.tsx`, `app-v2/contacts/{ContactsPage,ContactRequestsPage}.tsx`, `features-v2/social/{contacts/*,friends/*,mock-adapter}.tsx`. Backend: `domains-v2/social/{service,policy,repository,social-contacts-*,social-relationship-store}.ts`. |
| Route | `/friends`, `/friends/requests`, `/contacts`, `/contacts/requests`. |
| Friendship ≠ contact | YES — separate `social-contacts-service.ts`. |
| Blocking | YES — `repository.ts` block list operations. |
| Status | **PASS**. |

## Slice 20 — Moderation (reports + queue + mod actor surfaces)

| Aspekt | Wynik |
|---|---|
| Evidence | `features-v2/moderation/{ModerationQueuePage,ReportDialog,mock-adapter,index}.tsx`. Backend: `domains-v2/moderation/{service,policy,repository,moderation-store,dto}.ts`. Use-case: `application-v2/use-cases/moderation/`. |
| Route | `/admin/moderation` (ModerationAdminPage). |
| Report dialog | `ReportDialog.tsx` — wpinany w karty postów przez `moreMenuSlot`. |
| Target registry | `domain-registry.ts` w domenie. |
| PII | NO PII w report DTO (`dto.ts` nie zawiera email/phone). |
| Status | **PASS**. |

## Slice 20B — Global UI: cards/composer/sidebar/mobile polish

| Aspekt | Wynik |
|---|---|
| Evidence | Commity: `686ba3e` (top-tier sidebar + composer trigger/modal foundation), `0563cc8` (fix friend-feed sidebar overlap), `876f807` (composer trigger wired into community + friend feeds), `9d8fc1c` (aggressive card visual polish). Plus untracked `AppShell.tsx`. |
| Composer trigger zamiast inline | YES — friend-feed + community feeds. |
| Top-tier sidebar | YES — 280 px, mark + brandword + user card + grupy. „Usługi" usunięte. |
| Mobile nav | `FloatingNav.tsx` 5 tabów: Centrum / Feed / [+] FAB / Alerty / Profil — **ALE FAB pokazuje „Wkrótce" modal, nie composer**. |
| Old weak cards | Usunięte z drogi przez nowe `PostCardVariants` używające Display Kit. |
| Status | **PARTIAL** — desktop top-tier OK, mobile FAB to atrapa. |
| Priority | **P1** — łatwy fix (mobile FAB → `ComposerModal` z friend-feed target). |

---

## Globalne uwagi

- **MOCK_LOCAL_ONLY** jest opisany w nagłówku każdego mock-adapter. Status `BACKEND_PARTIAL` jest skonsolidowany w `docs/architecture/DOMAIN_STATUS_REGISTRY.md` i sprawdzany przez `check-domain-status-registry.mjs`.
- **Brak FAKE save** — wszystkie mock adaptery realnie mutują swój wewnętrzny `Map` / `Array`. Idempotency w publishing jest realnie wymuszane (`mock-adapter.ts:111-117`).
- **No `@server/*` w `client/src/`** poza komentarzami "no `@server/*` imports" (sprawdzono Grepem).
- **No cross-domain internal** — wszystkie `/internal/` imports są w tej samej domenie (np. `identity/internal/*` używane tylko przez `identity/*`).
