# PlatformaX V2 — PROFILE RUNTIME LOGIC BLUEPRINT FROM LEGACY

**Status dokumentu:** ANALYSIS_ONLY / NO_CODE / LEGACY_READ_ONLY  
**Priorytet:** P0 — profil osobisty i zawodowy są najważniejszym obszarem migracji.  
**Źródło legacy:** `Starykod-4` jako materiał referencyjny/read-only.  
**Zakres:** logika profilu osobistego, warstwy zawodowej, feed preview, postów profilowych, ważnych wydarzeń, kontaktów/znajomych, statusów, widoczności, uploadów i powiązanych narzędzi.  
**Cel:** dać Opusowi dokładny dokument wykonawczy do późniejszego podpinania backendu/logiki w V2 bez kopiowania legacy runtime.

---

## 0. Najważniejsza decyzja

Profil zawodowy **nie jest osobnym profilem**, osobną domeną ani osobnym produktem.

W V2 należy go traktować jako:

```txt
identity/profile
  ├─ personal layer
  └─ professional layer
```

Czyli:

- jeden użytkownik,
- jeden profil,
- jedna domena właścicielska `identity`,
- warstwa zawodowa jako część profilu użytkownika,
- dane zawodowe mogą korzystać z referencyjnych zawodów/specjalizacji,
- feed/posty/ważne wydarzenia pozostają w `content-v2`,
- znajomi/kontakty w `social`,
- media w `media`.

---

## 1. Pliki legacy, które są istotne dla logiki profilu

### 1.1 Główne UI / orkiestracja

```txt
client/src/features/identity/pages/ProfileView.tsx
client/src/features/identity/pages/ProfileView.hooks.ts
client/src/features/identity/pages/ProfileView.queries.ts
client/src/features/identity/pages/ProfileView.mutations.ts
client/src/features/identity/pages/ProfileView.helpers.ts
client/src/features/identity/pages/ProfileView.PreviewBanners.tsx
client/src/features/identity/pages/ProfileView.lightbox.ts
client/src/features/identity/pages/ProfileView.styles.ts
```

### 1.2 Header, bio, avatar, banner, status

```txt
client/src/features/identity/components/ProfileHeader.tsx
client/src/features/identity/components/ProfileBioEditor.tsx
client/src/features/identity/components/ProfileHeaderStatusBar.tsx
client/src/features/identity/components/ProfileAvatarSection.tsx
client/src/features/identity/components/ProfileBannerSection.tsx
client/src/features/identity/components/StatusModal.tsx
```

### 1.3 Warstwa zawodowa

```txt
client/src/features/identity/components/ProfessionBlock.tsx
client/src/features/identity/components/ProfessionBlock.Switcher.tsx
client/src/features/identity/components/ProfessionBlock.LinkedActivities.tsx
client/src/features/identity/components/ProfileProfessionalSection.tsx
client/src/features/identity/pages/ProfessionEditor.tsx
```

### 1.4 Top row, społeczności/kanały/feed znajomych, znajomi, quick feed

```txt
client/src/features/identity/components/ProfileTopRow.tsx
client/src/features/identity/components/ProfileTopRowCards.tsx
client/src/features/identity/components/FriendsSection.tsx
client/src/features/identity/components/FriendsSection.Carousel.tsx
client/src/features/identity/components/FriendsSection.Card.tsx
client/src/features/identity/components/QuickFeedPreview.tsx
client/src/features/identity/utils/quickFeedUtils.ts
```

### 1.5 Posty profilowe, ważne wydarzenia, modale

```txt
client/src/features/identity/components/ProfilePostsSection.tsx
client/src/features/identity/components/ProfilePostCard.tsx
client/src/features/identity/components/ProfileTimeline.tsx
client/src/features/identity/components/ProfileMilestoneCard.tsx
client/src/features/identity/components/ProfileModals.tsx
```

### 1.6 Preview mode / friend / stranger

```txt
client/src/features/identity/components/ProfilePreviewMenu.tsx
client/src/features/identity/pages/ProfileView.PreviewBanners.tsx
```

### 1.7 Przypomnienia profilu / ograniczenia

```txt
client/src/features/identity/hooks/useProfileReminders.ts
client/src/features/identity/components/ProfileReminderBanner.tsx
```

### 1.8 Pływająca nawigacja platformowa

```txt
client/src/features/_shared/components/BottomNav.tsx
client/src/features/_shared/components/BottomNavButtons.tsx
client/src/features/_shared/components/BottomNavButtons.NavBtn.tsx
client/src/features/_shared/components/BottomNavButtons.MapNavBtn.tsx
client/src/features/_shared/components/FloatingBackButton.tsx
```

### 1.9 Backend/router/db legacy istotny dla przyszłego runtime

```txt
server/routers-profiles-queries.ts
server/routers-profiles-uploads.ts
server/routers-friends-feed.ts
server/db-profiles.ts
server/db-feed-queries.ts
server/db-feed-mutations.ts
server/db-profile-posts-mutations.ts
server/db-milestones-mutations.ts
server/schemas/output/identity/profiles.ts
```

---

