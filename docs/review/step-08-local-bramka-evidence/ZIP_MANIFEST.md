# Step 08 — ZIP Manifest (v2)

## Bundle location

- **ZIP path:** `C:\Users\dgola\Desktop\ZIPY\platformax-v2-step-08-local-bramka-evidence-v2.zip`
- **SHA256 path:** `C:\Users\dgola\Desktop\ZIPY\platformax-v2-step-08-local-bramka-evidence-v2.sha256.txt`
- **SHA256:** `B2F4FE5B5153830E82C35F72ABAC34DE6C10FEE531CD72E9C3E99413FE9EA99B`

## Metrics

| Metric | Value |
|---|---|
| File count | 153 |
| ZIP size | 157 356 bytes |

## Validation (PowerShell)

| Check | Result |
|---|---|
| NO_NODE_MODULES | PASS |
| NO_DIST | PASS |
| NO_BUILD | PASS |
| NO_COVERAGE | PASS |
| NO_DOT_ENV | PASS |
| NO_DOT_GIT | PASS |
| NO_NESTED_ZIP | PASS |
| NO_RAW_BACKSLASH_PATHS | PASS |
| NO_SECRETS_CONFIRMED | PASS |
| ZIP_STORED_OUTSIDE_REPO | PASS |

## Validation (validate-bundle.mjs)

```
ZIP entries: 153
Backslash paths: 0
Nested ZIPs: 0
Banned files: 0
Has reports: YES
VALIDATE_BUNDLE_PASS
```

## Previous bundle

- **v1 ZIP:** `platformax-v2-step-08-local-bramka-evidence.zip` (151 files, before README/validate-bundle update)
- **v2 ZIP:** `platformax-v2-step-08-local-bramka-evidence-v2.zip` (153 files, with updated README + enhanced validate-bundle)
