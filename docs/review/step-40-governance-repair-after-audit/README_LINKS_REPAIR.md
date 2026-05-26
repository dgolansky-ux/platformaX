# README Links Repair

## Problem

1. 15 domain READMEs in `server/domains-v2/*/README.md` used wrong relative paths: `../../docs/governance/` instead of `../../../docs/governance/`.
2. 16 feature READMEs in `client/src/features-v2/*/README.md` had no canonical governance links.
3. `client/src/app-v2/README.md` had no canonical governance links.

## Fix

### Domain READMEs (15 files) — path corrected

All `server/domains-v2/*/README.md` governance link paths fixed from `../../` to `../../../`.

### Feature READMEs (16 files) — section added

Canonical governance section added to all `client/src/features-v2/*/README.md`.

### App Shell README (1 file) — section added

Canonical governance section added to `client/src/app-v2/README.md`.

Total: 32 README files updated.
