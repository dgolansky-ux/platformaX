/**
 * features-v2/friend-feed / FriendFeedWorkplaceTeaserCard.
 *
 * The mini-card that surfaces a workplace post on the friend feed. Visually
 * smaller and structurally different from `FriendFeedPostCard`: it carries
 * a short preview only and links to the full workplace post (no inline
 * reactions, no comments, no full body).
 */
import type { FriendFeedWorkplaceTeaserItemUi } from "./types";
import { WorkplaceTeaserCard } from "../content-display";
import { workplaceTeaserToPostDisplay } from "./post-display-mappers";

type Props = {
  item: FriendFeedWorkplaceTeaserItemUi;
  onOpen?: (route: string) => void;
};

export function FriendFeedWorkplaceTeaserCard({ item, onOpen }: Props) {
  const vm = workplaceTeaserToPostDisplay(item);
  return (
    <li data-testid="friend-feed-workplace-teaser">
      <WorkplaceTeaserCard
        vm={vm}
        onShare={onOpen ? () => onOpen(vm.routeTarget) : undefined}
      />
    </li>
  );
}
