# Step 17a — Self-Audit Protocol Matrix

## Enforcement status

| Component | Status | File |
|---|---|---|
| Protocol definition | ACTIVE | `docs/ai/AGENT_SELF_AUDIT_PROTOCOL.md` |
| Guard script | ACTIVE | `scripts/check-self-audit-evidence.mjs` |
| Unit tests (7) | PASS | `scripts/__tests__/self-audit-evidence.test.ts` |
| rules:check integration | CONNECTED | `scripts/rules-check.mjs` — included in 21 guards |
| guards:all-local integration | CONNECTED | `package.json` — included in all-local chain |
| CI workflow integration | CONNECTED | `.github/workflows/v2-gates.yml` — "Review reports & self-audit" step |
| Coding standards reference | ADDED | `docs/architecture/PlatformaX-V2-coding-standards.md` § 13 |
| Operating standard reference | ADDED | `docs/ai/AGENT_OPERATING_STANDARD.md` § 8 |
| Forbidden actions reference | ADDED | `docs/ai/AI_FORBIDDEN_ACTIONS.md` § 3 |
| Pre-commit template reference | ADDED | `docs/templates/PRE_COMMIT_DECISION.md` — bottom section |

## Required fields (12)

| # | Field | Enforced by guard |
|---|---|---|
| 1 | What I changed | YES |
| 2 | What I might have broken | YES |
| 3 | Domain boundaries affected | YES |
| 4 | Cross-domain imports check | YES |
| 5 | Legacy/runtime check | YES |
| 6 | Fake DONE/status truth check | YES |
| 7 | PII/base64/secrets check | YES |
| 8 | Routes/nav/build graph check | YES |
| 9 | Guard weakening check | YES |
| 10 | Evidence reviewed | YES |
| 11 | Gates run | YES |
| 12 | Remaining risks | YES |

## Second-pass reviewer mindset (10 checks)

| # | Check | Documented in |
|---|---|---|
| 1 | Own mistakes | AGENT_SELF_AUDIT_PROTOCOL.md |
| 2 | Logic contradictions | AGENT_SELF_AUDIT_PROTOCOL.md |
| 3 | Domain boundary leaks | AGENT_SELF_AUDIT_PROTOCOL.md |
| 4 | Fake DONE signals | AGENT_SELF_AUDIT_PROTOCOL.md |
| 5 | Guard weakening | AGENT_SELF_AUDIT_PROTOCOL.md |
| 6 | PII exposure | AGENT_SELF_AUDIT_PROTOCOL.md |
| 7 | Secret leaks | AGENT_SELF_AUDIT_PROTOCOL.md |
| 8 | Base64/dataUrl payloads | AGENT_SELF_AUDIT_PROTOCOL.md |
| 9 | Removed routes | AGENT_SELF_AUDIT_PROTOCOL.md |
| 10 | Missing evidence | AGENT_SELF_AUDIT_PROTOCOL.md |
