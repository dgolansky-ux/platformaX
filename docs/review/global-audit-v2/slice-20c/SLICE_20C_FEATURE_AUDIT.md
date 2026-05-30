# SLICE 20C — Feature Audit A–L

Statusy: PASS / PARTIAL / GAP / UI_SHELL_ONLY / BACKEND_PARTIAL / PLACEHOLDER / FAKE / PII_RISK / NOT_USED_BY_APP.

Per-feature ocenione 10 wymiarów:
1. domena, 2. application use-case, 3. public-api/contract, 4. frontend adapter, 5. route, 6. komponent route'a, 7. komponent korzysta z nowego kodu, 8. stare odłączone, 9. testy, 10. realna interakcja.

---

## A. Architektura V2

| Wymiar | Stan |
|---|---|
| `server/domains-v2/*` | 18 domen: audit, channels, chat, communities-v2, content-v2, events, events-v2, identity, integrations-v2, media, moderation, modules, newsletter-chat-v2, notifications, notifications-v2, public-hub, search, social, system, topics-v2. |
| `server/application-v2/use-cases/*` | 18 use-case grup. |
| `public-api.ts` w każdej domenie | YES. |
| `no @server/*` w client | YES (grep). |
| `no any/as any/@ts-ignore` w produkcji | YES (tylko fixtures + 2 test files w mock). |
| `audit-domain-boundaries.mjs` | PASS. |
| `check-architecture-import-graph.mjs` | PASS. |
| `domain-registry.ts` | YES — `server/domains-v2/domain-registry.ts`. |
| **Status** | **PASS** |

## B. Profil osobisty (owner/viewer mode)

| Wymiar | Stan |
|---|---|
| Domena | `domains-v2/identity` (z separacją `/internal/` na owner-only DTO). |
| Use-case | `application-v2/use-cases/profile/`, `personal-profile-view/`. |
| Frontend | `features-v2/personal-profile/PersonalProfilePage.tsx`. |
| Route owner | `/profile` → `ProfilePage.tsx` (legacy owner dashboard, świadomie zachowany). |
| Route viewer | `/profile/:username` → `PersonalProfileRoute.tsx` → `PersonalProfilePage`. |
| Owner sections (avatar/baner/bio) | `sections/{ProfileAvatar, ProfileBanner, ProfileBio, ProfileBioSheet, ProfileMediaSheet}.tsx`. |
| Public Hub profilu | `ProfilePortalCards.tsx`, `ProfileQuickFeed.tsx`, `PersonalProfileFriendFeedPreview.tsx`. |
| Warstwa zawodowa | `ProfileProfessionalLayer.tsx` + `ProfileProfessionalActivities.tsx`. |
| Miejsca pracy | `app-v2/profile/workplaces/{WorkplacePageRoute, WorkplaceCreateRoute}.tsx`. |
| Ważne wydarzenia | KARTA istnieje (`ImportantEventCard`), composer istnieje (`ImportantEventComposer`), **brak sekcji na profilu** — `partial`. |
| Prezentacja profilu | Karta + composer istnieją, **brak sekcji** — `partial`. |
| Friend feed preview | `PersonalProfileFriendFeedPreview.tsx` — używany przez `PersonalProfilePage`. |
| Kanały entry | YES — `ProfilePortalCards.tsx` + sidebar entry. |
| Contact/privacy | `ProfileContacts.tsx` + `social-contacts-*`. |
| **Status** | **PARTIAL** — ważne wydarzenia + prezentacja profilu brak finalnej sekcji. |

## C. Feed znajomych

| Wymiar | Stan |
|---|---|
| Domena | `content-v2/friend-posts/`, `content-v2/feeds/`. |
| Use-case | `application-v2/use-cases/friend-feed/`. |
| Frontend | `features-v2/friend-feed/{FriendFeedPage, mock-adapter, publishing-adapter}.tsx`. |
| Route | `/friends-feed` → `FriendFeedPageRoute.tsx` → `FriendFeedPage`. |
| Publikowanie | YES — `ComposerTrigger` + `ComposerModal` + `FriendFeedComposer`. Submit → `publishing-adapter` → realna mutacja mock state. |
| Komentarze | `FriendFeedComments.tsx`. |
| Reakcje | `useFriendFeedPostCardState.ts`. |
| Visibility | friends_only / private / public — w composerze. |
| Profile preview tool | `PersonalProfileFriendFeedPreview.tsx`. |
| Workplace teaser | `FriendFeedWorkplaceTeaserCard.tsx` (Slice 12). |
| Event hooks | NotificationsV2 event-registry mapping (`event-registry.ts`). |
| **Status** | **PASS** (MOCK_LOCAL_ONLY). |

