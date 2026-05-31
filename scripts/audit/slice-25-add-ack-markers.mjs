#!/usr/bin/env node
/**
 * scripts/audit/slice-25-add-ack-markers.mjs
 *
 * One-shot helper used at the start of Slice 25 to add per-file
 * PX-RULE-ACK markers for the new P1 guards (PX-OBS-003, PX-CTX-001,
 * PX-ERROR-001) to existing pre-runtime files. Idempotent — re-running
 * is a no-op when the marker already exists.
 *
 * Not wired into rules-check / verify:deep. Kept in scripts/audit/
 * for traceability.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const TASKS = [
  // PX-OBS-003: use-case service files lacking correlationId token
  {
    rule: "PX-OBS-003-ACK",
    reason: "pre-runtime use-case; request-context tracing wiring scheduled with RequestContext slice. EXC-016.",
    files: [
      "server/application-v2/use-cases/channel-content/service.ts",
      "server/application-v2/use-cases/channel-interactions/service.ts",
      "server/application-v2/use-cases/channels/service.ts",
      "server/application-v2/use-cases/communities/service.ts",
      "server/application-v2/use-cases/community-feeds/service.ts",
      "server/application-v2/use-cases/community-interactions/service.ts",
      "server/application-v2/use-cases/contacts/service.ts",
      "server/application-v2/use-cases/feed/service.ts",
      "server/application-v2/use-cases/friend-feed/service.ts",
      "server/application-v2/use-cases/manage/service.ts",
      "server/application-v2/use-cases/media/service.ts",
      "server/application-v2/use-cases/moderation/service.ts",
      "server/application-v2/use-cases/personal-profile-view/service.ts",
      "server/application-v2/use-cases/profile/service.ts",
      "server/application-v2/use-cases/public-hub/service.ts",
      "server/application-v2/use-cases/publishing/service.ts",
      "server/application-v2/use-cases/social/service.ts",
      "server/application-v2/use-cases/workplace-feed/service.ts",
    ],
  },
  // PX-CTX-001: content-v2 contracts / dto files lacking contextType token
  {
    rule: "PX-CTX-001-ACK",
    reason: "pre-runtime content/feed DTO; explicit owner/ref context fields scheduled with content read-model slice. EXC-016.",
    files: [
      "server/domains-v2/content-v2/channel-comments/contracts.ts",
      "server/domains-v2/content-v2/channel-comments/dto.ts",
      "server/domains-v2/content-v2/channel-posts/contracts.ts",
      "server/domains-v2/content-v2/channel-posts/dto.ts",
      "server/domains-v2/content-v2/channel-reactions/contracts.ts",
      "server/domains-v2/content-v2/channel-reactions/dto.ts",
      "server/domains-v2/content-v2/comments/contracts.ts",
      "server/domains-v2/content-v2/comments/dto.ts",
      "server/domains-v2/content-v2/community-feeds/dto.ts",
      "server/domains-v2/content-v2/contracts.ts",
      "server/domains-v2/content-v2/feeds/contracts.ts",
      "server/domains-v2/content-v2/feeds/dto.ts",
      "server/domains-v2/content-v2/friend-posts/contracts.ts",
      "server/domains-v2/content-v2/friend-posts/dto.ts",
      "server/domains-v2/content-v2/posts/contracts.ts",
      "server/domains-v2/content-v2/posts/dto.ts",
      "server/domains-v2/content-v2/publisher/contracts.ts",
      "server/domains-v2/content-v2/publisher/dto.ts",
      "server/domains-v2/content-v2/reactions/contracts.ts",
      "server/domains-v2/content-v2/reactions/dto.ts",
      "server/domains-v2/content-v2/read-models/contracts.ts",
      "server/domains-v2/content-v2/read-models/dto.ts",
      "server/domains-v2/content-v2/topics/contracts.ts",
      "server/domains-v2/content-v2/topics/dto.ts",
      "server/domains-v2/content-v2/workplace-posts/contracts.ts",
      "server/domains-v2/content-v2/workplace-posts/dto.ts",
      "server/domains-v2/content-v2/workplace-teasers/contracts.ts",
      "server/domains-v2/content-v2/workplace-teasers/dto.ts",
    ],
  },
  // PX-ERROR-001: domain boundaries throwing raw Error
  {
    rule: "PX-ERROR-001-ACK",
    reason: "pre-runtime media boundary still throws raw Error for invariant violations; Result/DomainError migration scheduled with media transport slice. EXC-016.",
    files: [
      "server/domains-v2/media/service.ts",
    ],
  },
];

let written = 0;
let skipped = 0;

for (const { rule, reason, files } of TASKS) {
  for (const rel of files) {
    const file = join(ROOT, rel);
    const content = readFileSync(file, "utf-8");
    if (content.includes(rule)) { skipped += 1; continue; }
    // Insert the new marker into the existing Slice 24 banner if present,
    // otherwise prepend a fresh Slice 25 banner.
    let updated;
    const sliceBanner = "// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================";
    if (content.includes(sliceBanner)) {
      const insertAfter = `${sliceBanner}\n`;
      updated = content.replace(
        insertAfter,
        `${insertAfter}// ${rule}: ${reason}\n`,
      );
    } else {
      const banner = [
        "// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================",
        `// ${rule}: ${reason}`,
        "// === end Slice 25 ACK markers =======================================",
        "",
      ].join("\n");
      updated = banner + "\n" + content;
    }
    writeFileSync(file, updated, "utf-8");
    written += 1;
  }
}

console.log(`slice-25-add-ack-markers: wrote ${written} file(s), skipped ${skipped} (already ACKed).`);
