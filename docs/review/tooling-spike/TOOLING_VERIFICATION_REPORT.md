# Tooling Verification Report — architecture/quality spike

Status: `ACTIVE`
Branch: `tooling/architecture-boundaries-quality-spike`
Source commit at capture time: `97eb64c` (re-captured every commit on this branch)
Captured (UTC): 2026-05-28T18:44:53Z
Runner: Node v24.15.0, pnpm v11.2.2, Windows 11 (dev)

## Purpose

This document is the **authoritative truth** about what each tool from the
spike actually does, not what was installed. Every claim in the spike PR
description, the coding standards section 22a, and the rules-to-guards
matrix must be reproducible from one of:

- the exact local commands listed below, run on a clean tree;
- `pnpm tooling:redcase` (planted-violation verifier);
- the CI lane results referenced in `.github/workflows/v2-gates.yml`.

No tool is marked PASS unless it produced the corresponding output here.
The two TOOL_MISSING entries are explicitly labelled — they are not
silently treated as PASS anywhere in the spike.

## Result legend

| Token | Meaning |
|---|---|
| `PASS` | Tool ran and exited non-zero on its red case (== enforces). |
| `ENV_BLOCKED` | Tool can't run in this environment (binary/setup missing). The CI lane that *does* run it is named explicitly. |
| `NEEDS_GITHUB_SETUP` | Workflow file is committed but requires a GitHub-side toggle to start running. |
| `PARTIAL_NOT_ENFORCED` | Tool runs but its current configuration only emits warnings — coverage is provided by the parallel tool(s) named alongside. |

## Per-tool results

| Tool | Local run (this report) | CI lane | Red-case run (`pnpm tooling:redcase`) |
|---|---|---|---|
| `pnpm boundaries:check` (eslint-plugin-boundaries v6) | `EXIT=0` (no violations on tree). Deprecation warnings only — see "Truth disclosures" below. | STANDARD lane (`pnpm lint`) runs the same command on PR. | **`PARTIAL_NOT_ENFORCED`**. Red case planted; v6 emits a *warning* about the v5 selector schema and does not error on the violation. depcruise + arch-tests catch the same red case (see below). |
| `pnpm depcruise:check` (dependency-cruiser 17) | `EXIT=0`, 305 modules / 420 deps cruised, 0 errors / 68 `no-orphans` warnings (informational). | DEEP lane runs it on every PR. | **`PASS`** for `no-client-to-server`, `no-cross-domain-internal`, `no-circular`. All three planted red cases exit non-zero with the matching rule name in stderr. |
| `pnpm arch-tests` (Vitest specs `tests/architecture/architecture.test.ts`) | `EXIT=0`, 6/6 tests pass in ~43 ms. | STANDARD lane via `pnpm test` (folds in via vitest workspace); DEEP lane also re-runs `pnpm arch-tests` explicitly. | **`PASS`** for the side-effect-import variant of `client → server` and for cross-domain internal imports (regex now handles extensionless forms). |
| `pnpm knip:check` | `EXIT=0` by configuration — `files`, `exports`, `types`, `duplicates`, `binaries` all set to `warn`. 83 unused-file candidates reported (informational baseline). | WEEKLY lane (`v2-weekly-audit.yml`), `continue-on-error: true` by design. | **`PASS`** in the "did Knip notice the planted file?" sense. The planted `shared/redcase_knip_unused.ts` shows up under `Unused files`. Knip is deliberately non-blocking; the red-case channel is the line in `tooling:redcase`. |
| `pnpm secrets:gitleaks` (dev-mode wrapper) | `EXIT=0` with loud `GITLEAKS_BINARY_NOT_INSTALLED` log. **The binary is not on PATH on this developer workstation; gitleaks did not actually run.** | DEEP lane runs `gitleaks/gitleaks-action@v2` directly *and* runs the wrapper in required mode (next row). | **`ENV_BLOCKED`** locally — labelled `REDCASE_TOOL_MISSING` in the verifier output. Reason: binary missing; CI uses the official action. |
| `pnpm secrets:gitleaks:required` (`--required` / `GITLEAKS_REQUIRED=1`) | `EXIT=2` with `GITLEAKS_REQUIRED_BUT_MISSING`. **Hard mode confirmed: a missing binary BLOCKS.** This is the mode wired into CI's DEEP lane. | DEEP lane: `Gitleaks wrapper (required mode)` step runs it; missing binary fails CI. | Not run separately — exercised end-to-end as the gitleaks step in the verifier above. |
| `pnpm tooling:check` | `EXIT=0` (composite: boundaries + depcruise + arch-tests + dev-mode gitleaks). Gitleaks did not actually run on the dev workstation; see the disclosure under "Truth disclosures". | STANDARD lane does not re-run this aggregate (it runs each component individually). | Not a separate red case — every component is covered. |
| `pnpm tooling:redcase` (`scripts/verify-tooling-red-cases.mjs`) | `EXIT=0`. Summary: `total cases: 8, BLOCKED: 6, TOOL_MISSING: 2, NOT_ENFORCED: 0`. | DEEP lane runs `pnpm tooling:redcase` so a regression that silently weakens any tool fails CI. | Authoritative source. The two `TOOL_MISSING` entries are eslint-plugin-boundaries v6 (PARTIAL_NOT_ENFORCED, see above) and gitleaks binary on this dev workstation. |
| `.github/workflows/codeql.yml` | n/a — runs only on GitHub. | Workflow file present. | **`NEEDS_GITHUB_SETUP`**. Must be enabled by the repo owner under Settings → Code security and analysis → Code scanning → Set up. |

