// PX-MEDIA-004 / PX-DTO-001 — owner upload intent must be classified as
// owner-only and never appear on a public read response.
//
// Rules:
//   1. The DTO type that carries `uploadUrl` / `storageKey` / `maxBytes` must
//      be named `OwnerUploadIntentDTO` OR must carry the marker comment
//      `OWNER_ONLY_UPLOAD_INTENT` in `server/domains-v2/media/dto.ts`.
//   2. The media service's public read (`getPublicMediaUrl`, any method that
//      returns `MediaAssetDTO` in `public-api`) must NOT reference
//      `OwnerUploadIntentDTO` in its return type.
//   3. The public-api MAY export `OwnerUploadIntentDTO` (it's needed for the
//      owner upload command) but the legacy name `UploadIntentDTO`, if still
//      exported, must be a deprecated alias of `OwnerUploadIntentDTO`.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = process.cwd();

const MEDIA_DTO = join(ROOT, "server/domains-v2/media/dto.ts");
const MEDIA_SERVICE = join(ROOT, "server/domains-v2/media/service.ts");
const MEDIA_PUBLIC_API = join(ROOT, "server/domains-v2/media/public-api.ts");

function main() {
  const violations = [];

  if (!existsSync(MEDIA_DTO)) {
    violations.push("server/domains-v2/media/dto.ts is missing");
  } else {
    const src = readFileSync(MEDIA_DTO, "utf-8");
    const hasOwnerTypeName = /export\s+type\s+OwnerUploadIntentDTO\b/.test(src);
    const hasMarker = /OWNER_ONLY_UPLOAD_INTENT/.test(src);
    if (!hasOwnerTypeName && !hasMarker) {
      violations.push(
        "media/dto.ts: owner upload instruction is not classified — either export type OwnerUploadIntentDTO or include the OWNER_ONLY_UPLOAD_INTENT marker",
      );
    }
    // The owner-only fields must NOT appear on PUBLIC_SAFE classes. If the
    // legacy `UploadIntentDTO` survives, it must alias the owner type.
    const legacyAlias = /UploadIntentDTO\s*=\s*OwnerUploadIntentDTO/.test(src);
    const legacyType = /export\s+type\s+UploadIntentDTO\s*=\s*\{/.test(src);
    if (legacyType && !legacyAlias) {
      violations.push(
        "media/dto.ts: `UploadIntentDTO` exists as its own owner-shape type. It must be removed or declared as `export type UploadIntentDTO = OwnerUploadIntentDTO`.",
      );
    }
  }

  if (existsSync(MEDIA_SERVICE)) {
    const src = readFileSync(MEDIA_SERVICE, "utf-8");
    // getPublicMediaUrl must not promise an OwnerUploadIntentDTO.
    const m = src.match(
      /getPublicMediaUrl\s*\([^)]*\)\s*:\s*Promise<\s*MediaResult<\s*([\w]+)\s*>/,
    );
    if (m && m[1] !== "MediaAssetDTO") {
      violations.push(
        `media/service.ts: getPublicMediaUrl returns "MediaResult<${m[1]}>" — public read must return MediaAssetDTO, not the owner upload intent`,
      );
    }
  }

  if (existsSync(MEDIA_PUBLIC_API)) {
    const src = readFileSync(MEDIA_PUBLIC_API, "utf-8");
    if (
      /UploadIntentDTO/.test(src) &&
      !/OwnerUploadIntentDTO/.test(src)
    ) {
      violations.push(
        "media/public-api.ts: exports UploadIntentDTO but not OwnerUploadIntentDTO — the owner-only type must be the canonical export",
      );
    }
  }

  if (violations.length > 0) {
    for (const v of violations) console.error(`OWNER_UPLOAD_INTENT_VIOLATION: ${v}`);
    console.error(`\ncheck-owner-upload-intent-classification: ${violations.length} violation(s)`);
    process.exit(1);
  }
  console.log("CHECK_OWNER_UPLOAD_INTENT_CLASSIFICATION_PASS");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
