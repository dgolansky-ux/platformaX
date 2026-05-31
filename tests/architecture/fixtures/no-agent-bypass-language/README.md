# Red-case fixtures — check-no-agent-bypass-language

These files are planted violations used by `pnpm tooling:redcase` (and
the manual reproduction recipe below) to prove the guard
`scripts/check-no-agent-bypass-language.mjs` fails closed on the three
classes of agent-bypass language it is responsible for.

## How to reproduce manually

```
node scripts/check-no-agent-bypass-language.mjs
# expected: process exits 1 and prints AGENT_BYPASS_LANGUAGE_VIOLATION:
# for each of the three planted files below.
```

> The fixture files include the planted strings inside fenced code
> blocks (`@guard-red-case`) only so reviewers can read the planted
> tokens without these tokens triggering OTHER guards. The guard under
> test scans these files literally — fenced or not — and must still
> fail closed on them.

## Cases

### 1. `bad-status-marker.md`

Contains the file-scope marker `ALLOW_STATUS_TERM_IN_POLICY_DOC` outside
any registered policy doc path. Must be caught by the marker-allowlist
branch of the guard.

### 2. `bad-bypass-phrase.md`

Contains the phrase `temporary bypass` outside the governance / AI policy
prefixes. Must be caught by the bypass-language branch of the guard.

### 3. `bad-skip-gate-phrase.md`

Contains the phrase `skip the gate`. Must be caught by the
bypass-language branch of the guard.

## Why fenced

The fixture directory itself sits under `tests/architecture/fixtures/**`
and is intentionally excluded from production lint/build paths
(`eslint.config.js#ignores`). The guard treats every file under `tests/`
as in-scope (no exemption), so the planted strings still trip the guard
when it runs against the working tree.
