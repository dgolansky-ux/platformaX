# features-v2/professional-profile

Status: `UI_SHELL_ONLY` + `MOCK_LOCAL_ONLY` (Slice 12)

The professional layer of the personal profile. Workplaces and their micro-
feed live here. This feature owns:

- `ProfileProfessionalLayer` — "Miejsca pracy" section embedded in the
  personal profile page.
- `WorkplaceWizard` — 5-step creator (Basics → Profession → Contact →
  Presentation → Summary).
- `WorkplacePage` — single-workplace page (hero + contact + owner actions
  + micro-feed).
- `WorkplaceMicroFeed` — composer (owner only) + post list on the workplace
  page.
- `professionalProfileMockAdapter` — `MOCK_LOCAL_ONLY` transport. No
  `@server/*` imports; mirrors the V2 application-v2/workplace-feed
  use-case in-memory.

## Hard rules

- Workplace is NOT a community. No members. No roles. No join flow.
- No `@server/*` imports.
- No `localStorage` / `sessionStorage` backend.
- No fake save: every submit calls the adapter and surfaces the result.
- No `window.confirm` / `window.alert`.

## Friend-feed teaser

When a workplace post is published with a non-private visibility, the
adapter also creates a `WorkplaceTeaserUi` that the friend-feed feature
renders as a small mini-card (`FriendFeedWorkplaceTeaserCard`, in
`features-v2/friend-feed`). The mini-card is NOT a full post: it carries
a short preview and links back to the full workplace post.
