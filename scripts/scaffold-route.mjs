import { writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const routePath = process.argv[2];
const domainName = process.argv[3];

if (!routePath || !domainName) {
  console.error("Usage: node scripts/scaffold-route.mjs <route-path> <domain-name>");
  console.error("Example: node scripts/scaffold-route.mjs /communities communities-v2");
  process.exit(1);
}

const REMOVED_ROUTES = [
  "/seller", "/purchases", "/marketplace", "/calendar",
  "/notes", "/habits", "/tasks", "/pages", "/pasje",
  "/passions", "/fundraiser", "/donations", "/commerce", "/productivity",
];

if (REMOVED_ROUTES.includes(routePath)) {
  console.error(`BLOCKED: Route "${routePath}" is a removed product area.`);
  process.exit(1);
}

const KNOWN_DOMAINS = [
  "identity", "social", "communities-v2", "content-v2",
  "channels", "chat", "events", "modules", "public-hub",
  "notifications", "media", "search", "moderation", "audit", "system",
];

if (!KNOWN_DOMAINS.includes(domainName)) {
  console.error(`BLOCKED: Domain "${domainName}" is not in the registry.`);
  console.error("Known domains: " + KNOWN_DOMAINS.join(", "));
  process.exit(1);
}

if (!routePath.startsWith("/")) {
  console.error(`Route path must start with /`);
  process.exit(1);
}

const routeMetaDir = join(ROOT, "client/src/app-v2");
const routeMetaFile = join(routeMetaDir, "ROUTE_REGISTRY.md");

const entry = `| \`${routePath}\` | ${domainName} | SCAFFOLD_ONLY | ${new Date().toISOString().split("T")[0]} |`;

if (existsSync(routeMetaFile)) {
  const content = readFileSync(routeMetaFile, "utf-8");
  if (content.includes(routePath)) {
    console.error(`Route "${routePath}" already registered.`);
    process.exit(1);
  }
  writeFileSync(routeMetaFile, content.trimEnd() + "\n" + entry + "\n");
} else {
  writeFileSync(routeMetaFile, `# Route Registry

| Route | Domain | Status | Added |
|---|---|---|---|
${entry}
`);
}

console.log(`SCAFFOLD_ROUTE_REGISTERED: ${routePath} → ${domainName}`);
