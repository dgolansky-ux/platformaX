# PlatformaX V2 — Legacy Containment

Status: `ACTIVE`  
Owner: Architecture / Scope Control  
Purpose: prevent legacy runtime from entering V2  
Governance Index: `docs/governance/GOVERNANCE_INDEX.md`

> **Note:** `docs/governance/` is the central governance index and registry.
> This file remains the authoritative source of legacy containment rules.

## 1. Purpose

Legacy containment exists to prevent old runtime, old routes, old backend routers and old product assumptions from contaminating PlatformaX V2.

Legacy may inform design and decisions. It must not become active V2 code.

## 2. Core rule

Legacy is source material only.

It may be:

- read,
- compared,
- audited,
- summarized,
- used to understand domain intent,
- used to extract copy/layout/flow ideas,
- referenced in reports.

It must not be:

- imported,
- executed,
- bundled,
- routed,
- re-exported,
- moved into active V2 workspace,
- used as a backend/runtime dependency.

## 3. Workspace rule

The active V2 workspace must contain only V2 code, docs, scripts and safe reference outputs.

Forbidden inside active workspace:

- full old repository
- legacy folders
- `old-code`
- `legacy-reference` with source files
- hidden backup copies
- nested ZIPs containing old runtime
- old `.env`
- old package scripts
- old server routers
- old tests requiring old domains

Reference material belongs outside the active workspace or in reviewed artifact packages that are never imported by code.

## 4. Runtime containment

No active V2 runtime may reach legacy through:

- TypeScript import
- dynamic import
- require()
- route registration
- backend router registration
- symlink
- copied package alias
- build chunk
- feature flag enabling old code
- env variable pointing to old runtime
- test setup that boots old app

## 5. Removed product areas

Removed areas are blocked from active graph unless reintroduced through a future V2 ADR and implemented as V2 domains.

Blocked active areas:

- marketplace
- commerce
- payments
- checkout
- Stripe
- fundraiser
- donations
- productivity
- calendar
- tasks
- habits
- notes
- routines
- legacy passions/pasje product area
- knowledge base
- polls
- courses
- volunteering
- recruitment
- portfolio
- old page builder
- legacy mail newsletter
- old modules outside V2 module architecture

## 6. Route containment contract

Removed areas must not appear in:

- `client/src/App.tsx`
- `client/src/app-v2/**`
- route registries
- nav/sidebar/header/footer/home links
- CTA links
- module registry entries
- backend router registry
- server router exports
- build manifest
- chunk names
- env/webhook config promoted as active product

## 7. Allowed temporary compatibility

`LEGACY_COMPAT_TEMPORARY` is discouraged and cannot be the default.

If it is ever used, it requires all of:

- written owner approval,
- reason,
- removal plan,
- expiry condition,
- no V2 nav/home/profile/sidebar link,
- no public entry point,
- explicit guard exception,
- test proving it is not in active V2 graph.

Without all of the above, it is a failure.

## 8. Reference pack policy

A reference pack may exist only if:

- it is outside active source folders,
- it has no package scripts,
- it is not part of build or tests,
- it has a manifest,
- it contains no secrets,
- it has forward slash paths,
- it has no nested ZIP,
- it is labeled `SOURCE_MATERIAL_ONLY`,
- no V2 code imports it.

## 9. Guard requirements

Required scripts:

- `scripts/check-no-legacy-imports.mjs`
- `scripts/check-removed-product-areas.mjs`
- `scripts/check-build-artifacts.mjs`
- `scripts/validate-bundle.mjs`
- dependency boundary checker

`check-removed-product-areas.mjs` must scan:

- active routes
- route metadata
- nav/home/sidebar/footer
- backend routers
- imports
- build chunks
- static strings in active graph where relevant

## 10. Failure examples

Hard fail:

```ts
import SellerPanel from "@/features/marketplace/SellerPanel";
```

Hard fail:

```ts
appRouter = {
  marketplace: marketplaceRouter
}
```

Hard fail:

```txt
dist/assets/SellerPanel-abc123.js
```

Hard fail:

```txt
legacy-reference/client/src/features/... imported by V2
```

## 11. Report requirement

Any task touching legacy-adjacent code must report:

```md
## Legacy Containment

- Legacy runtime imports: PASS/FAIL
- Removed active routes: PASS/FAIL
- Removed active backend routers: PASS/FAIL
- Removed active chunks: PASS/FAIL
- Reference material used: YES/NO
- Reference material path: <path or N/A>
- Any exceptions: <none or explicit>
```

## 12. Acceptance

Legacy containment is acceptable only when:

- no legacy runtime is reachable,
- removed areas are absent from active graph,
- reference packs are isolated,
- CI enforces containment,
- exceptions require explicit review.
