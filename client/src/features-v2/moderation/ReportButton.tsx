/**
 * features-v2/moderation — ReportButton + ReportMenuItem.
 *
 * Subtle entry points: the small pill button for hover surfaces, the
 * full-width menu item for "..." menus on post cards.
 */
import { useState } from "react";
import { ReportDialog } from "./ReportDialog";
import type {
  UiModerationAdapter,
  UiModerationTargetType,
  UiModerationViewer,
} from "./types";
import styles from "./Moderation.module.css";

interface ReportButtonProps {
  viewer: UiModerationViewer;
  adapter: UiModerationAdapter;
  targetType: UiModerationTargetType;
  targetId: string;
  targetOwnerUserId: string | null;
  /** When the viewer is owner of the target, hide the button. */
  disabledForSelf?: boolean;
  label?: string;
}

export function ReportButton({
  viewer,
  adapter,
  targetType,
  targetId,
  targetOwnerUserId,
  disabledForSelf,
  label = "Zgłoś",
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  if (disabledForSelf) return null;
  return (
    <>
      <button
        type="button"
        className={styles.reportButton}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {label}
      </button>
      <ReportDialog
        open={open}
        viewer={viewer}
        adapter={adapter}
        targetType={targetType}
        targetId={targetId}
        targetOwnerUserId={targetOwnerUserId}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

interface ReportMenuItemProps extends ReportButtonProps {
  onSelected?(): void;
}

export function ReportMenuItem({
  viewer,
  adapter,
  targetType,
  targetId,
  targetOwnerUserId,
  disabledForSelf,
  onSelected,
  label = "Zgłoś",
}: ReportMenuItemProps) {
  const [open, setOpen] = useState(false);
  if (disabledForSelf) return null;
  return (
    <>
      <button
        type="button"
        className={styles.reportMenuItem}
        onClick={() => {
          setOpen(true);
          onSelected?.();
        }}
      >
        {label}
      </button>
      <ReportDialog
        open={open}
        viewer={viewer}
        adapter={adapter}
        targetType={targetType}
        targetId={targetId}
        targetOwnerUserId={targetOwnerUserId}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
