/**
 * dependency-cruiser config — PlatformaX V2
 *
 * Runs PARALLEL_WITH_TOOLING with the existing custom regex guards
 * (audit-domain-boundaries.mjs, check-architecture-import-graph.mjs,
 * check-no-legacy-imports.mjs). Built-in tools catch the structural cases
 * (cycles, layered dependencies, dead orphans, generic import boundaries)
 * that the custom regex guards approximate.
 *
 * Scope: `client/src/**`, `server/**`, `shared/**` only.
 */
/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "Circular dependencies are forbidden — they break tree-shaking, " +
        "reasoning and incremental compilation, and they typically mean a " +
        "missing seam in a domain boundary. Aligns with PX-ARCH-008.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment:
        "Source files reachable from no entry point and from no test are " +
        "dead code. Excludes config/scripts/declarations.",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$",
          "\\.d\\.ts$",
          "(^|/)tsconfig.*\\.json$",
          "(^|/)scripts/",
          "(^|/)tests/architecture/fixtures/",
          "(^|/)docs/",
        ],
      },
      to: {},
    },
    {
      name: "no-client-to-server",
      severity: "error",
      comment:
        "Frontend MUST NOT import server runtime. The only legal seam is " +
        "shared/contracts. Aligns with PX-ARCH-001 / PX-ARCH-009.",
      from: { path: "^client/src/" },
      to: { path: "^server/" },
    },
    {
      name: "no-cross-domain-internal",
      severity: "error",
      comment:
        "Cross-domain imports MUST go through public-api.ts / contracts.ts / " +
        "events.ts / dto.ts. Reaching another domain's `repository`, " +
        "`service`, `policy`, `router`, `mapper` or `internal/*` is forbidden. " +
        "Aligns with PX-ARCH-003 / PX-ARCH-004.",
      from: { path: "^server/domains-v2/([^/]+)/" },
      to: {
        path: "^server/domains-v2/([^/]+)/(repository|service|policy|router|mapper|internal)",
        pathNot: "^server/domains-v2/$1/", // same-domain internals stay allowed
      },
    },
    {
      name: "no-legacy-runtime-import",
      severity: "error",
      comment:
        "Active V2 code must not import legacy folders. Aligns with " +
        "PX-ARCH-001 / PX-ARCH-002.",
      from: { path: "^(client/src/(app-v2|features-v2)|server/(domains-v2|application-v2))/" },
      to: { path: "(^|/)(features|pages|components)/" },
    },
    {
      name: "no-app-v2-to-server",
      severity: "error",
      comment:
        "app-v2 is the composition layer for the FRONTEND. It must not " +
        "import server runtime directly — only the shared contracts.",
      from: { path: "^client/src/app-v2/" },
      to: { path: "^server/" },
    },
    {
      name: "no-features-to-server",
      severity: "error",
      comment:
        "features-v2/* must not depend on server runtime — only shared " +
        "contracts and feature-local HTTP adapters.",
      from: { path: "^client/src/features-v2/" },
      to: { path: "^server/" },
    },
    {
      name: "shared-no-runtime",
      severity: "error",
      comment:
        "shared/* is pure types/contracts. It must not import client or " +
        "server runtime — otherwise the contracts stop being portable.",
      from: { path: "^shared/" },
      to: { path: "^(client/|server/)" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
      mainFields: ["module", "main", "types", "typings"],
    },
    reporterOptions: {
      dot: {
        collapsePattern: "^(node_modules|client/src/[^/]+|server/[^/]+)/[^/]+/",
      },
      archi: {
        collapsePattern: "^(node_modules|client/src/[^/]+|server/[^/]+)/[^/]+/",
      },
    },
    exclude: {
      path: [
        "node_modules",
        "dist",
        "audit-out",
        "coverage",
        "scripts/__tests__/",
        "tests/architecture/fixtures/",
      ],
    },
  },
};