## D. Społeczności

| Wymiar | Stan |
|---|---|
| Domena | `communities-v2/` (24 pliki: service+structure+invite+member+feeds split). |
| Use-case | `application-v2/use-cases/{communities, community-feeds, community-interactions}/`. |
| Frontend | `features-v2/communities-v2/*` (40+ plików). |
| Routes | `/communities`, `/new`, `/:slug`, `/manage`, `/structure`, `/feed`, `/manage/modules`, `/channels`, `/hub`. |
| Karty (list) | `CommunityCategoryCard, CreateCommunityCard, MyCommunityCard, RecommendedCommunityCard`. |
| 3 feedy | community_all, relational, staff_only — `CommunityFeedTabs.tsx`. |
| Publikowanie w dół struktury | `listDescendantTargets` + multiselect w composerze. |
| Komentarze/reakcje | `feeds/interactions/*`. |
| **Status** | **PASS**. |

## E. Kanały

| Wymiar | Stan |
|---|---|
| Domena | `channels/` z `service-leads.ts`, `service-interactions.ts`, `interaction-policy.ts`, `interaction-settings.ts`. |
| Use-case | `application-v2/use-cases/{channels, channel-content, channel-interactions}/`. |
| Frontend | `features-v2/channels/*`. |
| Route | `/channels`, `/channels/:slug`. |
| Sidebar entry | YES. |
| Prowadzący 1–5 | `ChannelLeadsPanel.tsx`. |
| Composer | `ChannelPostComposer.tsx` + `publishing-adapter`. |
| Pinned post | (komentarz w dto wymienia, sprawdzono mapper.ts) — present. |
| Komentarze/reakcje | `ChannelCommentComponents.tsx`, `ChannelPostInteractions.tsx`. |
| Settings interakcji | `ChannelInteractionSettingsPanel.tsx`. |
| **Status** | **PASS**. |

## F. Moduły i Public Hub

| Wymiar | Stan |
|---|---|
| Domena | `modules/{definitions, service, store, public-api}.ts`. |
| allowedOwnerTypes | `definitions.ts` deklaruje. |
| Public Hub profilu | `features-v2/public-hub/PublicHubView.tsx` z slots: TopicsSlot, EventsSlot, IntegrationsSlot, NewsletterChatSlot. |
| Public Hub społeczności | `CommunityPublicHubView.tsx`. |
| Tematy | `domains-v2/topics-v2/`. |
| Wydarzenia | `domains-v2/events-v2/` + `events/`. |
| Integracje | `domains-v2/integrations-v2/`. |
| Newsletter chatowy | `domains-v2/newsletter-chat-v2/`. |
| **Status** | **PASS** (każda pod-domena BACKEND_PARTIAL). |

## G. Miejsca pracy

| Wymiar | Stan |
|---|---|
| Kreator | `WorkplaceWizard.tsx`. |
| Strona miejsca | `WorkplacePage.tsx` + `WorkplacePageRoute.tsx`. |
| Kontakt/www | obecne w `WorkplaceWizard` steps. |
| Mikro-feed | `WorkplaceMicroFeed.tsx` z composerem. |
| Mini-zajawki na feedzie znajomych | `FriendFeedWorkplaceTeaserCard.tsx`. |
| NO community-copy | PASS (guard `check-removed-product-areas.mjs`). |
| **Status** | **PASS**. |

## H. Powiadomienia

| Wymiar | Stan |
|---|---|
| Domena | `notifications-v2/` + `event-registry.ts` + `settings-dto.ts`. |
| Activity Center | `NotificationsPage.tsx`. |
| Unread count | `useNotificationsUnreadCount.ts` — używany w `DesktopSidebar` + `FloatingNav`. |
| Settings | `service-settings.ts` + UI w `NotificationsPage`. |
| Event registry | `event-registry.ts`. |
| Mappings | `mapper.ts`. |
| NO fake notifications | mock-adapter generuje realistic empty seed (zob. nagłówek). |
| **Status** | **PASS**. |

