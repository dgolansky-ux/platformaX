# application-v2/use-cases/contacts

Status: `BACKEND_PARTIAL`
Legacy reference: `docs/review/contacts-v2/LEGACY_CONTACTS_ANALYSIS.md`

## Purpose

Composes `identity/contact-access` (private contact fields + contact
requests) and `social/social-contacts` (friendships + address-book +
specialists) into a single application surface for the Kontakty tab and
public-profile action buttons. Owns NO entities.

## Public API

- `createContactsApplicationService({ identityContactAccess, socialContacts })`
  — factory that returns a `ContactsApplicationService`.
- `makeRelationshipSignalResolver(socialContacts, identityContactAccess)` —
  builds the `RelationshipSignalResolver` the identity service needs so
  identity never imports social. Inject the result into
  `createContactAccessService({ ..., friendship })`.

## Operations

| Method | Description |
|---|---|
| `getContactsTabData(viewerId)` | Owner's 4-tab aggregate: friends + address book + specialists + incoming contact/friend requests. |
| `getViewerSafeContactProfileState(ownerId, viewerId)` | One DTO the public profile reads; `visibleContactFields` already filtered by policy. |
| `requestContactAccess(input)` | A→B asks B for PII access. |
| `acceptContactRequest(input)` | Receiver accepts with a selected subset of `ApprovedContactField`. |
| `rejectContactRequest(input)` | Receiver rejects. |

## Status truthfully

- Backend logic: BACKEND_PARTIAL — service composes both domains, every
  branch covered by tests, but persistence is in-memory only and no HTTP
  transport ships in this PR.
- Frontend: UI_SHELL_ONLY + MOCK_LOCAL_ONLY — see
  `client/src/features-v2/social/contacts/README.md`.
- IMPLEMENTED requires real persistence + transport — NOT this PR.
