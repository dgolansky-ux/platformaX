# SLICE 20C — Security / Privacy / PII Audit

## 1. Email / phone leakage

| Powierzchnia | Stan |
|---|---|
| Public DTOs identity (`server/domains-v2/identity/dto.ts`) | **brak email / phone** w publicznym typie (sprawdzone Grepem). Owner-only DTO siedzi w `internal/private-profile-dto.ts`. |
| Notifications DTO (`notifications-v2/dto.ts`) | wzmianki `email` znalezione — sprawdzone w kontekście. Email pojawia się jako `notificationChannel: "email"` (typ kanału, nie wartość) i w `EmailMailingDescriptor` jako część metadanych settings. **NIE wycieka adresu email do client**. |
| Social DTO (`social/dto.ts:9`) | komentarz: `"No PII (phone, emailContact, address, ...)"` — guard wymusza |
| Moderation DTO (`moderation/dto.ts`) | **brak email / phone** |
| Public profile DTO | **brak email / phone** w publicznej projekcji |
| Workplace teaser DTO (`content-v2/workplace-teasers/`) | sprawdzone — brak PII |
| Media URLs | używane jako `mediaRefs` (id + url po podpisaniu), brak surowych raw paths |
| Report DTO (`moderation/dto.ts`) | brak PII reportera ani target |
| Event payloads (notifications) | mapują `userId` tylko, nigdy emaila / phone |
| Logi | guard `check-logging-pii-security.mjs` PASS |

**Status: PASS — brak PII leakage znalezionego.**

## 2. Contact approval ≠ friendship

`server/domains-v2/social/` ma osobne services:
- `service.ts` — friendship (request / accept / decline / unfriend / block).
- `social-contacts-service.ts` — contact approval, kręgi znajomych, prywatne kontakty.

`social/__tests__/contact-access-service.test.ts` weryfikuje, że dodanie do znajomych NIE daje automatycznego dostępu do contact info. Test `identity/__tests__/contact-access-service.test.ts` weryfikuje to samo na warstwie identity.

**Status: PASS.**

## 3. Media private URLs

- `domains-v2/media/service.ts` — generuje sign / upload intents.
- `domains-v2/media/policy.ts` — kontroluje który viewer może zobaczyć daną mediację.
- `purpose-registry.ts` — definiuje cele (avatar, banner, post media, profile presentation) z osobnymi politykami.
- `domains-v2/media/__tests__/public-mapper-no-leak.test.ts` — sprawdza, że publiczny mapper nie wycieka prywatnych pól.

**Status: PASS.**

## 4. Notification DTO

`notifications-v2/dto.ts` zawiera:
- `notificationKey`, `topic`, `recipientUserId`, `triggeredByUserId?`, `entityRef`, `summary`, `createdAt`, `readAt?`.
- Brak email body / phone body.
- "email" jako typ kanału (notification channel) — typ enum, nie wartość kontaktowa.

Settings DTO (`settings-dto.ts`) trzyma user preferences per topic (push/email/in-app on/off), bez ujawniania samych adresów.

**Status: PASS.**

## 5. Report DTO

`moderation/dto.ts` zawiera:
- `reportId`, `targetType`, `targetId`, `reasonCode`, `reporterUserId`, `status`, timestamps.
- Brak imienia reportera, brak adresu, brak email.
- Moderator widzi `reporterUserId`, NIE dane reportera.

**Status: PASS.**

## 6. Public profile DTO

`identity/dto.ts` — `PublicProfileDTO`:
- `userId`, `username`, `displayName`, `bio?`, `avatarMediaRef?`, `bannerMediaRef?`, `visibility`, ewentualne `links?`.
- BRAK email / phone / address.
- Owner-only fields siedzą w `internal/private-profile-dto.ts` → eksportowane tylko przez `private-dto.ts` (z osobnego endpointu owner-only).

`server/domains-v2/identity/__tests__/public-mapper-no-pii.test.ts` egzekwuje to.

**Status: PASS.**

## 7. Workplace teaser PII

`content-v2/workplace-teasers/` — teaser zawiera:
- workplace_id, friend_user_id, summary, route_target.
- Brak workplace contact info (telefon, email) w teaserze.

**Status: PASS.**

## 8. Event payloads (notifications event registry)

`notifications-v2/event-registry.ts` mapuje:
- `friend.request.received` → emit recipient + actor userId (no PII).
- `community.invite.sent` → recipient + community slug (no PII).
- `post.reaction.added` → recipient + actor + post entity ref (no PII).
- itd.

**Status: PASS.**

## 9. Logi

Guard `check-logging-pii-security.mjs` PASS. Skanuje:
- `console.log`/`console.error` w runtime z polem `email`/`phone`/`password`/`token`.
- `logger.*` z PII.
- Tracing spans z PII.

**Brak naruszeń.**

## 10. Secrets

- `.gitleaks.toml` + `.gitleaksignore` istnieją.
- Guard `check-secret-scan.mjs` PASS.
- Guard `check-local-secret-scan.mjs` PASS.
- `.env.example` jest tylko przykładem (klucze placeholder).
- `pnpm secrets:gitleaks` jest dostępne; nie zostało uruchomione w tym audycie (wymaga binarki gitleaks). Zalecam uruchomić ręcznie przed Slice 21.

## 11. Auth boundaries

- `client/src/features-v2/identity/auth/supabase-client.ts` — single source of truth.
- `__tests__/frontend-auth-boundaries.test.ts` — egzekwuje, że tylko ten plik importuje `@supabase/supabase-js`.

**Status: PASS.**

## 12. XSS / Injection guard

Grep `alert\(|confirm\(|prompt\(` — 1 hit w testach (XSS guard test). **Brak runtime browser dialogs**.

`PublishingComposerCore.tsx` używa React (auto-escape). Brak `dangerouslySetInnerHTML` w aktualnym kodzie (sprawdzone). 

Test `WorkplaceWizard.test.tsx:60` celowo wpisuje `"javascript:alert(1)"` i sprawdza, że link jest sanityzowany.

**Status: PASS.**

## 13. Final werdykt PII

| Kategoria | Status |
|---|---|
| Email leak | PASS |
| Phone leak | PASS |
| Address leak | PASS |
| Password / token leak | PASS |
| Contact approval respect | PASS |
| Friend ≠ contact access | PASS |
| Media URLs private | PASS |
| Notification DTO | PASS |
| Report DTO | PASS |
| Workplace teaser | PASS |
| Logs | PASS |
| Secrets in repo | PASS (do uruchomienia gitleaks przed ZIP-em) |
| XSS / injection | PASS |

**GLOBALNY STATUS: PASS — 0 P0_LEAK, 0 PII_RISK.**

### Rekomendacja przed Slice 21:
1. Uruchomić `pnpm secrets:gitleaks` (jeśli binarka dostępna) i wpiąć wynik do manifestu Slice 21.
2. Po dodaniu realnego backendu (Supabase HTTP transport) — uruchomić `check-public-dto-pii.mjs` na realnych odpowiedziach (mock'i pokazują, że typy są clean; runtime jeszcze nie istnieje).
