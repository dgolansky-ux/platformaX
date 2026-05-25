# Step 03 — Guards Matrix

| Guard | Scope | Blocks | Allows | Current result |
|---|---|---|---|---|
| `check-fake-done.mjs` | docs, client, server, shared, scripts, package.json | VISUAL_DONE, BACKEND_DONE, FULL_DONE, BRAMKA_COMPLETE, CURRENT_V2_SCOPE_CLEAN, READY_FOR_PRODUCTION, PRODUCTION_READY | Policy docs, scripts (governance context) | PASS |
| `check-domain-status.mjs` | docs/architecture/PlatformaX-V2-domain-status.md | DONE, FULL_DONE, VISUAL_DONE, BACKEND_DONE, CLEAN in status table | Allowed taxonomy (NOT_STARTED, SCAFFOLD_ONLY, etc.) | PASS |
| `check-no-legacy-imports.mjs` | app-v2, features-v2, domains-v2, shared | imports from features/, pages/, components/, domains/, legacy/, old-code/, Starykod/ | Clean V2 imports | PASS |
| `check-removed-product-areas.mjs` | client, server, shared | seller, purchases, marketplace, calendar, notes, habits, tasks, pages, pasje, passions, fundraiser, donations, commerce, productivity, stripe, checkout, payments, knowledgeBase, recruitment, portfolio | Governance docs, guard scripts | PASS |
| `audit-domain-boundaries.mjs` | domains-v2, features-v2, app-v2 | Cross-domain repository, service, policy, router, mapper, db, schema, cache-keys, internal | public-api, contracts, events, dto, shared | PASS |
| `check-test-env-safety.mjs` | test setup, vitest/jest config | dotenv.config with .env, process.env.DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY in setup | .env.test.example | PASS |
| `check-env-safety.mjs` | all tracked files | .env, .env.local, .env.production, DATABASE_URL=, postgresql://, service_role, JWT_SECRET=, OPENAI_API_KEY=, sk_live, sk_test | .env.example, .env.test.example, docs/security/, scripts, placeholders | PASS |
| `check-public-dto-pii.mjs` | domains-v2 dto/public-api, shared | email, phone, dateOfBirth, birthDate, privateContact, authMetadata, provider, token, serviceRole | Private/admin DTO, ALLOW_PRIVATE_DTO_PII marker | PASS |
| `check-media-base64.mjs` | app-v2, features-v2, domains-v2, shared | readAsDataURL, dataUrl, base64Upload, base64 | Docs, scripts (governance) | PASS |
| `check-pagination.mjs` | domains-v2, features-v2, app-v2 | List/feed/search without limit/cursor/pagination | No runtime lists = auto-pass | PASS (NO_RUNTIME_LISTS) |
| `check-file-complexity.mjs` | client/src, server, shared, scripts | Component >350, service >400, repository >500, test >1000, script >500 lines; eslint-disable max-lines without ALLOW_FILE_SIZE_EXCEPTION | Files within limits | PASS |
| `check-build-artifacts.mjs` | dist/ | SellerPanel, Marketplace, Tasks, Calendar, Passions, Fundraiser, PageBuilder chunks | No dist = skip | PASS |
| `check-supabase-migrations-safety.mjs` | supabase/migrations, migrations, db/migrations | DROP TABLE, TRUNCATE, ALTER TABLE DROP COLUMN, DISABLE ROW LEVEL SECURITY, USING true | REVIEW_REQUIRED marker; no migrations = skip | PASS (NO_MIGRATIONS) |
| `validate-bundle.mjs` | ZIP bundle entries | Backslash `\` in entry paths | Forward-slash `/` paths | PASS (smoke) |
| `check-diff-safety.mjs` | git diff | VISUAL_DONE, BACKEND_DONE, FULL_DONE, window.alert, readAsDataURL, service_role, DATABASE_URL, removed routes | No git = graceful skip | PASS (NO_GIT) |
| `no-commit-if-dirty-gates.mjs` | all gates + check/lint/test/build | Any failing gate | All gates green = COMMIT_ALLOWED | (umbrella) |
| `rules-check.mjs` | umbrella — 14 guards | Any failing guard | All pass = RULES_CHECK_PASS | PASS |
| `arch-check-v2.mjs` | umbrella — 6 guards | Any failing arch guard | All pass = ARCH_CHECK_V2_PASS | PASS |
