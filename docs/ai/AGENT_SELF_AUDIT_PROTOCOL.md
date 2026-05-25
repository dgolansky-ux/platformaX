# Agent Self-Audit Protocol

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

## Rationale

A public repository with automated governance requires the AI agent to demonstrate awareness of what it changed and what could go wrong. This is not a rubber stamp — it is a structured forcing function for careful, honest self-assessment.
