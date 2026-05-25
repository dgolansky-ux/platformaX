# Step 18 — ZIP Manifest

## Evidence bundle

- ZIP path: `%USERPROFILE%\Desktop\ZIPY\platformax-v2-final-bramka-evidence.zip`
- SHA256 path: `%USERPROFILE%\Desktop\ZIPY\platformax-v2-final-bramka-evidence.sha256.txt`

## Exclusions

| Pattern | Reason |
|---|---|
| `node_modules/` | Dependencies |
| `dist/` | Build output |
| `build/` | Build output |
| `coverage/` | Test coverage |
| `.git/` | Git internals |
| `.env` | Secrets |
| `.env.local` | Secrets |
| `.env.production` | Secrets |
| `.cache/` | Cache |
| `.turbo/` | Cache |
| `*.zip` | Nested archives |

## Validation

Bundle validated with: `node scripts/validate-bundle.mjs <path>`
- No raw backslash paths
- No nested ZIPs
- No banned directories/files
- Required reports present