## Reproducer

From a clean working tree, on the spike branch:

```bash
pnpm install --frozen-lockfile
pnpm boundaries:check
pnpm depcruise:check
pnpm arch-tests
pnpm knip:check
pnpm secrets:gitleaks
pnpm secrets:gitleaks:required
pnpm tooling:check
pnpm tooling:redcase
```

The first eight commands print the outputs that this table summarises.
The ninth command plants safe red cases under real paths, asserts each
relevant tool exits non-zero, then cleans up — leaving the working tree
exactly as it was.

## Truth disclosures (do not claim PASS unless these hold)

1. **eslint-plugin-boundaries v6 reports the current config as "legacy
   selector syntax"** (see deprecation warnings on every `pnpm
   boundaries:check`). The rules ship but are downgraded to warnings,
   so the red case is `PARTIAL_NOT_ENFORCED`. Coverage is provided by
   dependency-cruiser (`no-client-to-server`, `no-cross-domain-internal`,
   `no-circular`, `shared-no-runtime`, `no-legacy-runtime-import`) and
   the Vitest arch tests. Full enforcement here will require migrating
   `eslint.config.js` from `boundaries/element-types` +
   `boundaries/entry-point` to the unified `boundaries/dependencies`
   rule with object-based selectors. Tracked as a follow-up spike.

2. **`pnpm secrets:gitleaks` (dev mode) exits 0 when the binary is
   missing**, on purpose, so a developer without gitleaks can keep
   working. **This means a green dev run does not prove that gitleaks
   scanned anything.** CI uses `pnpm secrets:gitleaks:required` and the
   `gitleaks/gitleaks-action@v2` step, both of which fail on a missing
   binary or any finding.

3. **Knip is intentionally non-blocking.** `knip.json` sets every rule
   to `warn` and the weekly workflow uses `continue-on-error: true`.
   The red-case verifier confirms Knip *detects* the planted file —
   that is the contract here, not "fail the build on unused code".

4. **CodeQL is `NEEDS_GITHUB_SETUP`.** The workflow file
   `.github/workflows/codeql.yml` is committed but does nothing until
   the repo owner enables Code scanning in repo Settings.

5. **No custom guard has been removed.** `GUARDS_REGISTRY.yml` marks
   the overlapping custom guards as `parallel_status:
   PARALLEL_WITH_TOOLING`. Removal will happen in a separate cleanup PR
   only after audit approval — never in this spike. The `REPLACED_BY_TOOL`
   status is reserved for that future PR and is not used here.

## Files referenced by this report

- `package.json` — scripts: `boundaries:check`, `depcruise:check`, `depcruise:graph`, `arch-tests`, `knip:check`, `secrets:gitleaks`, `secrets:gitleaks:required`, `tooling:check`, `tooling:weekly`, `tooling:redcase`.
- `.dependency-cruiser.cjs`, `.gitleaks.toml`, `knip.json`, `eslint.config.js`.
- `scripts/run-gitleaks.mjs` — two-mode wrapper.
- `scripts/verify-tooling-red-cases.mjs` — the verifier.
- `tests/architecture/architecture.test.ts` — executable PX-ARCH invariants.
- `tests/architecture/fixtures/` — committed red-case fixtures with documented
  reproduction commands in `tests/architecture/fixtures/README.md`.
- `.github/workflows/v2-gates.yml` — STANDARD + DEEP lanes (DEEP runs
  depcruise, arch-tests, gitleaks-action, gitleaks:required wrapper,
  tooling:redcase).
- `.github/workflows/v2-weekly-audit.yml` — WEEKLY lane (Knip + dep
  graph + audit ZIP).
- `.github/workflows/codeql.yml` — `NEEDS_GITHUB_SETUP`.

## Outstanding work (not in this spike)

- Migrate `eslint.config.js` to `boundaries/dependencies` to lift
  eslint-plugin-boundaries from `PARTIAL_NOT_ENFORCED` to `PASS`.
- Enable CodeQL in repo Settings.
- After audit approval, separate cleanup PR may flip selected guards
  from `PARALLEL_WITH_TOOLING` to `REPLACED_BY_TOOL` and delete the
  corresponding custom scripts. Not in this spike.
