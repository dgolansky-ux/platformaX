/**
 * features-v2/publishing/composers — ProfilePresentationComposer.
 *
 * Editorial tone — Tytuł sekcji + opis + media. Backend not ready in V2;
 * surfaces truthful partial-state.
 */
import { PublishingComposerCore } from "../PublishingComposerCore";
import type { PublishingAdapter, PublishingTargetDefinitionUi } from "../types";
import styles from "../Publishing.module.css";

interface Props {
  viewerUserId: string;
  adapter: PublishingAdapter;
  availableTargets: readonly PublishingTargetDefinitionUi[];
  presentationTarget: PublishingTargetDefinitionUi;
  onPublished?(): void;
}

export function ProfilePresentationComposer({ viewerUserId, adapter, availableTargets, presentationTarget, onPublished }: Props) {
  return (
    <PublishingComposerCore
      viewerUserId={viewerUserId}
      adapter={adapter}
      availableTargets={availableTargets}
      initialTarget={presentationTarget}
      contentType="profile_presentation_item"
      bodyPlaceholder="Opisz sekcję prezentacji…"
      showTitleField
      composerTitle="Prezentacja profilu"
      composerSubtitle="Edytorska sekcja na Twoim profilu — możesz dodać media i wybrać widoczność."
      variantClassName={styles.composerVariantPresentation}
      submitLabel="Zapisz sekcję"
      onPublishSuccess={onPublished}
    />
  );
}