## 2. Czego NIE wolno kopiować z legacy

Legacy ma dużo wartościowego UX i logiki produktu, ale technicznie nie wolno kopiować runtime 1:1.

### Zakazane w V2

```txt
- tRPC hooks bezpośrednio w komponentach V2
- legacy Supabase coupling
- legacy DB access z UI
- legacy routery jako runtime
- base64/dataUrl upload
- localStorage/sessionStorage jako fake backend/sesja
- public DTO z email/phone/dateOfBirth
- professional-profile jako osobna domena
- passions/pasje jako reaktywowana domena
- window.confirm/window.alert
- deep importy między domenami
```

### Legacy bugi / ryzyka do poprawienia w V2

| Legacy zachowanie | Problem | V2 decyzja |
|---|---|---|
| `PublicProfileSchema` zawiera phone/dateOfBirth w pewnych warunkach | publiczne PII | public DTO nigdy nie ma phone/dateOfBirth/email prywatnego |
| upload avatar/banner przez base64 | zakazane przez BRAMKĘ | media domain + presigned upload |
| `px_profile_mode`, dismissed reminders w localStorage | fake persistence | profile state/server state albo session memory; trwałe tylko przez backend |
| `window.confirm` dla kasowania milestone | fake/native UX | custom modal/sheet |
| direct tRPC w UI | coupling | V2 app-v2 → adapters/use-cases → domain public API |
| passions jako obszar profilu | removed product area | nie reaktywować; jeśli legacy feed ma source passion, traktować jako historical/hidden/disabled |

---

## 3. V2 ownership map dla logiki profilu

| Obszar | Owner V2 | Uwagi |
|---|---|---|
| Konto/auth subject | `identity` | Supabase Auth adapter może dostarczać user/session |
| Private profile | `identity` | firstName, lastName, phone, dateOfBirth, avatar refs, banner refs, professional refs |
| Public profile summary | `identity` | bez PII; tylko publiczny zestaw danych |
| Warstwa zawodowa | `identity` | professions, specializations, professionalBio, openToCollaboration |
| Friends/contact graph | `social` | relacje, friends, tiers, contact access |
| Status dostępności / relationship visibility | `identity` + `social policy` | status może być w identity, widoczność zależy od social relationship |
| Profile posts | `content-v2/posts` | context `profile_presentation` |
| Milestones / important events | `content-v2/posts` lub subtyp `milestone` | eventDate, timeline, media |
| Friend feed preview | `content-v2/feeds` + `social` | read model feedu znajomych |
| Comments/reactions | `content-v2/comments/reactions` | batch counts, no N+1 |
| Media avatar/banner/post | `media` | presigned upload, asset refs |
| Floating nav | `app-v2/navigation` | UI shell/platform navigation, nie domena biznesowa |
| Search/filter professions | `identity` | referencyjne dane zawodów/specjalizacji |

---

## 4. Główna logika `ProfileView`

Legacy `ProfileView` jest centralnym ekranem. W V2 nie należy kopiować go jako monolitu, ale trzeba odtworzyć jego zachowanie przez mniejsze moduły.

### 4.1 Wejścia logiczne

Profil może działać w wariantach:

```txt
- owner viewing own profile
- public user viewing someone else's profile
- owner preview as friend
- owner preview as stranger
- personal mode
- professional mode
```

### 4.2 Kluczowe stany UI

Legacy utrzymuje m.in.:

```txt
profileMode: "public" | "professional"
previewMode: null | "friend" | "stranger"
showPreviewMenu: boolean
showStatusModal: boolean
showPostPublisher: boolean
showMilestonePublisher: boolean
editPost: ProfilePost | null
editMilestone: Milestone | null
lightbox: media item | null
confirmDeletePostId: string | null
localPostOrder: string[] | null
timelineView: "horizontal" | "vertical"
```

### 4.3 V2 rekomendacja stanu

W V2 stan UI profilu powinien siedzieć lokalnie w route/shell:

```txt
client/src/app-v2/profile/state/profile-view-state.ts
```

Nie zapisywać tego do `localStorage` jako runtime. Jeśli potrzebna trwałość trybu profilu, zrobić później backend preference albo URL/query state.

### 4.4 Główne decyzje renderowania

| Warunek | Render |
|---|---|
| `profileMode === "public"` | profil osobisty |
| `profileMode === "professional"` | warstwa zawodowa |
| `isOwner` | przyciski edycji, publishery, preview menu |
| `previewMode === "friend"` | ukryj owner-only controls, pokaż friend visibility |
| `previewMode === "stranger"` | ukryj feed/profile posts/timeline/contacts zależnie od policy |
| `isRestricted` | pokaż restricted reminder/banner i ogranicz część akcji |
| brak danych | empty states, nie fake DONE |

---

## 5. Profile mode: osobisty / zawodowy

### 5.1 Legacy

Legacy używa:

```txt
profileMode = "public" | "professional"
```

i zapisuje to w `localStorage` jako `px_profile_mode`.

### 5.2 V2

V2 powinno zachować UX przełącznika, ale bez localStorage jako trwałego runtime.

Dozwolone warianty:

