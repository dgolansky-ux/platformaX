/**
 * features-v2/publishing/composers — ChannelComposer.
 * Official tone — meant for channel leads.
 */
import { PublishingComposerCore } from "../PublishingComposerCore";
import type { PublishingAdapter, PublishingTargetDefinitionUi } from "../types";
import styles from "../Publishing.module.css";

interface Props {
  viewerUserId: string;
  adapter: PublishingAdapter;
  availableTargets: readonly PublishingTargetDefinitionUi[];
  channelTarget: PublishingTargetDefinitionUi;
  onPublished?(): void;
}

export function ChannelComposer({ viewerUserId, adapter, availableTargets, channelTarget, onPublished }: Props) {
  return (
    <PublishingComposerCore
      viewerUserId={viewerUserId}
      adapter={adapter}
      availableTargets={availableTargets}
      initialTarget={channelTarget}
      contentType="channel_post"
      bodyPlaceholder="Opublikuj wpis na kanale…"
      composerTitle={`Kanał: ${channelTarget.label.replace(/^Kanał:\s*/, "")}`}
      composerSubtitle="Tylko prowadzący kanał mogą publikować."
      variantClassName={styles.composerVariantChannel}
      submitLabel="Opublikuj wpis"
      onPublishSuccess={onPublished}
    />
  );
}
