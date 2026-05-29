/**
 * shared reference data: the 30 V2 profession categories. Single source of
 * truth imported by BOTH the server domain seed and the frontend feature
 * adapter (the frontend must not import `@server/*`). Pure data — no imports,
 * no runtime, no PII. `order` is 1-based and authoritative (sort by `order`
 * ASC, never by name). The `rzemioslo-...` slug fixes the legacy typo.
 */
export type ProfessionCategorySeed = {
  name: string;
  slug: string;
  icon: string;
  order: number;
};

export const PROFESSION_CATEGORY_SEED: readonly ProfessionCategorySeed[] = [
  { order: 1, icon: "💻", name: "Technologia i IT", slug: "technologia-i-it" },
  { order: 2, icon: "🤖", name: "Data / AI / analiza danych", slug: "data-ai-analiza-danych" },
  { order: 3, icon: "⚙️", name: "Inżynieria i przemysł", slug: "inzynieria-i-przemysl" },
  { order: 4, icon: "🔬", name: "Nauka i badania", slug: "nauka-i-badania" },
  { order: 5, icon: "📚", name: "Edukacja i szkolenia", slug: "edukacja-i-szkolenia" },
  { order: 6, icon: "🎨", name: "Design i projektowanie", slug: "design-i-projektowanie" },
  { order: 7, icon: "💼", name: "Zarządzanie i przedsiębiorczość", slug: "zarzadzanie-i-przedsiebiorczosc" },
  { order: 8, icon: "📣", name: "Marketing i branding", slug: "marketing-i-branding" },
  { order: 9, icon: "📈", name: "Sprzedaż i rozwój biznesu", slug: "sprzedaz-i-rozwoj-biznesu" },
  { order: 10, icon: "💰", name: "Finanse i księgowość", slug: "finanse-i-ksiegowosc" },
  { order: 11, icon: "⚖️", name: "Prawo i doradztwo prawne", slug: "prawo-i-doradztwo-prawne" },
  { order: 12, icon: "👥", name: "HR i rozwój organizacji", slug: "hr-i-rozwoj-organizacji" },
  { order: 13, icon: "📰", name: "Media i dziennikarstwo", slug: "media-i-dziennikarstwo" },
  { order: 14, icon: "🎬", name: "Film i produkcja wideo", slug: "film-i-produkcja-wideo" },
  { order: 15, icon: "📷", name: "Fotografia", slug: "fotografia" },
  { order: 16, icon: "🎵", name: "Muzyka i produkcja audio", slug: "muzyka-i-produkcja-audio" },
  { order: 17, icon: "🎭", name: "Sztuka i kultura", slug: "sztuka-i-kultura" },
  { order: 18, icon: "🎮", name: "Gry i rozrywka cyfrowa", slug: "gry-i-rozrywka-cyfrowa" },
  { order: 19, icon: "🏗️", name: "Budownictwo i architektura", slug: "budownictwo-i-architektura" },
  { order: 20, icon: "🚛", name: "Transport i logistyka", slug: "transport-i-logistyka" },
  { order: 21, icon: "🛒", name: "Handel i e-commerce", slug: "handel-i-e-commerce" },
  { order: 22, icon: "🍽️", name: "Gastronomia", slug: "gastronomia" },
  { order: 23, icon: "✈️", name: "Turystyka i hotelarstwo", slug: "turystyka-i-hotelarstwo" },
  { order: 24, icon: "🔧", name: "Rzemiosło i usługi techniczne", slug: "rzemioslo-i-uslugi-techniczne" },
  { order: 25, icon: "🏥", name: "Zdrowie i medycyna", slug: "zdrowie-i-medycyna" },
  { order: 26, icon: "🧠", name: "Psychologia i rozwój osobisty", slug: "psychologia-i-rozwoj-osobisty" },
  { order: 27, icon: "🏋️", name: "Sport i fitness", slug: "sport-i-fitness" },
  { order: 28, icon: "💆", name: "Usługi osobiste (beauty, wellness)", slug: "uslugi-osobiste-beauty-wellness" },
  { order: 29, icon: "🛡️", name: "Bezpieczeństwo i służby", slug: "bezpieczenstwo-i-sluzby" },
  { order: 30, icon: "🙏", name: "Religia i duchowość", slug: "religia-i-duchowosc" },
] as const;