```txt
- local component state
- URL state np. /profile?mode=professional
- później backend preference
```

### 5.3 Reguła UX

- profil osobisty jest bazą,
- profil zawodowy jest drugą warstwą,
- przełącznik ma nie przeładowywać całej aplikacji,
- animacja przejścia powinna być lekka i mobile-first,
- stan nie może tworzyć osobnej domeny.

---

## 6. PrivateProfileDTO i PublicProfileDTO

### 6.1 Legacy `MyProfileSchema`

Legacy `MyProfileSchema` zawiera m.in.:

```txt
id
userId
firstName
lastName
phone
dateOfBirth
avatar
bannerUrl
bannerUrlMobile
bio
professionalBio
location
dataVerified
isPublicProfile
availabilityStatus
cooperationEnabled
relationshipStatus
relationshipPartnerName
relationshipPartnerId
showFriends
showSpecialists
professionalAvatar
professionalBannerUrl
professionalBannerUrlMobile
showStatusOnlyClose
createdAt
updatedAt
```

### 6.2 V2 private DTO

V2 `PrivateProfileDTO` może zawierać:

```ts
type PrivateProfileDTO = {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  avatarAssetId: string | null;
  bannerAssetId: string | null;
  bannerMobileAssetId: string | null;
  bio: string | null;
  professionalBio: string | null;
  professionalAvatarAssetId: string | null;
  professionalBannerAssetId: string | null;
  professionalBannerMobileAssetId: string | null;
  location: string | null;
  availabilityStatus: AvailabilityStatus | null;
  openToCollaboration: boolean;
  relationshipStatus: RelationshipStatus | null;
  relationshipPartnerId: string | null;
  relationshipPartnerName: string | null;
  showFriends: boolean;
  showSpecialists: boolean;
  showStatusOnlyClose: boolean;
  dataVerified: boolean;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
```

### 6.3 V2 public DTO

V2 `PublicProfileDTO` **nie może** zawierać:

```txt
phone
dateOfBirth
private email
auth metadata
private contact details
```

Przykład:

```ts
type PublicProfileDTO = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  professionalBio: string | null;
  location: string | null;
  availabilityStatus: AvailabilityStatus | null;
  openToCollaboration: boolean;
  relationshipPreview: PublicRelationshipPreview | null;
  professions: PublicProfessionDTO[];
  visibility: {
    canViewFriends: boolean;
    canViewSpecialists: boolean;
    canViewProfilePosts: boolean;
    canViewMilestones: boolean;
    canViewFriendFeedPreview: boolean;
  };
};
```

---

## 7. Profile update logic

### 7.1 Legacy updateProfile

Legacy waliduje:

```txt
firstName min 2
lastName min 2
phone regex ^\d{9,}$
dateOfBirth YYYY-MM-DD
bio max 175
professionalBio max 175
location max 100
openToCollaboration boolean
dataVerified false blokuje update komunikatem
```

Legacy dodatkowo dual-write PII do `user_pii`.

### 7.2 V2 use-case

Proponowany use-case:

```txt
identity.updatePrivateProfile(userId, input)
```

#### Walidacje

```txt
firstName: 2..80
lastName: 2..120
phone: private, optional, E.164 albo local normalized
dateOfBirth: private, valid date, optional
bio: max 175 if keeping legacy parity
professionalBio: max 175 if keeping legacy parity
location: max 100
openToCollaboration: boolean
```

#### Reguły

- tylko owner/admin może aktualizować private profile,
- public profile mapper usuwa PII,
- update nie dotyka feed/content directly,
- jeżeli update wpływa na public summary, emit event:

```txt
ProfilePublicSummaryChanged
```

dla search/read models.

---

## 8. Avatar/banner/professional media logic

### 8.1 Legacy

Legacy ma osobne mutacje:

```txt
uploadProfileAvatar
uploadProfileBanner
uploadProfessionalAvatar
uploadProfessionalBanner
```

Legacy używa base64 i sprząta stare URL-e.

Dla bannera istnieje wariant:

```txt
desktop banner
mobile banner
```

### 8.2 V2

Nie wolno kopiować base64.

Docelowy flow:

```txt
1. media.createPresignedUpload(ownerType="user", ownerId=userId, purpose="profile_avatar")
2. client uploads file to provider/CDN
3. media.finalizeUpload(assetId)
4. identity.attachProfileMedia(userId, assetId, slot)
```

### 8.3 Sloty media

```txt
profile_avatar
profile_banner_desktop
profile_banner_mobile
professional_avatar
professional_banner_desktop
professional_banner_mobile
profile_post_media
milestone_media
friend_feed_media
```

### 8.4 Reguły

- identity trzyma tylko `mediaAssetId`, nie raw URL,
- public DTO dostaje bezpieczny `publicUrl` przez media public API,
- upload limit/type validation w `media`,
- profile nie importuje media repository; używa media public API/contract.

---

## 9. Bio editor logic

Legacy bio jest bardzo specyficzne i powinno być odtworzone także runtime/UI.

### 9.1 Limity

```txt
MAX_LINES = 6
MAX_LINE_LENGTH = 24
MAX_TOTAL_EFFECTIVE = 6 * 24
```

