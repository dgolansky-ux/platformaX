# PlatformaX V2 — Domain Ownership Matrix

Status: `ACTIVE`  
Owner: Architecture / Domain Governance  
Purpose: define source-of-truth ownership, allowed readers, writers and review triggers

## 1. Rule

Every important concept has one owner.

Read models, hubs, dashboards and composition layers are not source of truth.

## 2. Matrix

| Concept | Owner | May read through | May write through | Forbidden |
|---|---|---|---|---|
| Auth subject | identity | identity public contracts | identity service | other domains owning auth internals |
| Private user profile | identity | private/admin DTO only | identity service | public DTO exposure |
| Public profile summary | identity | PublicProfileDTO | identity service | raw DB record sharing |
| Profession/category metadata | identity | identity contracts | identity admin/service | hardcoded copies in unrelated domains |
| Friendship relation | social | social public-api | social service | identity/content storing relationship truth |
| Contact access grants | social + identity policy | public contracts | social service | exposing private contact data |
| Community | communities-v2 | communities public-api | communities service | content/modules owning community truth |
| Community membership | communities-v2 | communities public-api/policy | communities service | content/chat/events owning roles |
| Community feed settings | communities-v2 | public policy contract | communities service | content deciding role truth |
| Post | content-v2/posts | content public-api | content service | profile/community domains owning posts |
| Feed item | content-v2/feeds | content feed contracts | content read-model worker/service | social/community storing feed items as truth |
| Comment | content-v2/comments | content public-api | content service | other domains storing comments |
| Reaction | content-v2/reactions | content public-api | content service | per-card N+1 reaction fetches |
| Topic/article | content-v2/topics | content/modules/public-hub contracts | content service | communities owning topics |
| Channel | channels | channels public-api | channels service | community membership conflated with follows |
| Channel follow | channels | channels public-api | channels service | social friendship conflated with channel follow |
| Conversation | chat | chat public-api | chat service | newsletter as mass direct messages |
| Message | chat | chat public-api | chat service | synchronous fanout loops |
| Event | events | events public-api | events service | payment/ticket coupling without ADR |
| Participant registration | events | events public-api | events service | unpaginated participant lists |
| Module definition | modules | modules contracts | modules service | hardcoded module tabs in owners |
| Module enablement | modules | modules public-api | modules service | public-hub owning enablement truth |
| Public Hub page | public-hub | composition contracts | composition only | public-hub owning module data |
| Media asset | media | media public-api | media service | base64/dataUrl in owner domains |
| Notification | notifications | notification contracts | outbox/worker | sync fanout in request path |
| Search projection | search | search contracts | projection worker | full table scans/private query logs |
| Audit log | audit | admin/audit contracts | append-only audit service | public audit exposure |
| Feature flags/config | system | system public contracts | system service | secrets in frontend/docs |

## 3. Review triggers

The following changes require architecture review:

- any `public-api.ts` change
- any public DTO change
- any policy change
- any routing/App.tsx change
- any `scripts/check-*` or `scripts/validate-*` change
- any migration affecting ownership tables
- any cross-domain contract
- any change to env/security handling
- any CODEOWNERS or CI weakening
- any removed-area exception

## 4. CODEOWNERS baseline

```txt
/server/domains-v2/**                 @architecture-owner
/client/src/app-v2/**                 @architecture-owner
/client/src/features-v2/**            @architecture-owner
/client/src/App.tsx                   @architecture-owner
/scripts/check-*                      @governance-owner
/scripts/validate-*                   @governance-owner
/docs/architecture/**                 @architecture-owner
/.github/workflows/**                 @governance-owner
```

For a one-person project, the owner can be the project owner. The point is not bureaucracy. The point is forced conscious review.

## 5. Acceptance

This matrix is accepted when:

- every active domain has an owner,
- every source-of-truth entity is assigned,
- CODEOWNERS can be derived from it,
- check scripts can use it as a reference.
