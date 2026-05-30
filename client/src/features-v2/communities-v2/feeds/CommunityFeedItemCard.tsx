/**
 * features-v2/communities-v2 / feeds / CommunityFeedItemCard — one post in a
 * community feed. Shows author (public summary), body, date, feed badge and
 * the distribution trace ("Opublikowano z: {źródło}") for items pushed down
 * from an ancestor community. Slice 6 adds the interactions panel under the
 * card: reaction toggle + lazy comments thread. No fake counters, no PII.
 */
import type { CommunityFeedItemDTO } from "@shared/contracts/community-feeds";
import { CommunityPostInteractions } from "./interactions/CommunityPostInteractions";
import { CommunityFeedPostCard, RelationalFeedPostCard, StaffFeedPostCard } from "../../content-display";
import { communityFeedItemToDisplay } from "./post-display-mappers";
import styles from "./Feeds.module.css";

type Props = {
  item: CommunityFeedItemDTO;
  canComment: boolean;
  canReact: boolean;
  noPermissionMessage?: string;
};

export function CommunityFeedItemCard({ item, canComment, canReact, noPermissionMessage }: Props) {
  const vm = communityFeedItemToDisplay(item, canComment, canReact);
  const Card = item.feedType === "staff_only"
    ? StaffFeedPostCard
    : item.feedType === "relational"
      ? RelationalFeedPostCard
      : CommunityFeedPostCard;
  return (
    <article className={styles.card} data-testid={`feed-item-${item.id}`}>
      <Card vm={vm} />
      <CommunityPostInteractions
        item={item}
        canComment={canComment}
        canReact={canReact}
        noPermissionMessage={noPermissionMessage}
      />
    </article>
  );
}