### 9.2 Parse logic

Legacy:

- bio dzielone na linie,
- każda linia ucinana do 24 znaków,
- render zawsze ma 6 rzędów,
- brakujące linie są puste.

V2 helper:

```ts
parseBioLines(bio: string | null): string[6]
```

### 9.3 Editing logic

Legacy:

- 6 textarea rows,
- Enter przenosi fokus do następnej linii,
- Backspace na pustej linii przenosi fokus do poprzedniej,
- Save trimuje trailing empty lines,
- Escape/Cancel przywraca ostatni zapisany stan.

### 9.4 Typewriter

Legacy:

```txt
28ms per character
300ms start delay
cursor animation px-bio-cursor
respect prefers-reduced-motion
```

V2:

- zachować jako visual behavior,
- jeśli reduced motion: pokaż tekst od razu,
- nie blokować renderu,
- nie udawać zapisu backendu.

### 9.5 Dwa bio

```txt
personal bio = profile.bio
professional bio = profile.professionalBio
```

Przełącznik profilu decyduje, które bio pokazać/edytować.

---

## 10. Availability status / status modal

### 10.1 Legacy status enum

```txt
available
open
looking
busy
unavailable
```

### 10.2 Legacy visibility

Jest flaga:

```txt
showStatusOnlyClose
```

oraz relacja do znajomych.

### 10.3 V2 use-cases

```txt
identity.updateAvailabilityStatus(userId, status)
identity.setStatusVisibility(userId, visibility)
identity.getStatusForViewer(profileUserId, viewerUserId)
```

### 10.4 Policy

| Viewer | Widzi status |
|---|---|
| owner | zawsze |
| close friend | jeśli showStatusOnlyClose lub public |
| friend | jeśli status public/friend |
| stranger | tylko jeśli public policy pozwala |
| blocked | nigdy |

### 10.5 UI

- owner może edytować status w modal/sheet,
- nie-owner widzi tylko policy-filtered status,
- brak `window.alert`.

---

## 11. Relationship status logic

### 11.1 Legacy enum

```txt
single_looking
single_not_looking
taken
in_relationship
engaged
married
```

Dodatkowe pola:

```txt
relationshipPartnerName
relationshipPartnerId
relationshipPartnerAvatar
```

### 11.2 V2

Owner: `identity.setRelationshipStatus`.

Viewer: `identity.getRelationshipPreview`.

### 11.3 Policy

Publiczne pokazywanie relacji musi respektować:

- owner visibility,
- partner privacy,
- social relationship,
- brak PII.

### 11.4 UI legacy details

- jeśli partner ma avatar, legacy ładuje go osobną query,
- jest animowany “glow sequence” relacji,
- animacje respektują reduced motion.

---

## 12. Profile reminders / onboarding completion

### 12.1 Legacy useProfileReminders

Reminder zależy od wieku profilu i progresu zawodowego.

#### Progi

| Dzień | Key | Tytuł | CTA |
|---:|---|---|---|
| 10 | `day10_profession` | Uzupełnij profil zawodowy | `/professions` |
| 30 | `day30_contacts` | Dodaj dane kontaktowe | `/manage` |
| 45 | `day45_bio` | Napisz coś o sobie | `/manage` |
| 60 | `day60_community` | Dołącz do społeczności | `/manage` |
| 90 | final warning | ostatnie ostrzeżenie | `/professions` |
| 100 | restricted | ograniczenie profilu | `/professions` |

### 12.2 Profession progress

Legacy liczy:

```txt
hasProfession
hasSpecialization
hasCollabAnswer
progress = count(true)/3 * 100
```

Jeśli progress >= 100, przypomnienia są wyciszone.

### 12.3 V2

Nie używać `localStorage` dla dismissed reminders jako trwałego runtime.

Docelowo:

```txt
identity.profileReminderState
identity.dismissProfileReminder(userId, reminderKey)
identity.getProfileCompletion(userId)
```

### 12.4 Restricted

Legacy `isRestricted` gdy:

```txt
profileAgeDays >= 100
professionProgressPct < 100
```

V2 może mieć podobną regułę, ale musi być jawna w policy/statusie, nie ukryta w UI.

---

## 13. Professions and specializations

### 13.1 Legacy model

Użytkownik może mieć wiele zawodów.

Reguły:

```txt
max 3 professions
exactly 1 primary
no duplicates
order
specializations per profession
openToCollaboration
```

### 13.2 Client legacy limits

W `ProfessionEditor`:

```txt
primary profession: max 7 specializations
secondary profession: max 5 specializations
```

### 13.3 Backend legacy limit

Backend sprawdza max 7 specializations per profession.

### 13.4 V2 decision

Zachować UX:

```txt
primary max 7
secondary max 5
```

Backend może walidować:

```txt
max 7 absolute
plus policy/client hints for secondary max 5
```

Lepiej jawnie zapisać regułę w V2 policy, żeby nie było rozjazdu.

### 13.5 Profession editor steps

Legacy steps:

```txt
zawod
specializations
success
final
```

### 13.6 Search logic

