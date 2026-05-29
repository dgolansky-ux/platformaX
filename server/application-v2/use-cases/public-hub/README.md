# application-v2/use-cases/public-hub

Status: `PARTIAL`

Cross-domain flow (ADR-010, rule PX-APP-001) wiring the **public-hub**
composition domain to its data providers.

public-hub owns no data and depends only on resolver contracts. This use-case
adapts the owner domains' public-api into those contracts:

- `HubOwnerResolver.getProfileSummary` ← `identity.getPublicProfile`
- `HubOwnerResolver.getCommunitySummary` ← `communities.getPublicSummary`
- `HubModulesResolver.listEnabledModuleKeys` ← `modules.listEnabledForOwner`

Then it calls `createPublicHubService` and exposes `getProfileHubView` /
`getCommunityHubView`. No domain is imported by public-hub itself — the coupling
lives here, behind public surfaces only.
