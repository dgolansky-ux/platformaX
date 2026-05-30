/**
 * features-v2/publishing/composers — ImportantEventComposer.
 *
 * Visually distinct from a normal post — title + date + body + media.
 * Backend not ready in V2; the core surfaces a truthful partial-state.
 */
import { PublishingComposerCore } from "../PublishingComposerCore";
import type { PublishingAdapter, PublishingTargetDefinitionUi } from "../types";
import styles from "../Publishing.module.css";

interface Props {
  viewerUserId: string;
  adapter: PublishingAdapter;
  availableTargets: readonly PublishingTargetDefinitionUi[];
  importantEventTarget: PublishingTargetDefinitionUi;
  onPublished?(): void;
}

export function ImportantEventComposer({ viewerUserId, adapter, availableTargets, importantEventTarget, onPublished }: Props) {
  return (
    <PublishingComposerCore
      viewerUserId={viewerUserId}
      adapter={adapter}
      availableTargets={availableTargets}
      initialTarget={importantEventTarget}
      contentType="important_event"
      bodyPlaceholder="Opisz wydarzenie…"
      showTitleField
      showDateField
      composerTitle="Ważne wydarzenie"
      composerSubtitle="Specjalna karta na Twoim profilu. Tytuł, data i opis są wymagane."
      variantClassName={styles.composerVariantImportantEvent}
      submitLabel="Zapisz wydarzenie"
      onPublishSuccess={onPublished}
    />
  );
}
