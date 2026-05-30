/**
 * features-v2/publishing/composers — FriendFeedComposer.
 * Light, social variant. Placeholder mirrors the legacy "Co u Ciebie?".
 */
import { PublishingComposerCore } from "../PublishingComposerCore";
import type { PublishingAdapter, PublishingTargetDefinitionUi } from "../types";
import styles from "../Publishing.module.css";

interface Props {
  viewerUserId: string;
  adapter: PublishingAdapter;
  availableTargets: readonly PublishingTargetDefinitionUi[];
  friendFeedTarget: PublishingTargetDefinitionUi;
  onPublished?(): void;
}

export function FriendFeedComposer({ viewerUserId, adapter, availableTargets, friendFeedTarget, onPublished }: Props) {
  return (
    <PublishingComposerCore
      viewerUserId={viewerUserId}
      adapter={adapter}
      availableTargets={availableTargets}
      initialTarget={friendFeedTarget}
      contentType="text_post"
      bodyPlaceholder="Co u Ciebie?"
      composerTitle="Napisz do znajomych"
      composerSubtitle="Wpis pojawi się na feedzie Twoich znajomych."
      variantClassName={styles.composerVariantFriend}
      onPublishSuccess={onPublished}
    />
  );
}
