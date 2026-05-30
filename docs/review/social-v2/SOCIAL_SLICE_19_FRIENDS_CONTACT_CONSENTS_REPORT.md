# SOCIAL_SLICE_19_FRIENDS_CONTACT_CONSENTS_REPORT

Status: `BACKEND_PARTIAL`
Slice: 19 (Znajomi, kontakty, zgody kontaktowe, blokowanie)

## 1. Co wdrozono

- Rozszerzono `server/domains-v2/social` o relacje znajomych + blokowanie:
  `service.ts`, `repository.ts`, `mapper.ts`, `dto.ts`, `contracts.ts`, `policy.ts`.
- Zachowano kompatybilnosc z istniejacym `social-contacts-service`.
- Rozszerzono contact consent (`identity/contact-access-service`) o:
  `cancelContactRequest`, `revokeContactAccess`, `listContactAccessRequestsForOwner`,
  `getContactVisibilityForViewer`, `requestedFields`, `respondedAt`.
- Dodano `application-v2/use-cases/social` (profilowe akcje relacji + widoki list).
- Dodano frontendowe UI shell routes:
  `/friends`, `/friends/requests`, `/contacts/requests`.

## 2. Jak dziala friendship

- Zaproszenie tworzy relacje `pending`.
- Akceptacja przez odbiorce ustawia relacje `accepted`.
- Odrzucenie/cancel/revoke nie tworza relacji znajomosci.
- `areFriends` i `getFriendIdsForViewer` zwracaja tylko realne accepted relacje.

## 3. Jak dziala pending sent/received

- `listPendingSentRequests(viewer)` zwraca wyjscia viewer -> other.
- `listPendingReceivedRequests(viewer)` zwraca wejscia other -> viewer.
- `getRelationshipState` rozroznia `pending_sent` i `pending_received`.

## 4. Jak dziala contact consent

- Friendship i contact consent pozostaja oddzielne.
- Contact request przechowuje `requestedFields` i `approvedFields`.
- Widocznosc kontaktu jest liczona przez policy (identity/contact-access).
- Dodane operacje: cancel request i revoke approved access.

## 5. Dlaczego friendship != contact access

- Friendship daje relacje spoleczna/filtrowanie feedu.
- Contact access daje selektywny dostep do pol kontaktowych.
- Brak automatycznego przejscia pomiedzy tymi mechanizmami.

## 6. Jak dziala blokowanie

- `blockUser` anuluje pending requesty i wygasza widocznosc relacji friends.
- Aktywny block blokuje nowe zaproszenia.
- `unblockUser` usuwa aktywna blokade.

## 7. Integracja z profilem

- Profil ma juz relacyjne CTA (send/accept/request contact).
- Slice 19 dodaje backendowe use-case wrappers pod kolejne CTA
  (reject/remove/block) w `application-v2/use-cases/social`.
- Frontend profile pozostaje `UI_SHELL_ONLY` i wymaga transportu do pelnej integracji.

## 8. Integracja z feedem znajomych

- Friend-feed use-case korzysta z `getFriendIdsForViewer` jesli jest dostepne.
- `friends_only` pozostaje oparte o accepted relationship.
- Brak accepted relation (pending/removed/blocked) nie daje dostepu do tresci.

## 9. Eventy pod powiadomienia

- Dodano wpisy registry:
  `FriendRequestSent`, `FriendRequestAccepted`, `FriendRequestRejected`,
  `FriendRemoved`, `UserBlocked`,
  `ContactAccessRequested`, `ContactAccessApproved`,
  `ContactAccessRejected`, `ContactAccessRevoked`.
- Czesciowo `planned`, czesciowo `no_notification_needed` (z uzasadnieniem).

## 10. Zakres PARTIAL

- `BACKEND_PARTIAL`: tak (social + contact consent + use-cases).
- `TRANSPORT_PARTIAL`: tak (brak pelnego HTTP transportu dla nowych flow).
- `UI_SHELL_ONLY`: tak (nowe strony friends/requests oparte o mock adapter).

## 11. Test evidence

- Dodane testy social domain: `server/domains-v2/social/__tests__/service.test.ts`.
- Rozszerzone testy social-contacts i friend-feed use-case.
- Pelne liczby testow: patrz sekcja finalna po wykonaniu bramek.

## 12. Guard evidence

- Lokalna weryfikacja wykonywana po zmianach:
  `check`, `lint`, `test`, `build`, `rules:check`, `arch:check:v2`, `guards:all-local`.
- Wyniki i fail/pass sa raportowane po runie.

## 13. P0/P1/P2

- P0: brak potwierdzenia przed uruchomieniem wszystkich bramek.
- P1: brak potwierdzenia przed uruchomieniem wszystkich bramek.
- P2: dalsza integracja profile action buttons i real transport.

## 14. Nastepne kroki

1. Podlaczyc realny transport HTTP dla nowych social/contact endpoints.
2. Podlaczyc profile UI CTA reject/remove/block do application-v2 social use-case.
3. Domknac notification handlers dla nowych wpisow `planned`.
4. Zamienic friends/contact requests mock adapter na runtime adapter.