## I. Media

| Wymiar | Stan |
|---|---|
| Domena | `media/` z `/internal/`, `purpose-registry.ts`, `limits.ts`. |
| Upload intent | `useMediaUpload.ts` + `media-adapter.ts`. |
| Media picker | `publishing/PublishingMediaPicker.tsx`. |
| Post display media | `content-display/PostDisplayKit.tsx#PostMediaGrid`. |
| NO base64/readAsDataURL | PASS (guard `check-media-base64.mjs` + `no-storage.test.ts` w `features-v2/media/__tests__`). |
| Avatar/banner | profile sections. |
| **Status** | **PASS**. |

## J. Znajomi / kontakty

| Wymiar | Stan |
|---|---|
| Domena | `social/` + `social-contacts-*`, `social-relationship-store.ts`. |
| Friend requests | `FriendRequestsPage.tsx`. |
| Pending sent/received | obecne w mock-adapter. |
| Lista znajomych | `FriendsPage.tsx`. |
| Blokowanie | `repository.ts`. |
| Contact access | `social-contacts-service.ts`. |
| Friendship ≠ contact | YES (separate services). |
| **Status** | **PASS**. |

## K. Moderacja

| Wymiar | Stan |
|---|---|
| Zgłaszanie treści | `ReportDialog.tsx` (wpinany przez `moreMenuSlot` w kartach). |
| Moderation queue | `ModerationQueuePage.tsx` na `/admin/moderation`. |
| Mod action | `service.ts` + mock-adapter realnie aktualizuje state. |
| Target registry | `domain-registry.ts`. |
| NO PII | PASS (DTO bez email/phone). |
| **Status** | **PASS**. |

## L. Zarządzaj (`/manage`)

| Wymiar | Stan |
|---|---|
| Dashboard | `ManageDashboard.tsx` z 6 tiles. |
| Konto | TILE `"settings"` — `"W przygotowaniu"`. |
| Profil | TILE `"profile"` → `/manage/profil-osobisty`. |
| Prywatność | TILE `"privacy"` — `"W przygotowaniu"`. |
| Kontakt | obecny w `PersonalProfileManageRoute`. |
| Znajomi/blokady | TILE `"contacts"` → `/contacts`. |
| Powiadomienia | linkowane z sidebar (`/notifications`). |
| Media | TILE `"media"` — `"W przygotowaniu"`. |
| Warstwa zawodowa | TILE `"professional"` → `/manage/sekcja-zawodowa` → `ProfessionalSectionRoute`. |
| Miejsca pracy | linkowane przez ProfessionalSection do `/manage/profile/workplaces/new`. |
| Moduły | linkowane przez kontekst społeczności (`/communities/:slug/manage/modules`). |
| Kanały | sidebar entry. |
| Społeczności zarządzane | przez profile społeczności (`/communities/:slug/manage`). |
| **Brak "Usługi"** | PASS — `check-removed-product-areas.mjs`. |
| **Status** | **PASS** (3 z 6 tiles `"W przygotowaniu"`, ale niczego nie udają — zdisabled aria + `tileStatusSoon`). |

## M. Global UI po Slice 20B

| Wymiar | Stan |
|---|---|
| Publishing composer trigger + modal | `ComposerTrigger.tsx` + `ComposerModal.tsx`. |
| Karty | Display Kit + variants. |
| Sidebar top-tier | `DesktopSidebar.tsx` 280px Slice 20B-FIX. |
| Mobile nav | `FloatingNav.tsx` 5 tabów. |
| NO inline heavy composer | YES — trigger + modal jest standardem. |
| NO old weak cards | YES — wszystkie route używają nowych variants. |
| NO dead old UI | sprawdzono — `check-no-legacy-imports.mjs` PASS. |
| **Mobile FAB → composer** | **NO — opens "Wkrótce" modal**. P1. |
| **Status** | **PARTIAL** — desktop pełny, mobile FAB to atrapa. |
