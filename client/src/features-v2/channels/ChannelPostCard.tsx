import type { ChannelPostDTO } from "@shared/contracts/channel-posts";
import { channelsMockAdapter } from "./channels-mock-adapter";
import { ChannelPostActionBar } from "./ChannelPostInteractions";
import styles from "./Channels.module.css";

type Props = {
  channelSlug: string;
  post: ChannelPostDTO;
  onChanged: () => Promise<void>;
};

export function ChannelPostCard({ channelSlug, post, onChanged }: Props) {
  const author = post.author?.displayName ?? "Prowadzący kanału";

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
      <div className={styles.postHead}>
        <div>
          <p className={styles.postAuthor}>{author}</p>
          <time className={styles.postTime} dateTime={post.createdAt}>
            {new Date(post.createdAt).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}
          </time>
        </div>
        {post.pinned ? <span className={styles.pinnedBadge}>Przypięte</span> : null}
      </div>
      <p className={styles.postBody}>{post.body}</p>
      {post.viewerCanPin ? (
        <button type="button" className={styles.postAction} onClick={() => void togglePin()}>
          {post.pinned ? "Odepnij" : "Przypnij"}
        </button>
      ) : null}
      <ChannelPostActionBar channelSlug={channelSlug} post={post} onChanged={onChanged} />
    </article>
  );
}
