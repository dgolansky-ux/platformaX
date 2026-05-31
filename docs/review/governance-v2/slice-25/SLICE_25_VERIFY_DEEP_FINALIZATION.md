# Slice 25 — `verify:deep` finalization

## 1. Acceptance command

`pnpm verify:deep` is the **single** acceptance command in PlatformaX V2.
Its definition in `package.json` after Slice 25 is unchanged from Slice 24
because the Slice 24 wiring already covered every required gate:

```
verify:deep =
  pnpm check            # tsc --noEmit
  pnpm lint             # eslint --max-warnings=0 (loaded boundaries plugin; v6 PARTIAL_NOT_ENFORCED — EXC-017)
  pnpm test             # vitest run
  pnpm build            # vite build
  pnpm rules:check      # 65 rule guards (Slice 25 added 10 P1 — see below)
  pnpm arch:check:v2    # 17 architecture guards
  pnpm guards:all-local # 17 local guards
  pnpm depcruise:check  # cycles + cross-domain + shared + legacy + relative
  pnpm arch-tests       # vitest tests/architecture
  pnpm knip:check       # unused files / exports (informational lane, no orphan failures)
  pnpm secrets:gitleaks # detect-secrets full repo scan
  pnpm tooling:redcase  # 10 BLOCKED + 1 TOOL_MISSING (EXC-017) in DEV mode
```

## 2. Helper-only commands

`pnpm verify:fast` and `pnpm verify:normal` print a leading banner:

```
HELPER_ONLY / NOT_ACCEPTANCE_GATE — use pnpm verify:deep for acceptance.
```

They run a subset (`check && lint` for fast; `check && lint && test` for
normal). They **cannot** grant `READY` / `IMPLEMENTED` / `BACKEND_DONE` /
`VISUAL_DONE` / `TOP_TIER_READY` per `STATUS_TAXONOMY.md §Deep-only
acceptance`.

## 3. `tooling:redcase` finalization

`tooling:redcase` runs locally as part of `verify:deep`. Slice 25
confirmed it executes 11 red cases in DEV mode:

- 10 BLOCKED (depcruise + arch-tests + custom guards stopped the violation),
- 1 TOOL_MISSING (`eslint-plugin-boundaries / client-app-v2 -> server-domain` — the v6 selector schema downgrades to a warning; EXC-017 carries this with compensating coverage).

`VERIFY_TOOLING_RED_CASES_PARTIAL (PASS overall)` is the documented
DEV-mode exit. `--strict` makes TOOL_MISSING fail; CI deep lane runs the
non-strict variant per the Slice 24 decision (EXC-017 expiry 2026-08-31).

## 4. Status taxonomy / docs alignment

`docs/governance/STATUS_TAXONOMY.md`, `docs/governance/AGENT_COMMAND_STANDARD.md`,
`docs/architecture/BRAMKA.md`, `docs/architecture/PlatformaX-V2-coding-standards.md`,
and `docs/governance/GOVERNANCE_INDEX.md` all pin `verify:deep` as the only
path to runtime / READY claims. Read-back at Slice 25 confirmed each
file still carries this language verbatim — no rewriting of historical
report text occurred during Slice 25 (see `AGENT_COMMAND_STANDARD.md §15`).

## 5. Local vs CI

The local `pnpm verify:deep` is sufficient for the agent's acceptance.
CI runs the same script plus `pnpm secrets:gitleaks:required` (the
required variant), branch protection, and CodeQL when applicable. Local
acceptance is documented as `LOCAL_DEEP_PASS_WITH_CI_PARITY` —
informational tagging in `STATUS_TAXONOMY.md`.

## 6. Slice 25 changes to the gate

- `scripts/rules-check.mjs` grew from 55 to 65 entries (the 10 new
  Slice 25 P1 guards).
- No new dependency added.
- No gate weakened.
- No script removed.

Status of this file: **GATE_CONTRACT_PINNED**.
