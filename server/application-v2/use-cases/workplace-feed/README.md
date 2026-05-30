# application-v2/use-cases/workplace-feed

Status: `BACKEND_PARTIAL` (Slice 12)

Composes:

- `identity/workplaces.public-api` — workplace entity, contact view, viewer
  state, listing the professional layer for a profile owner.
- `content-v2/workplace-posts.public-api` — workplace micro-feed posts.
- `content-v2/workplace-teasers.public-api` — friend-feed mini-teaser
  read-model.
- `identity.public-api` — owner public summary (no PII enrichment).
- `social.public-api` — friendship verdict for the professional-layer view.

## Use-cases

- `createWorkplaceForViewer` — owner-scoped wrapper around
  `workplaces.createWorkplace`.
- `getWorkplacePageView` / `getWorkplacePageViewBySlug` — composes workplace
  + owner + contact + viewer state in one call for the workplace page.
- `listProfessionalLayer` — enumerates the owner's workplaces for the
  personal profile professional layer.
- `createWorkplacePostWithFriendFeedTeaser` — publishes a workplace post and
  best-effort generates the friend-feed teaser (private posts skip the
  teaser; dedupe is enforced by `workplace-teasers`).
- `listWorkplaceMicroFeed` — cursor-paginated, viewer-gated read of the
  workplace micro-feed enriched with the owner summary.
- `listFriendFeedWorkplaceTeasers` — viewer-scoped read of friend-feed
  teasers, enriched with the owner summary.

## Boundaries

This use-case calls each domain only via `public-api.ts`. Tests under
`__tests__/` compose the in-memory adapters end-to-end.
