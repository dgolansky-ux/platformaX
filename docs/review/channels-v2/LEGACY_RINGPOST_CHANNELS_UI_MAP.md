# LEGACY → V2 — Channels Product Slice (UI MAP)

Status: ACTIVE_EVIDENCE · clean-room. Mapa implementacyjna.
Źródło legacy: `Starykod-4-extracted/PlatformaX/` (nie kopiowane do repo; reverse-engineered z opisu RingPost i istniejącego scaffoldu V2).

## 1. Legacy RingPost — czym był

Stara wersja:
- jeden, sztywny "ring" przypięty per społeczność,
- kanał ≈ publikacyjny topic w community, mocno wpleciony w community wall,
- brak jasnego rozdziału follow vs membership (follow często wymuszane przez członkostwo),
- ownership/prowadzący kanału = founder/admin społeczności, bez koncepcji "lead/co-lead",
- tRPC + Supabase coupling + spaghetti hooks w komponentach,
- spis kanałów nie istniał jako osobna funkcja platformy — kanały żyły wewnątrz strony społeczności.

## 2. Co z legacy używamy jako inspirację

- mikrocopy: „Obserwuj", „Obserwujesz", „Przestań obserwować", „N obserwujących",
- karta kanału: nazwa + opis + społeczność-właściciel + follower count,
- create channel form: nazwa, slug, opis, widoczność (legacy: public/private).

## 3. Co odrzucamy z legacy runtime

tRPC (`trpc.channels.*`), Supabase coupling, hooki `useChannel*`, localStorage cache, fake counts, no-op „Subskrybuj" przyciski wymuszające membership, hardcoded ownership-founder-only, brak rozdziału follow vs membership, RingPost wrapper, `any`/RULE_EXCEPTION, base64 avatary, optimistic-UI magic-rollback.

## 4. Legacy ekrany/komponenty → V2

| Legacy | Rola | V2 |
|---|---|---|
| `pages/CommunityChannelsTab.tsx` | spis kanałów w społeczności | `ChannelsShell` (`/channels`) + `CommunityChannelsView` (już w Slice 3) |
| `pages/ChannelPage.tsx` | strona pojedynczego kanału | `ChannelProfileShell` (`/channels/:slug`) |
| `components/ChannelCard.tsx` | karta w spisie | `ChannelCard` (variants: followed/leading/community/discover) |
| `components/FollowChannelButton.tsx` | follow CTA z tRPC | `ChannelFollowButton` (clean-room, przez mock-adapter) |
| RingPost ownership UI (legacy: brak) | przypisanie autorów | `ChannelLeadsPanel` (lead/co-lead, max 5, min 1) — NOWA logika V2 |
| navigation (legacy: brak top-level entry) | sidebar | `DesktopSidebar` — dodaj „Kanały" jako główną sekcję |
| profile (legacy: kafel Kanały bezroute) | wejście z profilu | `ProfilePortalCards` — route `/channels` |

## 5. Co nowego dodajemy względem legacy

- **Spis kanałów** `/channels` jako osobna funkcja platformy (Obserwowane / Moich społeczności / Prowadzę / Odkrywaj).
- **ChannelLead encja**: `lead` + `co_lead` z permissions, 1–5 osób, ostatniego nie można usunąć, prowadzący musi być członkiem owner-community.
- **Follow ≠ membership**, **membership ≠ follow** — twardo rozdzielone w domain + adapter + UI.
- **Sidebar entry** "Kanały" jako pełnoprawna sekcja produktu (obok Społeczności/Profil).
- **Profile entry** kafel Kanały na profilu osobistym → `/channels` (zamiast disabled-policy CTA).
- **ChannelProfilePage** z managemenetm leads dla uprawnionych, follow CTA dla wszystkich.

## 6. Mapowanie domenowe V2

- `channels` (domain): encje Channel, ChannelLead, ChannelFollow + policy (1–5 leads, last-lead, slug, owner) + repo + service.
- `application-v2/use-cases/channels`: orkiestracja create/assignLead z weryfikacją membership przez communities public-api/contract.
- Frontend `features-v2/channels/`: `ChannelsShell`, `ChannelProfileShell`, `ChannelCard*`, `ChannelLeadsPanel`, `channels-mock-adapter.ts` (MOCK_LOCAL_ONLY).
- Routes: `/channels`, `/channels/:slug` (AppRouter).

## 7. Świadomie pominięte

pełny feed kanału, komentarze/reakcje na poście kanału, chat, newsletter, notifications, discovery algorithm, ranking, płatności/subscriptions, events, channel posts publishing UI, full Public Hub, full audit ZIP.

## 8. Decyzje modelu (zakotwiczone)

| Aspekt | Decyzja | Powód |
|---|---|---|
| Channel ownerType | `community` (MVP) | osobiste kanały — future-ready, ale nie wdrażamy |
| Lead roles | `lead` + `co_lead` | legacy nie miał, V2 wprowadza jako fundament produkowy |
| Lead permissions | `manage_channel_profile`, `manage_channel_leads` (MVP) | future: `publish_channel_content`, `view_channel_stats` |
| Lead min/max | 1–5 active leads | wymóg produktowy, enforce w service + test |
| Lead must be member | tak — sprawdzane via communities authority contract | bezpieczeństwo, brak orphan leads |
| Follow != membership | tak | rozdzielne stores, brak inferowania |
| Visibility | `public` (MVP), `private` (future) | discovery działa tylko na public |
| Slug | `^[a-z0-9]+(-[a-z0-9]+)*$`, unique per ownerId | URL friendly, brak kolizji w community |
