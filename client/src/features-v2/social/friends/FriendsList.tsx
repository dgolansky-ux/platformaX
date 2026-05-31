import type { FriendCardModel } from "./types";
import { FriendCard } from "./FriendCard";
import { SocialEmptyState } from "./SocialEmptyState";
import styles from "./Friends.module.css";

type Props = {
  items: readonly FriendCardModel[];
  emptyTitle: string;
};

export function FriendsList({ items, emptyTitle }: Props) {
  if (items.length === 0) {
    return (
      <SocialEmptyState
        title={emptyTitle}
        body="Brak osób do pokazania w tej sekcji."
      />
    );
  }
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <FriendCard key={item.person.userId} model={item} />
      ))}
    </div>
  );
}
