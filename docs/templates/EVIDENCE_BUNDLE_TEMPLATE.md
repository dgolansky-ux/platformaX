# Evidence Bundle Template

Status: `TEMPLATE`

## Required bundle files

```txt
report.md
changed-files.txt
deleted-files.txt
architecture-impact.md
domain-status-impact.md
gates-summary.md
raw-logs/
manifest.md
sha256.txt
blocked-items.md
```

## Required manifest checks

- file count:
- no node_modules:
- no dist/build:
- no .env:
- no real secrets:
- no nested ZIP:
- no raw backslash paths:
- logs included:
- report included:
- SHA256 included:

## Required report sections

1. Baseline
2. Scope
3. Changed files
4. Architecture impact
5. Status changes
6. Gates run
7. Failures/blockers
8. PRE-COMMIT DECISION
9. Final status

## Forbidden

- ZIP inside ZIP unless explicitly approved,
- missing logs,
- normalized path validator hiding raw backslash,
- fake PASS,
- secrets in logs.
