import type { ChannelPostDTO } from "@shared/contracts/channel-posts";
import { channelsMockAdapter } from "./channels-mock-adapter";
import { ChannelPostActionBar } from "./ChannelPostInteractions";
import { ChannelPostCard as DisplayChannelPostCard } from "../content-display";
import { channelPostToDisplay } from "./post-display-mappers";
import styles from "./Channels.module.css";

type Props = {
  channelSlug: string;
  post: ChannelPostDTO;
  onChanged: () => Promise<void>;
};

export function ChannelPostCard({ channelSlug, post, onChanged }: Props) {
  async function togglePin() {
    if (post.pinned) {
      await channelsMockAdapter.unpinChannelPost({ channelSlug, postId: post.id });
    } else {
      await channelsMockAdapter.pinChannelPost({ channelSlug, postId: post.id });
    }
    await onChanged();
  }

  return (
    <article className={`${styles.postCard} ${post.pinned ? styles.postPinned : ""}`}>
      <DisplayChannelPostCard
        vm={channelPostToDisplay(channelSlug, post)}
        onReact={() => undefined}
        onComment={() => undefined}
      />
      {post.viewerCanPin ? (
        <button type="button" className={styles.postAction} onClick={() => void togglePin()}>
          {post.pinned ? "Odepnij" : "Przypnij"}
        </button>
      ) : null}
      <ChannelPostActionBar channelSlug={channelSlug} post={post} onChanged={onChanged} />
    </article>
  );
}
