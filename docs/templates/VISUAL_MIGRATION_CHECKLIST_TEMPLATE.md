# Visual Migration Checklist — [Domain / Feature Name]

## Source

- Legacy component/page: `[path]`
- V2 target: `[path]`

## Migration status

| Step | Status | Evidence |
|---|---|---|
| Legacy UI identified | | |
| V2 shell created | | |
| Layout/structure migrated | | |
| Styling migrated (no legacy CSS) | | |
| Local state typed | | |
| Props/contracts defined | | |
| Accessibility audit | | |
| Responsive behavior verified | | |
| No legacy imports in V2 | | |
| No removed product areas | | |
| No base64/dataUrl usage | | |
| Tests written | | |
| Screenshot evidence | | |
| Guard gates pass | | |

## Constraints

- Must not import from legacy `features/`, `pages/`, `components/`
- Must not introduce removed product areas
- Must not use base64 upload / readAsDataURL
- Must use presigned upload for media
- Must not claim VISUAL_DONE without evidence

## Sign-off

- [ ] Visual parity confirmed
- [ ] Guards pass: `pnpm rules:check`
- [ ] No legacy runtime introduced
- [ ] Evidence path: `docs/review/step-XX-.../`
