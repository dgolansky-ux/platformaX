# Step 36 — Rules Delta

## Rules Added (17)

| ID | Title | Severity | Category |
|---|---|---|---|
| PX-ARCH-008 | No circular domain dependencies | P0 | architecture |
| PX-ARCH-009 | Import graph must match domain ownership | P0 | architecture |
| PX-RUNTIME-001 | PARTIAL requires real runtime evidence | P0 | status-truth |
| PX-RUNTIME-002 | IMPLEMENTED requires full runtime evidence | P0 | status-truth |
| PX-DB-001 | No live db push without separate decision | P0 | infrastructure |
| PX-DB-002 | Migrations require safety review | P0 | infrastructure |
| PX-DB-003 | No destructive migration without approval | P0 | infrastructure |
| PX-DEPS-001 | No dependency changes without decision | P1 | governance |
| PX-ADR-001 | Architecture-impacting changes require ADR | P1 | governance |
| PX-OBS-001 | No unsafe console logging in runtime | P1 | security |
| PX-OBS-002 | No PII in logs/errors/audit output | P0 | security |
| PX-EXC-001 | Exceptions require full metadata | P1 | governance |
| PX-EXC-002 | Expired exceptions fail gates | P0 | governance |
| PX-DTO-001 | Public DTO privacy classification | P1 | security |
| PX-SCALE-001 | No sync fanout in request path | P0 | scalability |
| PX-SCALE-002 | No unbounded hot-path loops | P0 | scalability |
| PX-SCALE-003 | No full scans for runtime lists | P0 | scalability |

## Rules Removed

None.

## Rules Modified

None.

## Rules Weakened

None.

## Summary

- Before: 25 rules
- After: 42 rules
- Delta: +17 rules, 0 removed, 0 weakened
- New P0 rules: 12
- New P1 rules: 5