```txt
global search min 2 chars
returns top 12 professions with category name/icon
category search
profession search inside category
specialization search by current profession
custom specialization/proposed profession flow
```

### 13.7 Proposed profession

Legacy pozwala zaproponować nowy zawód:

```txt
name 2..100
categoryId
status pending
admin approve/reject/merge later
```

V2 może odłożyć admin runtime, ale UI/policy musi mieć status:

```txt
PROFESSION_PROPOSAL_BACKEND_NOT_STARTED
```

### 13.8 ProfessionBlock

Na profilu:

- aktywny zawód = primary albo pierwszy,
- przełącznik pokazuje inne zawody,
- max 5 specjalizacji widocznych w bloku,
- można rozwinąć więcej,
- primary dot,
- powiązane aktywności z `linkedProfileProfessionId`.

### 13.9 V2 domain

`identity` owns:

```txt
profile_professions
profile_specializations
profession categories references
openToCollaboration
```

Nie tworzyć osobnej domeny `professional-profile`.

---

## 14. Professional activities / “Moja praca”

### 14.1 Legacy professional section

Renderuje tylko w:

```txt
profileMode === "professional"
```

Ma taby:

```txt
classic
network
```

### 14.2 Work type sheet options

Legacy ma sheet z opcjami:

| Typ | Route legacy | Kolor | Tło | Opis |
|---|---|---|---|---|
| Stanowisko | `/activity/new/workplace` | `#6366F1` | `#EEF2FF` | Pokaż swoją rolę zawodową w firmie lub organizacji. |
| Organizacja | `/activity/new/company` | `#0EA5E9` | `#F0F9FF` | Pokaż swoją firmę, markę albo organizację i czym się zajmuje. |
| Projekt | `/activity/new/project` | `#3B82F6` | `#EFF6FF` | Zrealizowany projekt lub case study |
| Usługa | `/activity/new/service` | `#10B981` | `#ECFDF5` | Pokaż, co oferujesz klientom jako usługę. |
| Produkt | `/activity/new/product` | `#F59E0B` | `#FFFBEB` | Aplikacja, kurs, ebook, SaaS |

### 14.3 V2 decision

Do czasu backendu:

- sheet jako UI shell/local state,
- routes disabled/policy albo app-shell route placeholder,
- nie tworzyć activity runtime bez osobnej decyzji,
- jeśli activity będzie później, owner prawdopodobnie `content-v2` albo osobny application layer powiązany z identity profession.

### 14.4 Empty state

Owner:

```txt
Dodaj projekt, usługę lub case study aby pokazać swoją pracę.
```

Non-owner:

```txt
Ten użytkownik...
```

Trzeba odtworzyć microcopy z legacy dokładniej podczas final parity.

---

## 15. Friends/contact section

### 15.1 Legacy queries

```txt
friendships.getFriendsPaged({ limit: 12, cursor, search, tier })
```

Tiers:

```txt
all
close
family_close
family_distant
```

Dodatkowe count queries per tier with `limit: 1`.

### 15.2 Search

```txt
debounce 280ms
search resets pages
tier change resets accumulated pages
```

### 15.3 Carousel behavior

Legacy:

- `allLoaded` accumulates pages,
- if no search and displayFriends length >= 4 then carousel duplicates items,
- requestAnimationFrame engine,
- base speed `-0.5px/frame`,
- touch velocity,
- vertical touchmove preventDefault,
- fade overlays,
- horizontal/vertical modes.

### 15.4 Card

Legacy card:

```txt
avatar 61x61
card width 67
first name 10px
last name 9px
online dot
```

### 15.5 V2 runtime

Owner `social`:

```txt
social.getFriendsForProfile(profileUserId, viewerUserId, input)
social.getFriendsStats(profileUserId, viewerUserId)
```

Input:

```ts
{
  tier?: "all" | "close" | "family_close" | "family_distant";
  search?: string;
  cursor?: string;
  limit: number; // max 12 or configured
}
```

### 15.6 Policy

- owner sees all,
- friend sees allowed,
- stranger may see none or public-only based on `showFriends`,
- no PII,
- search must be limited/rate-limited later.

---

## 16. Quick feed preview / podgląd ostatnich postów znajomych

To jest P0 element profilu. Nie wolno go pominąć.

### 16.1 Legacy source

```txt
QuickFeedPreview.tsx
quickFeedUtils.ts
FriendActivityGrid
PostDetailSheet
```

### 16.2 Trigger

Legacy pokazuje quick feed gdy:

```txt
profileMode === "public"
isOwner
previewMode !== "stranger"
```

### 16.3 Data loading

Legacy:

- preview closed initially,
- feed query enabled only when open,
- avatar/author summary query can load earlier,
- refresh button refetches query.

### 16.4 Visual states

```txt
closed
opening
open loading
open loaded
open empty
post detail sheet open
refreshing
```

### 16.5 UI details to preserve

- button full width minus side margins,
- label “Ostatnie posty”,
- stacked avatars max 3,
- red LIVE/pulse dot,
- arrow rotation,
- max-height animation 380ms cubic-bezier,
- skeleton shimmer,
- grid with big card and small cards,
- CTA to full feed,
- click post opens detail sheet.

