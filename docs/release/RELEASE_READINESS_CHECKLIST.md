# PlatformaX V2 — Release Readiness Checklist

Status: `ACTIVE_TEMPLATE`  
Owner: Release / Infrastructure

## 1. Release status labels

Allowed:

- `NOT_RELEASE_READY`
- `STAGING_READY`
- `BETA_READY`
- `PRODUCTION_READY`

`PRODUCTION_READY` is forbidden unless all required evidence exists.

## 2. Required for staging

- CI green,
- env variables reviewed,
- migrations reviewed,
- healthcheck works,
- no secrets in logs,
- rollback path known,
- release notes drafted.

## 3. Required for beta

- staging stable,
- visual/manual evidence where relevant,
- error tracking configured,
- basic accessibility checked,
- backup/restore plan,
- rate limits planned for public endpoints,
- known blockers documented.

## 4. Required for production

- staging proof,
- migration safety green,
- backup and rollback tested,
- monitoring active,
- security review,
- no fake status,
- owner approval.

## 5. Release decision

```txt
Release status:
Evidence:
Blocking issues:
Decision:
```
