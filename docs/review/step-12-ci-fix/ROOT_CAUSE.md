# CI Fix — Root Cause Analysis

## Error

```
pnpm install --frozen-lockfile
ERROR packages field missing or empty
```

## Root cause

`pnpm-workspace.yaml` existed but had **no `packages` field**:

```yaml
allowBuilds:
  esbuild: true
```

When pnpm detects a `pnpm-workspace.yaml`, it treats the project as a workspace monorepo and **requires** a `packages` field listing workspace members. Since the field was absent, `pnpm install --frozen-lockfile` failed on GitHub Actions.

Locally this was masked because `pnpm install` (without `--frozen-lockfile`) is more lenient, and the local `node_modules` was already populated.

## Secondary issue

The workflow specified `pnpm version: 9`, but local development uses pnpm v11.2.2. This version mismatch could cause lockfile incompatibilities.

## Fix

1. Added `packages: ["."]` to `pnpm-workspace.yaml` — tells pnpm the root directory is the sole workspace package.
2. Updated `.github/workflows/v2-gates.yml` pnpm version from `9` to `11` — aligns CI with local development.
