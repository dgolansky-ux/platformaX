/**
 * identity / professions — record → public DTO mapping. Drops any internal
 * field so the cross-boundary DTO carries reference data only (no PII).
 */
import type {
  ProfessionCategoryDTO,
  ProfessionDTO,
  SpecializationDTO,
} from "@shared/contracts/professions";
import type {
  ProfessionCategoryRecord,
  ProfessionRecord,
  SpecializationRecord,
} from "./contracts";

export function toCategoryDTO(r: ProfessionCategoryRecord): ProfessionCategoryDTO {
  return { id: r.id, name: r.name, slug: r.slug, icon: r.icon, order: r.order, status: "active" };
}

export function toProfessionDTO(r: ProfessionRecord): ProfessionDTO {
  return { id: r.id, name: r.name, slug: r.slug, categorySlug: r.categorySlug, status: r.status };
}

export function toSpecializationDTO(r: SpecializationRecord): SpecializationDTO {
  return { id: r.id, name: r.name, slug: r.slug, professionSlug: r.professionSlug, status: r.status };
}
