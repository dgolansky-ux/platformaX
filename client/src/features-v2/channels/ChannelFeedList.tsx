import type { ChannelFeedDTO } from "@shared/contracts/channel-posts";
import { ChannelPostCard } from "./ChannelPostCard";
import styles from "./Channels.module.css";

type Props = {
  channelSlug: string;
  feed: ChannelFeedDTO;
  onChanged: () => Promise<void>;
};

export function ChannelFeedList({ channelSlug, feed, onChanged }: Props) {
  if (!feed.canViewFeed) {
    return (
      <section className={styles.restrictedState}>
        Ten kanał jest prywatny. Obserwuj kanał albo poproś prowadzących o dostęp.
      </section>
    );
  }

  const regular = feed.pinnedPost
    ? feed.items.filter((post) => post.id !== feed.pinnedPost?.id)
    : feed.items;

  return (
    <section className={styles.feedSection} aria-label="Feed kanału">
      {feed.pinnedPost ? (
        <ChannelPostCard channelSlug={channelSlug} post={feed.pinnedPost} onChanged={onChanged} />
      ) : null}
      {regular.length === 0 && !feed.pinnedPost ? (
        <div className={styles.empty}>Ten kanał nie ma jeszcze wpisów.</div>
      ) : (
        <div className={styles.feedList}>
          {regular.map((post) => (
            <ChannelPostCard key={post.id} channelSlug={channelSlug} post={post} onChanged={onChanged} />
          ))}
        </div>
      )}
    </section>
  );
}
