# Step 35 — AI Agent Permissions Review

## `.claude/settings.local.json` Before (dangerous entries)

```
"Bash(git push *)"        → covers git push --force, git push origin main
"Bash(git commit *)"      → covers git commit --no-verify
"Bash(git reset *)"       → covers git reset --hard
"Bash(git merge *)"       → covers git merge main
"Bash(gh pr *)"           → covers gh pr merge
"Bash(pnpm add *)"        → unrestricted dependency additions
"Bash(rm client/...)"     → specific rm, but rm command in allow
```

## `.claude/settings.local.json` After

### Allow list changes

| Removed | Replaced with |
|---|---|
| `Bash(git push *)` | `Bash(git push -u origin HEAD)`, `Bash(git push origin HEAD)` |
| `Bash(git commit *)` | `Bash(git commit -m *)` |
| `Bash(git reset *)` | (removed — no safe wildcard exists) |
| `Bash(git merge *)` | (removed — no safe wildcard exists) |
| `Bash(gh pr *)` | `Bash(gh pr create *)`, `Bash(gh pr list *)`, `Bash(gh pr view *)`, `Bash(gh pr status *)` |
| `Bash(pnpm add *)` | (removed — requires separate decision per policy) |
| `Bash(rm client/...)` | (removed — specific rm on allow list is risky) |
| Various grep/awk/echo entries | Consolidated to `Bash(grep -rn *)`, `Bash(echo *)` |

### Added deny list

```json
"deny": [
  "Bash(git push --force *)",
  "Bash(git push -f *)",
  "Bash(git push origin main *)",
  "Bash(git commit --no-verify *)",
  "Bash(git reset --hard *)",
  "Bash(gh pr merge *)",
  "Bash(rm -rf *)",
  "Bash(supabase db push *)",
  "Bash(railway *)"
]
```

## Guard Hardening

### `check-ai-agent-permissions.mjs`

**Before:** Wildcard-covered dangerous patterns → WARNING (pass with warning)
**After:** Wildcard-covered dangerous patterns → VIOLATION (exit 1)

This ensures the guard catches any future settings.local.json regression.

## Compliance Check

| Forbidden command | Covered by deny? | Covered by guard? | In allow list? |
|---|---|---|---|
| `git push --force` | YES | YES | NO |
| `git commit --no-verify` | YES | YES | NO |
| `git reset --hard` | YES | YES | NO |
| `gh pr merge` | YES | YES | NO |
| `supabase db push` | YES | YES | NO |
| `railway` | YES | YES | NO |
| `rm -rf` | YES | YES | NO |
| `pnpm add` | Not denied but removed from allow | — | NO |
