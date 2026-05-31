import type { FriendCardModel } from "./types";
import { FriendsList } from "./FriendsList";

type Props = {
  items: readonly FriendCardModel[];
};

export function PendingSentRequests({ items }: Props) {
  return <FriendsList items={items} emptyTitle="Brak wysłanych zaproszeń" />;
}
