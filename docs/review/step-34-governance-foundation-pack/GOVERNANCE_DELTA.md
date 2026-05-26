# STEP 34 — Governance Delta

## What Changed

### New Central Governance
- Created `docs/governance/` as canonical governance center
- 11 governance files provide machine-readable rule registry, guard registry, status taxonomy, domain status, AI permissions, and enforcement mapping

### Rule IDs
- 25 rules assigned stable IDs (PX-GOV-*, PX-ARCH-*, PX-STATUS-*, PX-SEC-*, PX-MEDIA-*, PX-LIST-*, PX-PROFILE-*, PX-INFRA-*, PX-AI-*)
- IDs are permanent and must not be reassigned

### Guard Coverage
- 5 new guard scripts validate governance registry integrity
- 37 total guards (32 existing + 5 new)
- All P0 rules have automated or manual enforcement

### Old Docs Preserved
- No docs deleted
- Historical docs in docs/architecture/, docs/ai/, docs/security/, docs/profile/ annotated with governance index pointers
- Old docs remain the source of detailed rule content
- Governance indexes and cross-references them

### CODEOWNERS Expanded
- Added coverage for docs/governance/, docs/ai/, docs/security/, docs/profile/, docs/templates/, .husky/, .claude/, supabase/migrations/, domain public-api.ts and README.md files

## What Did NOT Change

- No UI, runtime, or product code
- No CI workflow files
- No build configuration
- No domain productive code
- No dependencies added or removed
- No legacy code touched
- No Railway or Supabase changes
- No env changes