### 16.6 Legacy helper logic

`formatTimeAgo`:

```txt
<60s -> "przed chwilą"
<1h -> "X min temu"
<1d -> "X godz. temu"
else -> "X dni temu"
```

`MAX_STACKED_AVATARS = 3`.

### 16.7 V2 runtime target

V2 should not query legacy tRPC. Target:

```txt
content-v2.feeds.getFriendFeedPreview(viewerId, { limit, cursor? })
```

Backed by:

```txt
social public API for friend graph
content-v2 feed read model
```

### 16.8 V2 DTO

```ts
type FriendFeedPreviewItemDTO = {
  id: string;
  author: {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    relationshipTier: "close" | "family_close" | "family_distant" | "standard" | null;
  };
  content: string;
  createdAt: string;
  media: FeedMediaDTO[];
  reactionCounts: Record<string, number>;
  commentCount: number;
  myReaction: string | null;
  sourceLabel: "friend_post" | "profile_presentation" | "milestone" | null;
};
```

### 16.9 Runtime rules

- no global feed,
- friend feed only from accepted friends and optionally self,
- cursor/limit mandatory,
- batch counts for reactions/comments,
- detail sheet can load full post later,
- no N+1.

---

## 17. Friend feed runtime legacy logic

### 17.1 Legacy getFriendsFeed

Legacy DB logic:

1. Find accepted friendships where user is requester or receiver.
2. Author IDs = self + friends.
3. Look at last 30 days only.
4. Select `posts` where:
   - `isFriendPost = true`
   - author in allAuthorIds
   - not deleted
5. Raw candidates limit 50.
6. Score and diversify.
7. Return paginated cursor as offset string.

### 17.2 Scoring

Legacy score pieces:

```txt
freshness = 1/(1+log(1+hoursOld))
engagement = (reactions*1.5 + comments*3.0)/(1+log(1+hoursOld))
strengthBonus = min(rawStrength*10, 1) * 0.2
closeFriendBonus = 0.3 if tier close
spouseBonus = 0.5 if author is partner
relationshipBonus = 1 + strengthBonus + closeFriendBonus + spouseBonus
jitter = 0.92 + Math.random()*0.16
baseScore = freshness*.4 + min(engagement/10,1)*.35 + (relationshipBonus-1)*.2 + .05
score = baseScore*jitter
```

### 17.3 Diversity

Legacy sorts by score, then does author round-robin to avoid one author dominating.

### 17.4 V2 decision

Do not copy random scoring blindly into request path. Better:

- scoring in `content-v2/feeds` service/read model,
- deterministic enough for tests,
- jitter only if clearly accepted,
- cursor stable, not offset if possible,
- scoring metadata not public.

### 17.5 Minimum V2 runtime slice

For first runtime:

```txt
getFriendFeedPreview(viewerId, limit=6)
```

with:

- accepted friends,
- createdAt desc,
- batch counts,
- stable cursor,
- no advanced ranking initially unless implemented cleanly.

Advanced ranking can be marked:

```txt
FRIEND_FEED_RANKING_PHASE_2
```

---

## 18. Profile posts / prezentacja profilu

### 18.1 Legacy section

Shown when:

```txt
profileMode === "public"
previewMode !== "stranger"
```

Title:

```txt
Prezentacja profilu
```

Subtitle:

```txt
{posts.length}/12 postów
```

### 18.2 Limits

```txt
max 12 profile posts
media max 7
videos max 2
video duration max 180s
visibility: public/friends/private?
```

### 18.3 Create behavior legacy

When profile post visibility is public/friends, legacy auto-posts to friend feed:

```txt
posts.isFriendPost = true
sourceLabel = "profile_presentation"
sourceRefId = profilePostId
```

and copies media to friend feed media.

### 18.4 V2 decision

Do not duplicate DB records ad hoc.

Recommended:

```txt
content-v2.createProfilePresentationPost(context=userProfile)
```

Then feed projection/outbox emits:

```txt
ProfilePresentationPublished
```

Read model projects into friend feed.

### 18.5 V2 DTO

```ts
type ProfilePresentationPostDTO = {
  id: string;
  ownerUserId: string;
  description: string;
  visibility: "public" | "friends" | "private";
  order: number;
  media: MediaAssetPreviewDTO[];
  reactionCounts: Record<string, number>;
  commentCount: number;
  myReaction: string | null;
  createdAt: string;
  updatedAt: string;
};
```

### 18.6 Reorder

Legacy supports reorder.

V2 use-case:

```txt
content.reorderProfilePresentationPosts(ownerUserId, orderedIds)
```

Rules:

- only owner,
- all ids must belong to owner,
- no duplicates,
- max 12,
- transaction.

### 18.7 Delete

Deleting profile post should:

- delete/soft-delete content item,
- trigger feed projection removal,
- schedule media cleanup if no other refs,
- no direct cross-domain delete from identity.

---

## 19. Milestones / ważne wydarzenia

### 19.1 Legacy section

Title:

```txt
Ważne wydarzenia
```

Subtitle:

