/**
 * communities-v2 — category reference data + helpers.
 *
 * Reference list. Public (no PII). Used by listPublicCommunities to filter
 * and by the wizard/UI to render category chips.
 */

export type CommunityCategoryRef = {
  slug: string;
  name: string;
  emoji: string;
  sortOrder: number;
};

export const COMMUNITY_CATEGORIES: readonly CommunityCategoryRef[] = [
  { slug: "biznes",          name: "Biznes",            emoji: "💼", sortOrder: 1 },
  { slug: "technologia",     name: "Technologia",       emoji: "💻", sortOrder: 2 },
  { slug: "sport",           name: "Sport i ruch",      emoji: "🏃", sortOrder: 3 },
  { slug: "zdrowie",         name: "Zdrowie",           emoji: "🩺", sortOrder: 4 },
  { slug: "edukacja",        name: "Edukacja",          emoji: "🎓", sortOrder: 5 },
  { slug: "kultura",         name: "Kultura i sztuka",  emoji: "🎭", sortOrder: 6 },
  { slug: "lokalne",         name: "Lokalne",           emoji: "📍", sortOrder: 7 },
  { slug: "rodzina",         name: "Rodzina",           emoji: "👨‍👩‍👧", sortOrder: 8 },
  { slug: "hobby",           name: "Hobby",             emoji: "🎨", sortOrder: 9 },
  { slug: "podroze",         name: "Podróże",           emoji: "🌍", sortOrder: 10 },
  { slug: "spolecznosci",    name: "Społeczności",      emoji: "🤝", sortOrder: 11 },
  { slug: "rozwoj-osobisty", name: "Rozwój osobisty",   emoji: "🌱", sortOrder: 12 },
] as const;

export function isValidCategorySlug(slug: string | null | undefined): boolean {
  if (!slug) return true;
  return COMMUNITY_CATEGORIES.some((c) => c.slug === slug);
}
