// RED-CASE FIXTURE — excluded from every active gate.
// See tests/architecture/fixtures/README.md for proof commands.
//
// A server domain reaching into another domain's internal/ folder MUST be
// flagged by:
//   - eslint-plugin-boundaries (boundaries/entry-point)
//   - dependency-cruiser (no-cross-domain-internal)
//   - tests/architecture/architecture.test.ts
//     (server domains never reach another domain's internal modules)
//
// @ts-nocheck — fixture, not part of the build.
import type { MediaRecord } from "../../../server/domains-v2/media/internal/record";

export type LeakedRecord = MediaRecord;
