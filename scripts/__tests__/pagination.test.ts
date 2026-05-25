import { describe, it, expect } from "vitest";

const LIST_INDICATORS = [
  "findAll",
  "findMany",
  "getList",
  "fetchList",
  "listAll",
  "searchAll",
  "getFeed",
  "fetchFeed",
  "queryAll",
  "getAll",
];

const QUERY_PATTERNS = [
  /\.select\(\s*\)\s*\.from\s*\(/,
  /db\.select\(\s*\)\s*\.from\s*\(/,
];

const PAGINATION_MARKERS = [
  "limit",
  "maxLimit",
  "cursor",
  "fixedCap",
  "stableOrder",
  "offset",
  "pageSize",
  "perPage",
  "take",
];

const SAFE_MARKERS = [
  "MOCK_LOCAL_ONLY",
  "FIXED_CAP",
  "UI_ONLY",
  "TEST_FIXTURE",
];

function checkPagination(content: string): {
  hasListPattern: boolean;
  hasPagination: boolean;
  hasSafeMarker: boolean;
} {
  const hasSafeMarker = SAFE_MARKERS.some((m) => content.includes(m));
  const hasKeyword = LIST_INDICATORS.some((i) => content.includes(i));
  const hasQueryPattern = QUERY_PATTERNS.some((p) => p.test(content));
  const hasListPattern = hasKeyword || hasQueryPattern;
  const hasPagination = PAGINATION_MARKERS.some((m) => content.includes(m));
  return { hasListPattern, hasPagination, hasSafeMarker };
}

describe("pagination: db.select().from() detection", () => {
  it("FAILS for db.select().from(users) without limit", () => {
    const r = checkPagination(
      "const users = await db.select().from(users);",
    );
    expect(r.hasListPattern).toBe(true);
    expect(r.hasPagination).toBe(false);
  });

  it("PASSES for db.select().from(users).limit(20)", () => {
    const r = checkPagination(
      "const users = await db.select().from(users).limit(20);",
    );
    expect(r.hasListPattern).toBe(true);
    expect(r.hasPagination).toBe(true);
  });

  it("PASSES with fixedCap marker", () => {
    const r = checkPagination(
      "// fixedCap\nconst users = await db.select().from(users);",
    );
    expect(r.hasListPattern).toBe(true);
    expect(r.hasPagination).toBe(true);
  });

  it("PASSES with MOCK_LOCAL_ONLY safe marker", () => {
    const r = checkPagination(
      "// MOCK_LOCAL_ONLY\nconst users = await db.select().from(users);",
    );
    expect(r.hasSafeMarker).toBe(true);
  });
});

describe("pagination: keyword detection", () => {
  it("FAILS for findAll without limit", () => {
    const r = checkPagination("const all = await db.findAll({});");
    expect(r.hasListPattern).toBe(true);
    expect(r.hasPagination).toBe(false);
  });

  it("PASSES for findAll with cursor", () => {
    const r = checkPagination(
      "const all = await db.findAll({ cursor: nextCursor });",
    );
    expect(r.hasListPattern).toBe(true);
    expect(r.hasPagination).toBe(true);
  });

  it("FAILS for getAll without limit", () => {
    const r = checkPagination("return service.getAll();");
    expect(r.hasListPattern).toBe(true);
    expect(r.hasPagination).toBe(false);
  });
});