```txt
Oś czasu Twojego życia
```

### 19.2 Display modes

```txt
horizontal
vertical
```

Horizontal default in hook.

### 19.3 Limits

```txt
max 12 milestones
media max 7
videos max 2
video duration max 180s
eventDate required
```

### 19.4 Legacy anniversary banner

Legacy finds milestones whose anniversary in current year is within:

```txt
-1 to +3 days
```

and original year is older than current year.

Relative labels include:

```txt
dni
miesiąc
pół roku
rok
dwa/trzy/cztery/lata/lat
```

V2 should implement helper with tests:

```txt
getMilestoneAnniversaryWindow(milestones, now)
```

### 19.5 Create behavior

Legacy also posts milestone to friend feed with:

```txt
sourceLabel = "milestone"
sourceRefId = milestoneId
```

V2 should emit event:

```txt
MilestonePublished
```

and feed read model projects it.

### 19.6 Delete behavior

Legacy uses `window.confirm` in one path. V2 must use custom confirm sheet/modal.

### 19.7 DTO

```ts
type ProfileMilestoneDTO = {
  id: string;
  ownerUserId: string;
  title: string;
  description: string;
  eventDate: string;
  visibility: "public" | "friends" | "private";
  media: MediaAssetPreviewDTO[];
  taggedFriend: PublicProfileSummaryDTO | null;
  createdAt: string;
  updatedAt: string;
};
```

---

## 20. Preview mode: friend / stranger

### 20.1 Legacy

Owner preview dropdown:

```txt
friend
stranger
```

Labels:

```txt
Widok znajomego
Widok nieznajomego
```

Friend banner:

```txt
Podgląd: widok znajomego
Znajomi widzą Twój feed, status i aktywności
```

Stranger banner:

```txt
Podgląd: widok nieznajomego
Nieznajomi widzą tylko publiczne informacje i zawody
```

### 20.2 V2 policy

Preview mode should not be fake. It should call mapper/policy with simulated viewer role:

```txt
owner preview friend => viewerRelationship = friend
owner preview stranger => viewerRelationship = stranger
```

### 20.3 Visibility matrix

| Element | Owner | Friend preview | Stranger preview |
|---|---:|---:|---:|
| edit controls | yes | no | no |
| profile posts | yes | yes | no |
| milestones | yes | yes | no |
| quick feed preview | yes | yes? owner-only shell maybe no | no |
| friends carousel | yes | depends showFriends | no or limited |
| professional layer | yes | yes | yes public subset |
| private phone/DOB/email | yes private forms only | no | no |
| status | yes | policy | policy |
| relationship | yes | policy | policy |

---

## 21. Social links logic

### 21.1 Legacy

`getSocialLinks` returns from profile contact fields:

```txt
linkedin
github
instagram
website
```

UI normalizes URL.

### 21.2 V2

Owner: identity stores public social links.

Rules:

- URL normalization in domain/service or validated input.
- Public DTO can include safe social links.
- Do not store private contact as public social link.

DTO:

```ts
type ProfileSocialLinkDTO = {
  kind: "linkedin" | "github" | "instagram" | "website";
  label: string;
  url: string;
  isPublic: boolean;
  order: number;
};
```

---

## 22. Profile actions for non-owner

### 22.1 Legacy likely behavior

`ProfileActions` appears for non-owner.

Actions include conceptually:

```txt
send friend/contact request
message/contact
share
relationship state
```

### 22.2 V2 runtime

Owner:

```txt
social.requestFriendship(viewerId, profileUserId)
social.cancelFriendRequest(...)
social.accept/reject later
```

But in profile runtime slice, keep thin.

UI states:

```txt
none
pending_outgoing
pending_incoming
accepted
blocked
self
```

Do not show no-op buttons.

---

## 23. Floating navigation logic

### 23.1 Legacy behavior

Files:

```txt
BottomNav.tsx
BottomNavButtons.tsx
BottomNavButtons.NavBtn.tsx
BottomNavButtons.MapNavBtn.tsx
FloatingBackButton.tsx
```

### 23.2 Scroll hide

Legacy `useScrollHide`:

- track current scroll,
- if scroll down more than ~10 and y > 60, hide,
- if scroll up, show,
- use `requestAnimationFrame`.

V2 hook:

```txt
useFloatingNavVisibility()
```

Rules:

- no route business logic in hook,
- respects reduced motion,
- mobile-first,
- no localStorage needed.

### 23.3 Active state

Determined by current route.

```txt
/
profile
friends/feed
communities
ringpost/map maybe legacy
```

V2 must only include active routes in current product. Removed routes must not be active.

### 23.4 Badges

Legacy had notification/unread badges and 99+ cap.

V2 first shell:

- badges fixture/local state only,
- runtime later from notifications/feed,
- no fake DONE.

---

## 24. Profile restrictions / data verification

### 24.1 Legacy

`dataVerified === false` can block update with:

```txt
Musisz potwierdzić...
```

Legacy has `verifyProfile`, `verifyUserData`.

### 24.2 V2

Identity should have status:

```txt
profileVerificationStatus:
  unverified
  pending
  verified
  rejected
```

