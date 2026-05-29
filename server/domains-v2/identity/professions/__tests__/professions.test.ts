import { beforeEach, describe, expect, it } from "vitest";
import {
  applyModeration,
  createInMemoryProfessionsRepository,
  createProfessionsService,
  dryRunImport,
  isValidSlug,
  normalizeSlug,
  type ProfessionsService,
} from "../public-api";
import { PROFESSION_CATEGORY_SEED } from "../seeds/profession-categories.seed";
import type {
  ImportProfessionRow,
  ProfessionCategoryDTO,
  ProfessionProposalRecord,
} from "../dto";

function makeService(): ProfessionsService {
  return createProfessionsService({ repo: createInMemoryProfessionsRepository() });
}

const ALLOWED_CATEGORY_KEYS = ["id", "name", "slug", "icon", "order", "status"].sort();

describe("professions / categories reference data", () => {
  let svc: ProfessionsService;
  beforeEach(() => {
    svc = makeService();
  });

  it("ships exactly 30 categories", async () => {
    expect(PROFESSION_CATEGORY_SEED).toHaveLength(30);
    expect(await svc.listCategories()).toHaveLength(30);
  });

  it("is sorted by order ASC (never by name)", async () => {
    const cats = await svc.listCategories();
    const orders = cats.map((c) => c.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(cats[0].slug).toBe("technologia-i-it");
  });

  it("fixes the legacy rzemiosło slug typo", async () => {
    const cats = await svc.listCategories();
    const slugs = cats.map((c) => c.slug);
    expect(slugs).toContain("rzemioslo-i-uslugi-techniczne");
    expect(slugs).not.toContain("rzemiosto-i-uslugi-techniczne");
  });

  it("has valid, unique slugs and only active status", async () => {
    const cats = await svc.listCategories();
    const slugs = cats.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(30);
    expect(cats.every((c) => isValidSlug(c.slug))).toBe(true);
    expect(cats.every((c) => c.status === "active")).toBe(true);
  });

  it("public category DTO carries no field beyond the reference shape (no PII)", async () => {
    const cats = await svc.listCategories();
    for (const c of cats as ProfessionCategoryDTO[]) {
      expect(Object.keys(c).sort()).toEqual(ALLOWED_CATEGORY_KEYS);
    }
  });
});

describe("professions / DATA_PENDING surfaces", () => {
  let svc: ProfessionsService;
  beforeEach(() => {
    svc = makeService();
  });

  it("searchProfessions returns data_pending (no faked rows)", async () => {
    const res = await svc.searchProfessions({ query: "dev" });
    expect(res.state).toBe("data_pending");
  });

  it("listSpecializations returns data_pending (no faked rows)", async () => {
    const res = await svc.listSpecializations({ professionSlug: "anything" });
    expect(res.state).toBe("data_pending");
  });
});

describe("professions / import dry-run validator", () => {
  let svc: ProfessionsService;
  beforeEach(() => {
    svc = makeService();
  });

  it("dry run never persists", async () => {
    const report = await svc.dryRunImport([
      { categorySlug: "technologia-i-it", professionName: "Programista" },
    ]);
    expect(report.persisted).toBe(false);
    expect(report.mode).toBe("dry_run");
    expect(report.validRows).toBe(1);
    expect(report.newProfessions).toBe(1);
  });

  it("rejects malformed rows: empty name, invalid slug, unknown category", () => {
    const rows: ImportProfessionRow[] = [
      { categorySlug: "technologia-i-it", professionName: "" },
      { categorySlug: "technologia-i-it", professionName: "X", professionSlug: "Bad Slug!" },
      { categorySlug: "nie-istnieje", professionName: "Y" },
    ];
    const report = dryRunImport(rows, new Set(["technologia-i-it"]));
    const codes = report.issues.map((i) => i.code);
    expect(codes).toContain("EMPTY_NAME");
    expect(codes).toContain("INVALID_SLUG");
    expect(codes).toContain("UNKNOWN_CATEGORY");
    expect(report.validRows).toBe(0);
  });

  it("detects duplicate slug across rows", () => {
    const rows: ImportProfessionRow[] = [
      { categorySlug: "technologia-i-it", professionName: "Programista" },
      { categorySlug: "technologia-i-it", professionName: "Programista" },
    ];
    const report = dryRunImport(rows, new Set(["technologia-i-it"]));
    expect(report.issues.some((i) => i.code === "DUPLICATE_SLUG")).toBe(true);
    expect(report.issues.some((i) => i.code === "DUPLICATE_NAME")).toBe(true);
  });

  it("flags an empty specialization name when one is declared", () => {
    const rows: ImportProfessionRow[] = [
      { categorySlug: "technologia-i-it", professionName: "Programista", specializationName: "   " },
    ];
    const report = dryRunImport(rows, new Set(["technologia-i-it"]));
    expect(
      report.issues.some((i) => i.field === "specializationName" && i.code === "EMPTY_NAME"),
    ).toBe(true);
  });

  it("detects duplicate specialization WITHIN the same profession", () => {
    const rows: ImportProfessionRow[] = [
      { categorySlug: "technologia-i-it", professionName: "Programista", specializationName: "Frontend" },
      { categorySlug: "technologia-i-it", professionName: "Programista", specializationName: "Frontend" },
    ];
    const report = dryRunImport(rows, new Set(["technologia-i-it"]));
    expect(
      report.issues.some((i) => i.field === "specializationSlug" && i.code === "DUPLICATE_SLUG"),
    ).toBe(true);
  });

  it("allows the SAME specialization slug under DIFFERENT professions", () => {
    const rows: ImportProfessionRow[] = [
      { categorySlug: "technologia-i-it", professionName: "Programista", specializationName: "Frontend" },
      { categorySlug: "design-i-projektowanie", professionName: "Projektant", specializationName: "Frontend" },
    ];
    const report = dryRunImport(
      rows,
      new Set(["technologia-i-it", "design-i-projektowanie"]),
    );
    expect(report.issues.length).toBe(0);
    expect(report.validRows).toBe(2);
    expect(report.newSpecializations).toBe(2);
    expect(report.persisted).toBe(false);
  });
});

describe("professions / slug normalization", () => {
  it("slugifies Polish names without diacritics", () => {
    expect(normalizeSlug("Inżynieria i przemysł")).toBe("inzynieria-i-przemysl");
    expect(normalizeSlug("Usługi osobiste (beauty, wellness)")).toBe("uslugi-osobiste-beauty-wellness");
    expect(normalizeSlug("Religia i duchowość")).toBe("religia-i-duchowosc");
  });
});

describe("professions / admin moderation skeleton", () => {
  const base: ProfessionProposalRecord = {
    id: "p1",
    proposedName: "Nowy zawód",
    proposedSlug: "nowy-zawod",
    categorySlug: "technologia-i-it",
    proposedByUserId: "u-1",
    status: "pending",
    mergedIntoSlug: null,
    createdAt: "2026-05-29T00:00:00Z",
  };
  const NOW = "2026-05-29T10:00:00Z";

  it("approve / reject move a pending proposal", () => {
    const a = applyModeration(base, { kind: "approve" }, NOW);
    expect(a.ok && a.record.status).toBe("approved");
    const r = applyModeration(base, { kind: "reject" }, NOW);
    expect(r.ok && r.record.status).toBe("rejected");
  });

  it("merge requires a target and records mergedIntoSlug", () => {
    const ok = applyModeration(base, { kind: "merge", intoSlug: "programista" }, NOW);
    expect(ok.ok && ok.record.status).toBe("merged");
    expect(ok.ok && ok.record.mergedIntoSlug).toBe("programista");
    const bad = applyModeration(base, { kind: "merge", intoSlug: "" }, NOW);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.code).toBe("MERGE_TARGET_REQUIRED");
  });

  it("cannot moderate a non-pending proposal", () => {
    const decided: ProfessionProposalRecord = { ...base, status: "approved" };
    const res = applyModeration(decided, { kind: "reject" }, NOW);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("NOT_PENDING");
  });
});
