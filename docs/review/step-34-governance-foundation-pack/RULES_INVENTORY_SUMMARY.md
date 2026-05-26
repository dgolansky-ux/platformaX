# STEP 34 — Rules Inventory Summary

## All Rules with IDs

| ID | Title | Severity | Category | Automated? |
|---|---|---|---|---|
| PX-GOV-001 | No fake DONE | P0 | governance | YES |
| PX-GOV-002 | No weakened guards | P0 | governance | PARTIAL (manual + script-safety) |
| PX-GOV-003 | No --no-verify | P0 | governance | YES |
| PX-GOV-004 | No direct push to main | P0 | governance | YES (branch protection + agent check) |
| PX-ARCH-001 | V2-first — no legacy runtime | P0 | architecture | YES |
| PX-ARCH-002 | Legacy is source material only | P0 | architecture | YES |
| PX-ARCH-003 | Cross-domain via public-api only | P0 | architecture | YES |
| PX-ARCH-004 | No domain internals imports | P0 | architecture | YES |
| PX-ARCH-005 | Domain ownership source of truth | P1 | architecture | PARTIAL |
| PX-ARCH-006 | app-v2 composition layer | P1 | architecture | YES |
| PX-ARCH-007 | features-v2 isolation | P1 | architecture | YES |
| PX-STATUS-001 | Status truth required | P0 | status-truth | YES |
| PX-STATUS-002 | No VISUAL_DONE without evidence | P0 | status-truth | PARTIAL (manual gate) |
| PX-STATUS-003 | No BACKEND_DONE without evidence | P0 | status-truth | PARTIAL (manual gate) |
| PX-SEC-001 | No public PII | P0 | security | YES |
| PX-SEC-002 | No secrets in repo/logs/ZIP | P0 | security | YES |
| PX-MEDIA-001 | No base64 runtime uploads | P0 | media | YES |
| PX-LIST-001 | Lists require limit/cursor | P0 | scalability | YES |
| PX-PROFILE-001 | Profile visual parity 1:1 | P1 | profile | MANUAL |
| PX-PROFILE-002 | Professional is identity layer | P1 | profile | MANUAL |
| PX-INFRA-001 | No Railway without decision | P0 | infrastructure | YES |
| PX-INFRA-002 | No live db push without decision | P0 | infrastructure | YES |
| PX-AI-001 | Agent reads governance first | P0 | ai-agent | MANUAL |
| PX-AI-002 | Agent self-audit before DONE | P0 | ai-agent | YES |
| PX-AI-003 | Agent BLOCKED when rules conflict | P0 | ai-agent | MANUAL |

## Statistics

- **Total rules:** 25
- **P0:** 17
- **P1:** 6
- **P2:** 2
- **Fully automated:** 16
- **Partial (automated + manual):** 5
- **Manual only:** 4

## Sources Inventory

| Source Document | Rules Count |
|---|---|
| PlatformaX-V2-active-rules.md | 12 |
| PlatformaX-V2-coding-standards.md | 6 |
| PlatformaX-V2-architecture-enforcement.md | 5 |
| PlatformaX-V2-domain-status.md | 3 |
| PlatformaX-V2-legacy-containment.md | 2 |
| AI_FORBIDDEN_ACTIONS.md | 4 |
| AGENT_OPERATING_STANDARD.md | 2 |
| AGENT_SELF_AUDIT_PROTOCOL.md | 1 |
| SECRET_HANDLING_POLICY.md | 2 |
| PROFILE_BLUEPRINT_MOBILE_FIRST.md | 2 |
| PROFILE_RUNTIME_LOGIC_BLUEPRINT_FROM_LEGACY.md | 1 |

Note: Many rules appear in multiple source documents.
