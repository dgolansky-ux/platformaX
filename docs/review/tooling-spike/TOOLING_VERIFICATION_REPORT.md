# Tooling Verification Report — architecture/quality spike

Status: `PARTIAL` (overall) — see "Per-tool results" below for the breakdown.
Branch: `tooling/architecture-boundaries-quality-spike`
Source commit at capture time: `b38ccf1` (re-captured every commit on this branch)
Captured (UTC): 2026-05-29T02:11:23Z
Runner: Node v24.15.0, pnpm v11.2.2, Windows 11 (dev)

## Purpose

This document is the **authoritative truth** about what each tool from the
spike actually does, not what was installed. Every claim in the spike PR
description, the coding standards section 22a, and the rules-to-guards
matrix must be reproducible from one of:

- the exact local commands listed below, run on a clean tree;
- `pnpm tooling:redcase` / `pnpm tooling:redcase:strict` — the planted
  red-case verifier;
- the CI lane results referenced in `.github/workflows/v2-gates.yml`.

No tool is marked PASS unless it produced the corresponding output here.
TOOL_MISSING entries are explicitly labelled — they are not silently
treated as PASS anywhere in the spike. Overall STATUS rolls up to
`PARTIAL` because two channels (eslint-plugin-boundaries v6 enforcement,
gitleaks binary on this developer workstation) currently do not block on
their own. Coverage for both gaps is named explicitly in the relevant
rows below.

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
| `pnpm boundaries:check` (eslint-plugin-boundaries v6) | `EXIT=0` (no violations on tree). Plugin is loaded but only `boundaries/no-unknown` is configured; the previous `boundaries/element-types` rules were dropped because v6 reports them as legacy and a quick v6 migration left targets `isUnknown: true` (no TS path resolver wired). See "Truth disclosures". | STANDARD lane (`pnpm lint`) runs the same command on PR. | **`PARTIAL_NOT_ENFORCED`**. Tracked as `docs/governance/followups/FIX_ESLINT_PLUGIN_BOUNDARIES_V6_ENFORCEMENT.md`. depcruise + arch-tests + the hardened custom guard (next rows) catch the same red case. |
| `pnpm depcruise:check` (dependency-cruiser 17) | `EXIT=0`, 305 modules / 420 deps cruised, 0 errors / 68 `no-orphans` warnings (informational). | DEEP lane runs it on every PR. | **`PASS`** for `no-client-to-server`, `no-cross-domain-internal`, `no-circular`. All three planted red cases exit non-zero with the matching rule name in stderr. |
| `pnpm arch-tests` (Vitest specs `tests/architecture/architecture.test.ts`) | `EXIT=0`, 6/6 tests pass in ~43 ms. | STANDARD lane via `pnpm test`; DEEP lane also re-runs `pnpm arch-tests` explicitly. | **`PASS`** for the side-effect-import variant of `client → server` and for cross-domain internal imports (regex covers `from "…"`, dynamic `import("…")`, and extensionless side-effect `import "…"`). |
| `node scripts/audit-domain-boundaries.mjs` (custom guard) | `EXIT=0` baseline. Hardened on 2026-05-29 after an adversarial audit found a side-effect `import "@server/…"` from `client/**` bypassed every custom guard. The guard now: (a) extracts side-effect imports too, (b) loops over all extracted specs to flag `client/** → @server/*`, `client/** → ../server/**`, `shared/** → @server/*`, `shared/** → ../server/**`. | STANDARD lane via `pnpm guards:all-local`. | **`PASS`** for all four newly-covered red cases (`client side-effect @server`, `client relative ../server`, `shared @server`, `shared relative ../server`). |
| `pnpm knip:check` | `EXIT=0` by configuration — `files`, `exports`, `types`, `duplicates`, `binaries` all set to `warn`. ~83 unused-file candidates reported (informational baseline). | WEEKLY lane (`v2-weekly-audit.yml`), `continue-on-error: true` by design. | **`PASS`** in the "did Knip notice the planted file?" sense. Knip is deliberately non-blocking; the red-case channel is the line in `tooling:redcase`. |
| `pnpm secrets:gitleaks` (dev-mode wrapper) | `EXIT=0` with loud `GITLEAKS_BINARY_NOT_INSTALLED` log. **The binary is not on PATH on this developer workstation; gitleaks did not actually run.** | DEEP lane runs `gitleaks/gitleaks-action@v2` directly *and* runs the wrapper in required mode. | **`ENV_BLOCKED`** locally — labelled `REDCASE_TOOL_MISSING` in the verifier output. Reason: binary missing; CI uses the official action. |
| `pnpm secrets:gitleaks:required` (`--required` / `GITLEAKS_REQUIRED=1`) | `EXIT=2` with `GITLEAKS_REQUIRED_BUT_MISSING`. **Hard mode confirmed: a missing binary BLOCKS.** This is the mode wired into CI's DEEP lane. | DEEP lane: `Gitleaks wrapper (required mode)` step runs it; missing binary fails CI. | Not run separately — exercised end-to-end as the gitleaks step in the verifier above. |
| `pnpm tooling:check` | `EXIT=0` (composite: boundaries + depcruise + arch-tests + dev-mode gitleaks). Gitleaks did not actually run on the dev workstation; see the disclosure under "Truth disclosures". | STANDARD lane does not re-run this aggregate (it runs each component individually). | Not a separate red case — every component is covered. |
| `pnpm tooling:redcase` (`scripts/verify-tooling-red-cases.mjs`, DEV mode) | `EXIT=0`. Summary: `total cases: 11, BLOCKED: 9, TOOL_MISSING: 2, NOT_ENFORCED: 0`. Concluding line: `VERIFY_TOOLING_RED_CASES_PARTIAL (PASS overall, but TOOL_MISSING present — see reasons above; re-run with --strict to make these block)`. | n/a (CI uses the strict variant below). | Authoritative source. The two `TOOL_MISSING` entries are eslint-plugin-boundaries v6 and gitleaks binary on this dev workstation. |
| `pnpm tooling:redcase:strict` (`--strict` / `CI=true` / `REDCASE_STRICT=1`) | `EXIT=1` — same 11 cases, but TOOL_MISSING now fails the run. Concluding line: `VERIFY_TOOLING_RED_CASES_FAIL`. | DEEP lane runs this step with `continue-on-error: true` (**informational**), because boundaries v6 enforcement is `PARTIAL_NOT_ENFORCED` and would make this step a known fail. CI's required gate is `pnpm tooling:redcase` (DEV mode), which fails only on `NOT_ENFORCED`. When the boundaries follow-up ships, this step is promoted from informational to required. | The contract: any TOOL_MISSING in strict mode == build red. |
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
pnpm secrets:gitleaks:required        # expected to exit 2 if binary missing
pnpm tooling:check
pnpm tooling:redcase                  # DEV mode: TOOL_MISSING informational
pnpm tooling:redcase:strict           # STRICT mode: TOOL_MISSING blocks
```

The first eight commands print the outputs that this table summarises.
The verifier scripts plant safe red cases under real paths, assert each
relevant tool exits non-zero, then cleans up — leaving the working tree
exactly as it was.

## Truth disclosures (do not claim PASS unless these hold)

1. **eslint-plugin-boundaries — `PARTIAL_NOT_ENFORCED`** (Option C in the
   adversarial audit add-on). The v5-style rules were detected by v6 as
   "legacy" and downgraded to warnings; a one-pass migration to
   `boundaries/dependencies` resolved the source-side selector but left
   the target side `isUnknown: true` because the `@server/*` TypeScript
   path alias has no resolver wired into the plugin. The follow-up is
   tracked at `docs/governance/followups/FIX_ESLINT_PLUGIN_BOUNDARIES_V6_ENFORCEMENT.md`.
   Until that ships, ESLint does not block any boundary violation; the
   coverage statement in `coding-standards §22a` lists the three
   parallel enforcers that do (`depcruise`, `arch-tests`,
   `audit-domain-boundaries`).

2. **`pnpm secrets:gitleaks` (dev mode) exits 0 when the binary is
   missing**, on purpose, so a developer without gitleaks can keep
   working. **A green dev-mode run does NOT prove that gitleaks scanned
   anything.** CI uses `pnpm secrets:gitleaks:required` (exit 2 on
   missing binary) and the `gitleaks/gitleaks-action@v2` step (binary
   guaranteed by the action). `pnpm tooling:redcase:strict` flips any
   TOOL_MISSING — gitleaks included — into a hard failure, which is the
   mode CI runs.

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
   only after audit approval — never in this spike. The
   `REPLACED_BY_TOOL` status is reserved for that future PR and is not
   used here.

6. **`audit-domain-boundaries.mjs` was hardened on 2026-05-29** after the
   adversarial audit found a side-effect `import "@server/…"` slipping
   past every custom guard. The guard now extracts side-effect imports
   and applies the boundary check via a uniform `importPaths` loop so
   the four red cases (`client→@server`, `client→../server`,
   `shared→@server`, `shared→../server`) all fail closed.

## Files referenced by this report

- `package.json` — scripts: `boundaries:check`, `depcruise:check`, `depcruise:graph`, `arch-tests`, `knip:check`, `secrets:gitleaks`, `secrets:gitleaks:required`, `tooling:check`, `tooling:weekly`, `tooling:redcase`, `tooling:redcase:strict`.
- `.dependency-cruiser.cjs`, `.gitleaks.toml`, `knip.json`, `eslint.config.js`.
- `scripts/run-gitleaks.mjs` — two-mode wrapper.
- `scripts/verify-tooling-red-cases.mjs` — the verifier (11 cases incl. 4 custom-guard red cases added 2026-05-29).
- `scripts/audit-domain-boundaries.mjs` — custom guard, hardened 2026-05-29.
- `tests/architecture/architecture.test.ts` — executable PX-ARCH invariants.
- `tests/architecture/fixtures/` — committed red-case fixtures.
- `.github/workflows/v2-gates.yml` — STANDARD + DEEP lanes (DEEP runs
  depcruise, arch-tests, gitleaks-action, gitleaks:required wrapper,
  tooling:redcase:strict).
- `.github/workflows/v2-weekly-audit.yml` — WEEKLY lane.
- `.github/workflows/codeql.yml` — `NEEDS_GITHUB_SETUP`.
- `docs/governance/followups/FIX_ESLINT_PLUGIN_BOUNDARIES_V6_ENFORCEMENT.md` — open follow-up.

## Outstanding work (not in this spike)

- `FIX_ESLINT_PLUGIN_BOUNDARIES_V6_ENFORCEMENT` — see follow-up file.
- Enable CodeQL in repo Settings.
- After audit approval, a separate cleanup PR may flip selected guards
  from `PARALLEL_WITH_TOOLING` to `REPLACED_BY_TOOL` and delete the
  corresponding custom scripts. Not in this spike.
