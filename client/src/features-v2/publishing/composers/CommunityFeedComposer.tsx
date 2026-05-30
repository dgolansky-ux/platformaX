/**
 * features-v2/publishing/composers — CommunityFeedComposer + Staff/Relational
 * wrappers. Same core; different title / placeholder / variant accent.
 */
import { PublishingComposerCore } from "../PublishingComposerCore";
import type { PublishingAdapter, PublishingTargetDefinitionUi } from "../types";
import styles from "../Publishing.module.css";

interface Props {
  viewerUserId: string;
  adapter: PublishingAdapter;
  availableTargets: readonly PublishingTargetDefinitionUi[];
  communityTarget: PublishingTargetDefinitionUi;
  onPublished?(): void;
}

export function CommunityFeedComposer({ viewerUserId, adapter, availableTargets, communityTarget, onPublished }: Props) {
  return (
    <PublishingComposerCore
      viewerUserId={viewerUserId}
      adapter={adapter}
      availableTargets={availableTargets}
      initialTarget={communityTarget}
      contentType="community_post"
      bodyPlaceholder="Co chcesz pokazać społeczności?"
      composerTitle="Wpis dla społeczności"
      composerSubtitle="Trafi na główny feed społeczności."
      variantClassName={styles.composerVariantCommunity}
      onPublishSuccess={onPublished}
    />
  );
}

export function StaffFeedComposer({ viewerUserId, adapter, availableTargets, communityTarget, onPublished }: Props) {
  return (
    <PublishingComposerCore
      viewerUserId={viewerUserId}
      adapter={adapter}
      availableTargets={availableTargets}
      initialTarget={communityTarget}
      contentType="community_post"
      bodyPlaceholder="Wiadomość dla kadry…"
      composerTitle="Wpis dla kadry"
      composerSubtitle="Widoczny tylko dla kadry tej społeczności."
      variantClassName={styles.composerVariantCommunityStaff}
      onPublishSuccess={onPublished}
    />
  );
}

export function RelationalFeedComposer({ viewerUserId, adapter, availableTargets, communityTarget, onPublished }: Props) {
  return (
    <PublishingComposerCore
      viewerUserId={viewerUserId}
      adapter={adapter}
      availableTargets={availableTargets}
      initialTarget={communityTarget}
      contentType="community_post"
      bodyPlaceholder="Wpis relacyjny — z miesięcznym limitem…"
      composerTitle="Wpis relacyjny"
      composerSubtitle="Trafi na feed relacyjny — pamiętaj o miesięcznym limicie."
      variantClassName={styles.composerVariantCommunityRelational}
      onPublishSuccess={onPublished}
    />
  );
}
