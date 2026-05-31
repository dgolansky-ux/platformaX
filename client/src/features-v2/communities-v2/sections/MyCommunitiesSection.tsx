/**
 * features-v2/communities-v2/sections / MyCommunitiesSection — collapsible list
 * z legacy „Moje społeczności" (half-list + „Pokaż wszystkie (N)" / „Zwiń").
 */
import { useState } from "react";
import type { CommunityCardDTO } from "@shared/contracts/communities";
import { MyCommunityCard } from "../cards/MyCommunityCard";
import { CreateCommunityCard } from "../cards/CreateCommunityCard";
import sections from "./Sections.module.css";

type MyCommunitiesSectionProps = {
  communities: readonly CommunityCardDTO[];
};

export function MyCommunitiesSection({ communities }: MyCommunitiesSectionProps) {
  const [expanded, setExpanded] = useState(false);
  if (communities.length === 0) {
    return (
      <section className={sections.section} aria-label="Moje społeczności">
        <h2 className={sections.sectionTitle}>Moje społeczności</h2>
        <CreateCommunityCard />
      </section>
    );
  }
  const COLLAPSED = 4;
  const visible = expanded ? communities : communities.slice(0, COLLAPSED);
  const more = Math.max(0, communities.length - COLLAPSED);
  return (
    <section className={sections.section} aria-label="Moje społeczności">
      <div className={sections.sectionHeader}>
        <h2 className={sections.sectionTitle}>Moje społeczności</h2>
        {communities.length > 1 ? (
          <button type="button" className={sections.expandToggle} onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Zwiń" : `Pokaż wszystkie (${communities.length})`}
          </button>
        ) : null}
      </div>
      <div className={sections.myList}>
        {visible.map((c) => (
          <MyCommunityCard key={c.id} community={c} />
        ))}
      </div>
      {!expanded && more > 0 ? (
        <button type="button" className={sections.expandFooter} onClick={() => setExpanded(true)}>
          + {more} więcej społeczności
        </button>
      ) : null}
    </section>
  );
}
