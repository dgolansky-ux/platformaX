# Step 14 — Guard Failure Evidence

## Test 1 — Unknown backend domain
```
DOMAIN_REGISTRY_VIOLATION: unknown domain folder "server/domains-v2/random-new-domain" not in registry
check-domain-registry: 1 violation(s)
```

## Test 2 — Registry entry without folder
```
DOMAIN_REGISTRY_VIOLATION: registered domain "ghost-domain" has no folder at server/domains-v2/ghost-domain
check-domain-registry: 1 violation(s)
```

## Test 3 — Missing required file
```
DOMAIN_SCAFFOLD_VIOLATION: "channels" missing required file: public-api.ts
check-domain-scaffold: 1 violation(s)
```

## Test 4 — Fake status
```
FAKE_DONE_VIOLATION: "BACKEND_DONE" in server/domains-v2/channels/README.md
check-fake-done: 1 violation(s) found
```

## Test 5 — Cross-domain repository import
```
BOUNDARY_VIOLATION: cross-domain "repository" import from "social" in server/domains-v2/identity/public-api.ts
(import: "../social/repository", resolved: "server/domains-v2/social/repository")
audit-domain-boundaries: 1 violation(s)
```

## Test 6 — Allowed cross-domain public-api (correctly PASS)
```
AUDIT_DOMAIN_BOUNDARIES_PASS
```

## Test 7 — public-hub imports modules repository
```
BOUNDARY_VIOLATION: cross-domain "repository" import from "modules" in server/domains-v2/public-hub/public-api.ts
(import: "../modules/repository", resolved: "server/domains-v2/modules/repository")
audit-domain-boundaries: 1 violation(s)
```

## Test 8 — modules imports events repository
```
BOUNDARY_VIOLATION: cross-domain "repository" import from "events" in server/domains-v2/modules/public-api.ts
(import: "../events/repository", resolved: "server/domains-v2/events/repository")
audit-domain-boundaries: 1 violation(s)
```

## Test 9 — Frontend cross-domain internal
```
BOUNDARY_VIOLATION: cross-domain "repository" import from "social" in client/src/features-v2/content-v2/index.ts
(import: "../social/repository", resolved: "client/src/features-v2/social/repository")
audit-domain-boundaries: 1 violation(s)
```

## Test 10 — shared-ui domain logic
```
FEATURE_REGISTRY_VIOLATION: shared-ui contains domain logic in /client/src/features-v2/shared-ui/index.ts
check-feature-registry: 1 violation(s)
```

## Test 11 — app-v2 legacy routes
```
REMOVED_PRODUCT_AREA: "seller" active in client/src/app-v2/__redteam__/legacy-route-test.ts:1
REMOVED_PRODUCT_AREA: "tasks" active in client/src/app-v2/__redteam__/legacy-route-test.ts:1
REMOVED_PRODUCT_AREA: "fundraiser" active in client/src/app-v2/__redteam__/legacy-route-test.ts:1
check-removed-product-areas: 3 violation(s)
```

## Test 12 — content-v2 god-domain risk
```
BOUNDARY_VIOLATION: cross-domain "service" import from "communities-v2" in server/domains-v2/content-v2/public-api.ts
(import: "../communities-v2/service", resolved: "server/domains-v2/communities-v2/service")
audit-domain-boundaries: 1 violation(s)
```
