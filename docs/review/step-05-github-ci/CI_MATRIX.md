# Step 05 — CI Matrix

## Workflow: V2 Governance Gates

| # | Step | Command | Required |
|---|---|---|---|
| 1 | Checkout | `actions/checkout@v4` | yes |
| 2 | Setup Node | `actions/setup-node@v4` (node 22) | yes |
| 3 | Setup pnpm | `pnpm/action-setup@v4` (pnpm 9) | yes |
| 4 | Install | `pnpm install --frozen-lockfile` | yes |
| 5 | Type check | `pnpm check` | yes |
| 6 | Lint | `pnpm lint` | yes |
| 7 | Test | `pnpm test` | yes |
| 8 | Build | `pnpm build` | yes |
| 9 | Rules check | `pnpm rules:check` (14 guards) | yes |
| 10 | Arch check | `pnpm arch:check:v2` (6 guards) | yes |
| 11 | Bundle smoke | `pnpm guards:bundle` | yes |

## Triggers

| Event | Branch | Effect |
|---|---|---|
| `push` | `main` | Full gate suite |
| `pull_request` | `main` | Full gate suite |