But avoid blocking shell.

If runtime implements:

- private profile can be edited,
- certain public features may require verified data,
- status truth documented.

---

## 25. Integration sequence for backend/runtime

Do **not** implement all runtime at once.

### Step 1 — Identity profile persistence

Scope:

```txt
private profile table/model
public profile mapper
update/get private profile
get public profile
PII tests
onboarding save
```

No media upload yet.

### Step 2 — Professions persistence

Scope:

```txt
reference categories/professions
user professions
user specializations
primary/order
openToCollaboration
```

### Step 3 — Profile media

Scope:

```txt
avatar/banner/professional avatar/banner via media domain
presigned upload
attach asset refs to identity
```

### Step 4 — Profile posts/milestones runtime

Scope:

```txt
content-v2 profile presentation posts
milestones
visibility
media refs
reorder/delete
events/outbox for feed projection
```

### Step 5 — Friends/social status

Scope:

```txt
friend relation state
profile actions
friends carousel data
visibility policy
status/relationship policy
```

### Step 6 — Friend feed preview runtime

Scope:

```txt
getFriendFeedPreview
post detail sheet data
reaction/comment counts
cursor/limit
read model
```

---

## 26. Required V2 tests

### 26.1 Identity/profile

```txt
PrivateProfileDTO includes phone/dateOfBirth for owner
PublicProfileDTO never includes phone/dateOfBirth/private email
owner can update private profile
non-owner cannot update profile
public profile respects visibility policy
professional layer maps from same identity profile
```

### 26.2 Bio

```txt
parseBioLines returns exactly 6 lines
line over 24 chars is trimmed/rejected according to UX decision
save trims trailing empty lines
professional bio separate from personal bio
```

### 26.3 Professions

```txt
max 3 professions
exactly one primary
no duplicates
primary max 7 specs
secondary max 5 specs if policy adopted
specializations must belong to selected profession
no fake generated specializations
```

### 26.4 Media

```txt
profile media uses media asset refs
no base64/dataUrl in runtime
SERVICE_ROLE_KEY not in frontend
old media cleanup is async/safe
```

### 26.5 Content profile posts

```txt
max 12 profile posts
media max 7
videos max 2
video duration max 180s
owner-only create/update/delete/reorder
visibility filters public/friend/stranger
feed projection event emitted
```

### 26.6 Milestones

```txt
max 12 milestones
eventDate required
anniversary helper covers -1/+3 days
owner-only write
visibility filters
delete uses custom confirmation flow
```

### 26.7 Friend feed preview

```txt
must use limit/cursor/fixed cap
accepted friends only
no N+1 for reactions/comments
detail sheet loads safe DTO
stranger preview hides it
```

### 26.8 Floating nav

```txt
active route state
hide on scroll down/show on scroll up
badges cap 99+
prefers-reduced-motion
no removed routes active
```

---

## 27. Acceptance checklist for Opus before backend PR

Before starting each backend PR, Opus must answer:

```txt
1. Which domain owns this data?
2. Is the data private, public, admin-only, or read model?
3. Does public DTO leak PII?
4. Is there a public-api/contract/event for cross-domain use?
5. Is there a list/feed/search with limit/cursor/fixed cap?
6. Is media using presigned upload, not base64?
7. Are we copying legacy runtime? If yes, stop.
8. Are status labels honest? No fake DONE.
9. Are removed product areas avoided?
10. Are tests proving policy/visibility?
```

---

## 28. Summary of what must be implemented later

### Runtime must cover

```txt
identity:
- private profile
- public profile
- personal/professional bio
- profile media refs
- relationship/status/visibility
- professions/specializations
- openToCollaboration
- reminders/completion

social:
- friend/contact relationship state
- friends carousel data
- friend tiers/search/counts
- visibility policy support

content-v2:
- profile presentation posts
- milestones
- friend feed preview/read model
- comments/reactions counts
- post detail sheet data

media:
- avatar/banner/professional media
- profile post/milestone media
- thumbnails/CDN refs

app-v2/profile:
- orchestrates DTOs
- no direct DB/Supabase coupling
- no legacy imports
```

### Runtime must not cover yet unless separate task

```txt
- full global feed
- communities runtime
- passions/pasje
- Railway deploy
- production hardening
- chat/realtime
- marketplace/payments
```

---

## 29. Practical Opus implementation order after visual polish

Recommended order:

```txt
STEP 27: identity profile persistence + onboarding save
STEP 28: professions/specializations persistence
STEP 29: media adapter for avatar/banner/professional media
STEP 30: profile posts + milestones content-v2 runtime
STEP 31: social friends/status policy for profile
STEP 32: friend feed preview runtime
STEP 33: final profile visual/runtime parity polish
```

Each step must be branch → PR → CI → merge.

No ZIP from Opus. ZIP via Cursor Agent only.

---

## 30. Final note

This document is not permission to copy legacy backend. It is a map of product logic and behavior.

The V2 implementation must preserve product behavior where valuable, but rewrite technical implementation cleanly:

```txt
legacy = source material
V2 = clean contracts, DTOs, policies, repositories, tests, guards
```
