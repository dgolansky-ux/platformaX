/**
 * features-v2/communities-v2/wizard — shared types + step config.
 *
 * Clean-room re-implementation of the legacy 4-step community wizard:
 * Podstawy → Kategoria → Lokalizacja → Utwórz. NO legacy runtime — no tRPC,
 * no toasts library, no inline-encoded media uploads. Pure presentational + V2 adapter.
 */
export type WizardLocationMode = "online" | "stationary" | "hybrid";

export type WizardData = {
  name: string;
  slug: string;
  description: string;
  visibility: "public" | "private";
  categorySlug: string | null;
  topic: string;
  locationMode: WizardLocationMode | null;
  locationCity: string;
  tags: string;
};

export type WizardStepKey = "basics" | "category" | "location" | "summary";

export type WizardStepConfig = { id: number; key: WizardStepKey; title: string };

export const WIZARD_STEPS: readonly WizardStepConfig[] = [
  { id: 1, key: "basics",   title: "Podstawy" },
  { id: 2, key: "category", title: "Kategoria" },
  { id: 3, key: "location", title: "Lokalizacja" },
  { id: 4, key: "summary",  title: "Utwórz" },
];

export const EMPTY_WIZARD_DATA: WizardData = {
  name: "",
  slug: "",
  description: "",
  visibility: "public",
  categorySlug: null,
  topic: "",
  locationMode: null,
  locationCity: "",
  tags: "",
};
