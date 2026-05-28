// RED-CASE FIXTURE — excluded from every active gate.
// See tests/architecture/fixtures/README.md for the proof commands.
//
// Importing server runtime from frontend code MUST be flagged by:
//   - eslint-plugin-boundaries (boundaries/element-types)
//   - dependency-cruiser (no-client-to-server)
//   - tests/architecture/architecture.test.ts (client/* never imports server/*)
//
// Path uses a non-existent module so removing the ignore does NOT compile —
// the linters still parse and flag the import shape before resolution.
//
// @ts-nocheck — fixture, not part of the build.
import { createIdentityService } from "../../../server/domains-v2/identity/public-api";

export function badClientToServer() {
  // This call is intentional — proves the import is used, so tree-shaking
  // does not silently drop the violation before tools see it.
  return createIdentityService;
}
