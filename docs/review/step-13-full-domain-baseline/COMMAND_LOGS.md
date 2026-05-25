# Step 13 — Command Logs

```
$ pnpm check          → PASS (exit 0)
$ pnpm lint           → PASS (exit 0)
$ pnpm test           → PASS (158 tests, 27 files, exit 0)
$ pnpm build          → PASS (28 modules, exit 0)
$ pnpm rules:check    → PASS (17/17 guards, exit 0)
$ pnpm arch:check:v2  → PASS (9/9 checks, exit 0)
$ pnpm guards:domains → PASS (registry + scaffold + feature, exit 0)
$ pnpm guards:commit  → COMMIT_ALLOWED (10/10, exit 0)
$ pnpm guards:bundle  → SMOKE_PASS (17 self-tests, exit 0)
$ pnpm guards:all-local → PASS (rules + secrets + scripts, exit 0)
```

## Fix applied during step

`domain-registry.ts` contained the literal terms "dataUrl" and "base64" in the media domain's `doesNotOwn` field. The `check-media-base64.mjs` guard correctly flagged these. Fixed by replacing with "inline-encoded payloads (see ADR-006)".
