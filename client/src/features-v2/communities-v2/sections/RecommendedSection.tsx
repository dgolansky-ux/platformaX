/**
 * features-v2/communities-v2/sections / RecommendedSection — horizontal-scroll
 * row z legacy „Polecane dla Ciebie". Adapter zwraca już bounded set (max 6).
 */
import type {
  CommunityCardDTO,
  CommunityCategoryDTO,
} from "@shared/contracts/communities";
import { RecommendedCommunityCard } from "../cards/RecommendedCommunityCard";
import sections from "./Sections.module.css";

type RecommendedSectionProps = {
  communities: readonly CommunityCardDTO[];
  categories: readonly CommunityCategoryDTO[];
  onJoin?: (slug: string) => void;
};

export function RecommendedSection({ communities, categories, onJoin }: RecommendedSectionProps) {
  if (communities.length === 0) return null;
  const emojiBySlug: Record<string, string> = {};
  for (const c of categories) emojiBySlug[c.slug] = c.emoji;
  return (
    <section className={sections.section} aria-label="Polecane dla Ciebie">
      <div className={sections.sectionHeader}>
        <h2 className={sections.sectionTitle}>Polecane dla Ciebie</h2>
      </div>
      <div className={sections.recommendedRow}>
        {communities.map((c) => (
          <RecommendedCommunityCard
            key={c.id}
            community={c}
            categoryEmoji={c.categorySlug ? emojiBySlug[c.categorySlug] : undefined}
            onJoin={onJoin}
          />
        ))}
      </div>
    </section>
  );
}
