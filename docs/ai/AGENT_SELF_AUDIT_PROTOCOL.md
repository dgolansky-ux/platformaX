# Agent Self-Audit Protocol

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Effective from: Step 17

## Purpose

Every major report (STEP_*_REPORT.md) from Step 17 onward must include a SELF-AUDIT / INDEPENDENT REVIEW PASS section. This forces the AI agent to explicitly evaluate the impact of its changes before committing, reducing the risk of undetected regressions, guard weakening, or boundary violations.

## Required section

Each qualifying report must contain:

```
## SELF-AUDIT / INDEPENDENT REVIEW PASS
```

## Required fields (12)

| # | Field | Purpose |
|---|---|---|
| 1 | What I changed | Summary of files modified/created |
| 2 | What I might have broken | Honest assessment of regression risk |
| 3 | Domain boundaries affected | Which V2 domains were touched |
| 4 | Cross-domain imports check | Verified no illegal cross-domain imports |
| 5 | Legacy/runtime check | Verified no V1/legacy runtime imports |
| 6 | Fake DONE/status truth check | No banned status strings introduced |
| 7 | PII/base64/secrets check | No PII in DTOs, no base64, no secrets |
| 8 | Routes/nav/build graph check | No forbidden routes or nav changes |
| 9 | Guard weakening check | No guards removed, weakened, or bypassed |
| 10 | Evidence reviewed | Which evidence files were verified |
| 11 | Gates run | Full list of gates executed and their results |
| 12 | Remaining risks | Known risks or items requiring human review |

## Exemptions

- Reports for steps before Step 17 are exempt
- Reports containing `HISTORICAL_REPORT_NO_SELF_AUDIT` marker are exempt

## Enforcement

- `scripts/check-self-audit-evidence.mjs` validates compliance
- Integrated into `rules:check`, `guards:all-local`, and CI workflow
- Violation blocks commit and merge

## Second-pass reviewer mindset

The self-audit is not a formality. The agent must switch mental mode from "implementer" to "independent reviewer" and actively look for:

1. **Own mistakes** — typos, wrong file paths, incorrect imports, missing exports.
2. **Logic contradictions** — report says "no domains touched" but code modifies domain files.
3. **Domain boundary leaks** — internal types imported from another domain.
4. **Fake DONE signals** — status set to DONE/COMPLETE/PASS without evidence.
5. **Guard weakening** — allowlist expanded, regex loosened, threshold raised.
6. **PII exposure** — user data in public DTOs, logs, or error messages.
7. **Secret leaks** — API keys, connection strings, tokens in committed files.
8. **Base64/dataUrl payloads** — inline media that should use presigned URLs.
9. **Removed routes** — features silently removed from navigation or build graph.
10. **Missing evidence** — claims of "all tests pass" without actual test output.

If the agent finds any issue during self-audit, it must either fix it before commit or change the status to BLOCKED with a clear description of the problem.

## Rationale

A public repository with automated governance requires the AI agent to demonstrate awareness of what it changed and what could go wrong. This is not a rubber stamp — it is a structured forcing function for careful, honest self-assessment.
