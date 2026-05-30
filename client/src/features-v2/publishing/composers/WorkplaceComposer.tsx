/**
 * features-v2/publishing/composers — WorkplaceComposer.
 * Professional tone. Pełny post zostaje na stronie miejsca pracy; zajawka
 * pojawia się na feedzie znajomych — informacja w subtitle.
 */
import { PublishingComposerCore } from "../PublishingComposerCore";
import type { PublishingAdapter, PublishingTargetDefinitionUi } from "../types";
import styles from "../Publishing.module.css";

interface Props {
  viewerUserId: string;
  adapter: PublishingAdapter;
  availableTargets: readonly PublishingTargetDefinitionUi[];
  workplaceTarget: PublishingTargetDefinitionUi;
  onPublished?(): void;
}

export function WorkplaceComposer({ viewerUserId, adapter, availableTargets, workplaceTarget, onPublished }: Props) {
  return (
    <PublishingComposerCore
      viewerUserId={viewerUserId}
      adapter={adapter}
      availableTargets={availableTargets}
      initialTarget={workplaceTarget}
      contentType="workplace_update"
      bodyPlaceholder="Co nowego w pracy?"
      composerTitle={workplaceTarget.label}
      composerSubtitle="Pełny wpis pojawi się na stronie miejsca pracy, a na feedzie znajomych — zajawka."
      variantClassName={styles.composerVariantWorkplace}
      submitLabel="Opublikuj wpis pracy"
      onPublishSuccess={onPublished}
    />
  );
}
