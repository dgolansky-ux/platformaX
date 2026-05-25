# Step 16 — Secret Scanner Matrix

## Detected patterns (19)

| # | Pattern | Label | Example trigger |
|---|---|---|---|
| 1 | `SUPABASE_SERVICE_ROLE_KEY=...` | SUPABASE_SERVICE_ROLE_KEY | Key assignment with 10+ char value |
| 2 | `DATABASE_URL=postgresql://...` | DATABASE_URL | PostgreSQL connection URL assignment |
| 3 | `postgresql://user:pass@host` | PostgreSQL connection string | Connection with embedded credentials |
| 4 | `JWT_SECRET=...` | JWT_SECRET | JWT secret assignment |
| 5 | `OPENAI_API_KEY=sk-...` | OPENAI_API_KEY | OpenAI key assignment |
| 6 | `sk-live_...` | Stripe live key | Stripe live API key |
| 7 | `sk_test_...` | Stripe test key | Stripe test API key |
| 8 | `sk-` + 32 chars | OpenAI-style key | Any sk- prefixed long key |
| 9 | `service_role=eyJ...` | service_role JWT | Supabase service role JWT |
| 10 | `private_key=-----BEGIN` | private_key PEM | PEM private key assignment |
| 11 | `access_token=...` | access_token | OAuth access token |
| 12 | `refresh_token=...` | refresh_token | OAuth refresh token |
| 13 | `eyJhbGciOi...` (40+ chars) | JWT token literal | Raw JWT in code |
| 14 | `AKIA` + 16 chars | AWS access key | AWS IAM key |
| 15 | `ghp_` + 36 chars | GitHub PAT | GitHub personal access token |
| 16 | `gho_` + 36 chars | GitHub OAuth token | GitHub OAuth token |
| 17 | `xoxb-...` | Slack bot token | Slack bot token |
| 18 | `-----BEGIN PRIVATE KEY-----` | Private key block | PEM key block |
| 19 | `sbp_` + 40 chars | Supabase personal key | Supabase personal token |

## Banned tracked files

| File | Status |
|---|---|
| `.env` | BLOCKED |
| `.env.local` | BLOCKED |
| `.env.production` | BLOCKED |

## Safe exceptions

| Path/Pattern | Reason |
|---|---|
| `.env.example` | Placeholder file |
| `.env.test.example` | Placeholder file |
| `docs/security/*` | Security policy documentation |
| `docs/templates/*` | Template documentation |
| `docs/review/*.md` | Red-team / evidence reports |
| `scripts/check-*` | Guard scripts (self-reference) |
| `scripts/__tests__/*` | Test files |
| Lines with `placeholder`, `example`, `your-`, `changeme`, `xxx` | Placeholder values |
| Comment lines (`//`, `#`, `*`, `<!--`) | Documentation comments |
| Empty assignments (`KEY=` or `KEY=""`) | No value present |

## Exclusions (directories)

`node_modules`, `dist`, `build`, `coverage`, `.git`, `.cache`, `.turbo`

## Exclusions (extensions)

`.lock`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.ico`, `.svg`, `.woff`, `.woff2`, `.ttf`, `.eot`, `.zip`, `.tar`, `.gz`
