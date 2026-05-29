# PlatformaX V2 — Exceptions Register

Status: `ACTIVE`
Owner: Governance

## Purpose

Registry of active exceptions to governance rules. Every exception must be justified, time-bound, and reviewed.

## Format

| Field | Description |
|---|---|
| Exception ID | Unique identifier (EXC-NNN) |
| Rule ID | Which rule is being excepted |
| Reason | Why the exception is needed |
| Expiry | When this exception expires or must be reviewed |
| Owner | Who approved the exception |
| Evidence | Link to ADR, report, or approval |
| Risk | What risk this exception introduces |
| Status | active / expired / revoked |

## Active Exceptions

| Exception ID | Rule ID | Reason | Expiry | Owner | Evidence | Risk | Status | Files |
|---|---|---|---|---|---|---|---|---|
| EXC-001 | PX-CODE-001 | Multi-step onboarding flow holds linear form state for 5 steps; splitting per-step into separate route shells would fragment shared state and submit/validation control flow without test-coverage payback while the runtime is still PARTIAL. | 2026-08-31 | dawid | docs/review/step-30-architecture-quality-scalability-guards/STEP_30_REVIEW.md | Component grows past 280-line route limit, harder to review; mitigated by extracted step components and form-state hook. | active | client/src/app-v2/onboarding/OnboardingFlow.tsx |
| EXC-002 | PX-CODE-001 | Profile header CSS is a single responsive composition with 6 breakpoint blocks (mobile-first → desktop → reduced-motion); CSS modules cannot import each other, so splitting would duplicate selectors and break cascade. | 2026-08-31 | dawid | docs/review/step-30-architecture-quality-scalability-guards/STEP_30_REVIEW.md | One CSS module exceeds the 320-line / size cap; mitigated by per-block comment headers and design-token usage. | active | client/src/app-v2/profile/styles/profile-header.module.css |
| EXC-003 | PX-SEC-001 | Shared contract files co-locate the owner-only (Private) Input/Owner types — CompleteOnboardingInput / UpdatePrivateProfileInput / UpdatePersonalStatusInput / OwnerProfileView — with their Public counterparts. PII tokens (`phone`, `dateOfBirth`) appear in the Private types and the file-level PII guard cannot tell the surrounding type's privacy class. Public DTOs (PublicProfileDTO / PublicProfileView) are filtered by the server-side mapper and the no-PII property tests in identity domain still cover them. | 2026-08-31 | dawid | server/domains-v2/identity/__tests__/public-mapper-no-pii.test.ts and server/application-v2/use-cases/profile/__tests__/service.test.ts (PII-free public view assertions) | Marker may grow stale if a future contributor adds a new Public type to the same file without realising PII is allowlisted at file scope; mitigated by the dedicated no-PII property tests on the public mapper + public view. | active | shared/contracts/identity.ts shared/contracts/profile.ts |
| EXC-004 | PX-SEC-001 | Contacts contract and identity contact-access DTOs co-locate owner-only types (`OwnerContactFieldsDTO`, `UpdateContactFieldsInput`, etc.) and the policy-filtered `VisibleContactFieldsDTO` with the public `ContactProfileRelationshipDTO`. PII tokens (`phone`, `emailContact`) appear in the owner/policy-filtered types; the file-level PII guard cannot tell the surrounding type's privacy class. The policy filter lives in `server/domains-v2/identity/contact-access-policy.ts` + `application-v2/use-cases/contacts` and is covered by `contact-access-policy.test.ts`, `contact-access-service.test.ts` (zero-PII for stranger), and the application-level public-DTO-zero-PII tests. `ContactProfileRelationshipDTO` itself carries no raw PII — only the already-filtered `visibleContactFields` map produced by the policy. | 2026-08-31 | dawid | server/domains-v2/identity/__tests__/contact-access-policy.test.ts + contact-access-service.test.ts + server/application-v2/use-cases/contacts/__tests__ — public-DTO-zero-PII and viewer-policy tests. | Marker may grow stale if a future contributor adds a new Public type to one of these files without realising PII is allowlisted at file scope; mitigated by the dedicated policy tests covering owner / friend / approved / stranger combinations. | active | shared/contracts/contacts.ts server/domains-v2/identity/contact-access-dto.ts |
| EXC-005 | PX-CODE-001 | `shared/contracts/contacts.ts` is the single canonical contract for the whole Kontakty slice: field/permission types, contact-request lifecycle, the four owner-vs-mutual relation concepts, owner-local circle labels (`FriendCircle`, `ContactGroupEntry`) and the view DTOs (`ContactProfileRelationshipDTO`, `ContactListItemDTO`, `ContactsTabData`). The owner clarification (2026-05-29) added the circle/list types, pushing it to 20 type exports (budget 15). Splitting would fragment the source of truth and create circular type imports between the view DTOs and the relation enums. | 2026-08-31 | dawid | docs/review/contacts-v2/LEGACY_CONTACTS_ANALYSIS.md + server/application-v2/use-cases/contacts/__tests__/service.test.ts (owner-logic separation tests). | Type-only contract file exceeds the 15-export structural budget; harder to scan. Mitigated: it is types-only (no logic), grouped by clearly commented concept blocks, and covered by the use-case owner-logic tests. | active | shared/contracts/contacts.ts |

## Expired / Revoked Exceptions

None.

## Rules

1. Exceptions must be approved by the project owner.
2. Exceptions must have an expiry date or condition.
3. Expired exceptions are automatically revoked.
4. Exceptions without evidence are invalid.
5. Broad exceptions (e.g. "all guards disabled") are forbidden.
6. Each exception applies to exactly one rule or a small named set.
