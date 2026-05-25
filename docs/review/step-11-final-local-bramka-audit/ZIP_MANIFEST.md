# Step 11 — ZIP Manifest

## Bundle v2 (portable validator)

| Item | Value |
|---|---|
| ZIP name | `platformax-v2-step-11-final-local-bramka-audit-v2.zip` |
| ZIP path | `C:\Users\dgola\Desktop\ZIPY\platformax-v2-step-11-final-local-bramka-audit-v2.zip` |
| SHA256 path | `C:\Users\dgola\Desktop\ZIPY\platformax-v2-step-11-final-local-bramka-audit-v2.sha256.txt` |
| SHA256 | `B5A6BA2CF6DAEDBA8094FF4E5217EEE0C66F539B01C5A19C35674C54B1D18478` |
| File count | 176 |
| Raw backslash paths count | 0 |
| Nested ZIP count | 0 |
| Banned files count | 0 |
| Secrets count | 0 |
| Validator result | `VALIDATE_BUNDLE_PASS` |

## Validation checks

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
| NO_LEGACY_CODE | PASS |
| NO_SECRETS_CONFIRMED | PASS |
| ZIP_STORED_OUTSIDE_REPO | PASS |

## Validator details

```
$ node scripts/validate-bundle.mjs <zip-path>
ZIP entries: 176
Backslash paths: 0
Nested ZIPs: 0
Banned files: 0
Has review docs: YES
Has STEP_11_REPORT: YES
Has ZIP_MANIFEST: YES
Has FILE_MANIFEST: YES
VALIDATE_BUNDLE_PASS
```

Validator uses `adm-zip` (portable Node.js, no PowerShell dependency).
