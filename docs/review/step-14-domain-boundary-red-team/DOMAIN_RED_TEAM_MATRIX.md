# Step 14 — Domain Boundary Red-Team Matrix

| # | Test | Injected violation | Expected guard | Actual result | Restored | Final status |
|---|---|---|---|---|---|---|
| 1 | Unknown backend domain | `server/domains-v2/random-new-domain/` folder | check-domain-registry.mjs | FAIL (exit 1) — "unknown domain folder not in registry" | YES | PASS |
| 2 | Registry entry without folder | "ghost-domain" added to KNOWN_DOMAINS | check-domain-registry.mjs | FAIL (exit 1) — "registered domain has no folder" | YES | PASS |
| 3 | Missing required file | Renamed `channels/public-api.ts` | check-domain-scaffold.mjs | FAIL (exit 1) — "missing required file: public-api.ts" | YES | PASS |
| 4 | Fake status (BACKEND_DONE) | Changed channels README SCAFFOLD_ONLY -> BACKEND_DONE | check-fake-done.mjs | FAIL (exit 1) — "BACKEND_DONE in channels/README.md" | YES | PASS |
| 5 | Cross-domain repository import | `import from "../social/repository"` in identity | audit-domain-boundaries.mjs | FAIL (exit 1) — "cross-domain repository import from social" | YES | PASS |
| 6 | Allowed cross-domain public-api | `import type from "../social/public-api"` in identity | audit-domain-boundaries.mjs | PASS (exit 0) — correctly allowed | YES | PASS |
| 7 | public-hub imports modules repository | `import from "../modules/repository"` in public-hub | audit-domain-boundaries.mjs | FAIL (exit 1) — "cross-domain repository import from modules" | YES | PASS |
| 8 | modules imports events repository | `import from "../events/repository"` in modules | audit-domain-boundaries.mjs | FAIL (exit 1) — "cross-domain repository import from events" | YES | PASS |
| 9 | Frontend cross-domain internal | `import from "../social/repository"` in content-v2 feature | audit-domain-boundaries.mjs | FAIL (exit 1) — "cross-domain repository import from social" | YES | PASS |
| 10 | shared-ui domain logic | `import from "../../features-v2/identity/repository"` in shared-ui | check-feature-registry.mjs | FAIL (exit 1) — "shared-ui contains domain logic" | YES | PASS |
| 11 | app-v2 legacy routes | `/seller`, `/tasks`, `/fundraiser` in app-v2 file | check-removed-product-areas.mjs | FAIL (exit 1) — 3 violations caught | YES | PASS |
| 12 | content-v2 god-domain risk | `import from "../communities-v2/service"` in content-v2 | audit-domain-boundaries.mjs | FAIL (exit 1) — "cross-domain service import from communities-v2" | YES | PASS |
