/**
 * features-v2/publishing — PublishingComposerCore.
 *
 * Shared rendering shell consumed by every composer variant. Variants supply
 * their own title / placeholder / extra fields; the core owns target +
 * visibility + body + media + preview + submit + states.
 */
import { useCallback, useMemo, useState } from "react";
import type {
  PublishingAdapter,
  PublishingCommandUi,
  PublishingContentTypeUi,
  PublishingMediaRefUi,
  PublishingTargetDefinitionUi,
  PublishingVisibilityUi,
} from "./types";
import { PublishingTargetSelector } from "./PublishingTargetSelector";
import { PublishingVisibilitySelector } from "./PublishingVisibilitySelector";
import { PublishingMediaPicker } from "./PublishingMediaPicker";
import { PublishingPreview } from "./PublishingPreview";
import { PublishingSubmitBar } from "./PublishingSubmitBar";
import { PublishingResultBlock } from "./PublishingResultBlock";
import { usePublishingPreview } from "./hooks/usePublishingPreview";
import { usePublishCommand } from "./hooks/usePublishCommand";
import styles from "./Publishing.module.css";

interface Props {
  viewerUserId: string;
  adapter: PublishingAdapter;
  availableTargets: readonly PublishingTargetDefinitionUi[];
  initialTarget: PublishingTargetDefinitionUi;
  contentType: PublishingContentTypeUi;
  bodyPlaceholder: string;
  showTitleField?: boolean;
  showDateField?: boolean;
  variantClassName?: string;
  composerTitle: string;
  composerSubtitle?: string;
  submitLabel?: string;
  mediaRuntimeReady?: boolean;
  onTargetChange?(next: PublishingTargetDefinitionUi): void;
  onPublishSuccess?(): void;
}

export function PublishingComposerCore(props: Props) {
  const { viewerUserId, adapter, availableTargets, initialTarget, contentType, bodyPlaceholder } = props;
  const { showTitleField = false, showDateField = false } = props;
  const { variantClassName, composerTitle, composerSubtitle, submitLabel } = props;
  const { mediaRuntimeReady = false, onTargetChange, onPublishSuccess } = props;

  const [target, setTarget] = useState<PublishingTargetDefinitionUi>(initialTarget);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [mediaRefs, setMediaRefs] = useState<readonly PublishingMediaRefUi[]>([]);
  const [visibility, setVisibility] = useState<PublishingVisibilityUi>(initialTarget.defaultVisibility);

  const command = useMemo<PublishingCommandUi | null>(() => {
    if (body.length === 0 && !showTitleField) return null;
    return {
      targetType: target.targetType,
      targetId: target.targetId ?? undefined,
      contentType,
      body,
      title: showTitleField ? title : undefined,
      date: showDateField ? date : undefined,
      mediaRefs,
      visibility,
      idempotencyKey: "preview-only",
    };
  }, [target, body, title, date, mediaRefs, visibility, contentType, showTitleField, showDateField]);

  const previewState = usePublishingPreview(adapter, viewerUserId, command);
  const publishState = usePublishCommand(adapter, viewerUserId);

  const handleTargetChange = useCallback((next: PublishingTargetDefinitionUi) => {
    setTarget(next);
    setVisibility(next.defaultVisibility);
    publishState.reset();
    onTargetChange?.(next);
  }, [publishState, onTargetChange]);

  const handleSubmit = useCallback(() => {
    if (!command) return;
    void publishState
      .publish({
        targetType: command.targetType,
        targetId: command.targetId,
        contentType: command.contentType,
        body: command.body,
        title: command.title,
        date: command.date,
        mediaRefs: command.mediaRefs,
        visibility: command.visibility,
      })
      .then((res) => {
        if (res.status === "published") {
          setBody(""); setTitle(""); setDate(""); setMediaRefs([]);
          onPublishSuccess?.();
        }
      })
      .catch(() => { /* surfaced via publishState.error */ });
  }, [command, publishState, onPublishSuccess]);

  const composerClass = `${styles.composer} ${variantClassName ?? ""}`.trim();
  const disabledForSubmit = target.status !== "available" || publishState.isSubmitting;

  return (
    <section className={composerClass} aria-label={composerTitle}>
      <header className={styles.composerHeader}>
        <div>
          <h2 className={styles.composerTitle}>{composerTitle}</h2>
          {composerSubtitle && <p className={styles.composerSubtitle}>{composerSubtitle}</p>}
        </div>
        {target.status === "partial" && <span className={styles.partialBadge}>w przygotowaniu</span>}
        {target.status === "blocked" && <span className={styles.blockedBadge}>brak uprawnień</span>}
      </header>

      <PublishingTargetSelector
        targets={availableTargets}
        selectedTargetType={target.targetType}
        selectedTargetId={target.targetId}
        onChange={handleTargetChange}
        disabled={publishState.isSubmitting}
      />

      {showTitleField && (
        <input className={styles.titleInput} placeholder="Tytuł" value={title} onChange={(e) => setTitle(e.target.value)} disabled={publishState.isSubmitting} />
      )}

      {showDateField && (
        <input type="datetime-local" className={styles.dateInput} value={date} onChange={(e) => setDate(e.target.value)} disabled={publishState.isSubmitting} />
      )}

      <textarea className={styles.bodyInput} placeholder={bodyPlaceholder} value={body} onChange={(e) => setBody(e.target.value)} disabled={publishState.isSubmitting} />

      <PublishingVisibilitySelector target={target} value={visibility} onChange={setVisibility} disabled={publishState.isSubmitting} />

      <PublishingMediaPicker target={target} mediaRefs={mediaRefs} onChange={setMediaRefs} mediaRuntimeReady={mediaRuntimeReady} />

      <PublishingPreview preview={previewState.preview} />

      <PublishingResultBlock result={publishState.result} error={publishState.error} />

      <PublishingSubmitBar
        target={target}
        bodyLength={body.length}
        disabled={disabledForSubmit || body.trim().length === 0}
        isSubmitting={publishState.isSubmitting}
        onSubmit={handleSubmit}
        submitLabel={submitLabel}
      />
    </section>
  );
}
