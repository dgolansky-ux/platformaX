# Architecture-tooling red-case fixtures

These files are **safe fixtures**: they contain code shapes that each
tool MUST flag. They are excluded from every active gate via:

- `eslint.config.js` → `ignores: ["tests/architecture/fixtures/**"]`
- `.dependency-cruiser.cjs` → `options.exclude.path` includes
  `tests/architecture/fixtures/`
- `knip.json` → `ignore` includes `tests/architecture/fixtures/**`
- `.gitleaks.toml` → first allowlist `paths` covers them
- `tsconfig` `exclude` keeps them out of the build/typecheck

That means none of the gates will fail because of them in normal CI.
The fixtures exist so:

1. A reviewer can verify with their own eyes that each tool catches its
   target violation by **temporarily removing the ignore** for the
   fixture folder and re-running the corresponding script. The expected
   tool output for each red case is documented below.
2. If a future agent claims "the new tool is equivalent to the old custom
   guard", the red-case proof is in this folder — no need to mutate
   production code to test it.

## Red cases

| Fixture | Tool | What the tool MUST report |
|---|---|---|
| `bad-client-to-server.tsx` | eslint-plugin-boundaries / dependency-cruiser / architecture tests | client/* importing server/* — `boundaries/element-types` violation + dep-cruiser `no-client-to-server` + architecture test `client/* never imports server/*` |
| `bad-cross-domain-internal.ts` | eslint-plugin-boundaries / dependency-cruiser / architecture tests | A server domain reaching another domain's `internal/*` — `boundaries/entry-point` + dep-cruiser `no-cross-domain-internal` + architecture test |
| `bad-circular-a.ts` ↔ `bad-circular-b.ts` | dependency-cruiser | Circular dependency — `no-circular` violation |
| `bad-unused-export.ts` | Knip | Unused export `unusedHelper` — Knip reports it as an unused export candidate |
| `bad-fake-secret.txt` | Gitleaks | Test/example AWS key (not real) — Gitleaks reports `aws-access-token` |

## How to reproduce the red-case proofs locally

Each block below is the **exact** command to run from repo root, with the
expected fail line. None of these is wired into any CI lane because the
fixtures stay excluded; remove the matching ignore entry from the
corresponding config file *only* in a throwaway local branch when you
want to re-verify the proofs.

### bad-client-to-server.tsx
```
# Temporarily remove "tests/architecture/fixtures/**" from
# eslint.config.js → ignores, then:
pnpm lint
# Expected output (one of these — depending on which rule fires first):
#   error  importing 'server/domains-v2/identity/repository'
#          from element 'client-app-v2' is not allowed
#          (boundaries/element-types)
```

### bad-cross-domain-internal.ts
```
# Temporarily remove the fixtures path from
# .dependency-cruiser.cjs → options.exclude.path, then:
pnpm depcruise:check
# Expected:
#   error no-cross-domain-internal:
#     tests/architecture/fixtures/bad-cross-domain-internal.ts ->
#     server/domains-v2/media/internal/record
```

### bad-circular-a.ts / bad-circular-b.ts
```
# Same removal as above for dependency-cruiser. Then:
pnpm depcruise:check
# Expected:
#   error no-circular: bad-circular-a -> bad-circular-b -> bad-circular-a
```

### bad-unused-export.ts
```
# Remove "tests/architecture/fixtures/**" from knip.json → ignore. Then:
pnpm knip:check
# Expected report row:
#   tests/architecture/fixtures/bad-unused-export.ts  unusedHelper  unused export
```

### bad-fake-secret.txt
```
# Remove the fixtures allowlist path from .gitleaks.toml. Then:
pnpm secrets:gitleaks
# Expected:
#   Fake AWS key: AKIAIOSFODNN7EXAMPLE (allowlisted in default config) —
#   replace with a non-allowlisted example like
#   AKIA[uppercase + 16 chars]   to get the actual finding.
```

## Why we keep them excluded by default

These fixtures intentionally contain forbidden code. Letting any
production gate scan them would either:

- block every CI run (failing on the planted violation), or
- force us to add an allowlist for the production code as well
  (silently weakening the gate).

The ignore lists are deliberate.
