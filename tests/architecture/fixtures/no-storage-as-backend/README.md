# Red-case fixture placeholder for check-no-storage-as-backend.mjs

The guard's red-case coverage is verified by:
- the guard's own scan against the live repo (PASS / ACK / VIOLATION counts in CI),
- `pnpm tooling:redcase` runner where applicable,
- direct CLI invocation: `node scripts/check-no-storage-as-backend.mjs` returns non-zero when a violation is planted.

This directory exists as the structural placeholder per `GUARDS_REGISTRY.yml` convention. Add bad-*.{ts,tsx,md,js,mjs} files here to extend automated red-case coverage when the guard's narrow scope is widened.

