/**
 * features-v2/moderation — ModerationQueuePage.
 *
 * QUALITY_STRUCTURE_EXCEPTION — Slice 20 co-locates the filter bar, the list,
 * the detail panel, and the action bar in a single page so the
 * selected-report + refresh closure stays in one place. Splitting per-section
 * now would force list/detail to share state through prop drilling or context
 * before the runtime stabilizes. Registered in EXCEPTIONS_REGISTER.md
 * (EXC-012).
 *
 * Admin/moderator-only queue. Lists reports, filters by status / target /
 * reason, opens a detail panel with the report metadata + safe target preview
 * + the moderator action bar (dismiss / mark-reviewed / hide / deactivate /
 * restore — the underlying domain enforces per-target capability).
 */
import { useEffect, useMemo, useState } from "react";
import {
  UI_MODERATION_REPORT_REASONS,
  type UiModerationActionType,
  type UiModerationAdapter,
  type UiModerationListFilter,
  type UiModerationReportReason,
  type UiModerationReportStatus,
  type UiModerationTargetType,
  type UiModerationViewer,
  type UiReportAction,
  type UiReportReviewItem,
  type UiReportTargetPreview,
} from "./types";
import styles from "./Moderation.module.css";

interface ModerationQueuePageProps {
  viewer: UiModerationViewer;
  adapter: UiModerationAdapter;
}

const STATUS_OPTIONS: { value: UiModerationReportStatus; label: string }[] = [
  { value: "pending", label: "Oczekuje" },
  { value: "under_review", label: "W trakcie" },
  { value: "dismissed", label: "Odrzucone" },
  { value: "action_taken", label: "Działanie podjęte" },
];

const TARGET_OPTIONS: { value: UiModerationTargetType; label: string }[] = [
  { value: "profile", label: "Profil" },
  { value: "friend_feed_post", label: "Post znajomych" },
  { value: "friend_feed_comment", label: "Komentarz znajomych" },
  { value: "community", label: "Społeczność" },
  { value: "community_post", label: "Post w społeczności" },
  { value: "community_comment", label: "Komentarz w społeczności" },
  { value: "channel", label: "Kanał" },
  { value: "channel_post", label: "Post w kanale" },
  { value: "channel_comment", label: "Komentarz w kanale" },
  { value: "workplace", label: "Miejsce pracy" },
  { value: "workplace_post", label: "Post miejsca pracy" },
  { value: "important_event", label: "Ważne wydarzenie" },
  { value: "profile_presentation_item", label: "Prezentacja profilu" },
  { value: "media_asset", label: "Plik medialny" },
  { value: "module_item", label: "Element modułu" },
];

export function ModerationQueuePage({ viewer, adapter }: ModerationQueuePageProps) {
  const [filter, setFilter] = useState<UiModerationListFilter>({});
  const [items, setItems] = useState<readonly UiReportReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<{
    report: UiReportReviewItem;
    actions: readonly UiReportAction[];
    targetPreview: UiReportTargetPreview;
  } | null>(null);

  const isReviewer = viewer.role === "moderator" || viewer.role === "admin";

  const refresh = useMemo(
    () => async () => {
      if (!isReviewer) return;
      setLoading(true);
      try {
        const page = await adapter.listReviewQueue(viewer, filter);
        setItems(page.items);
      } finally {
        setLoading(false);
      }
    },
    [adapter, filter, isReviewer, viewer],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function applyAction(actionType: UiModerationActionType) {
    if (!selected) return;
    const result = await adapter.applyAction(viewer, {
      reportId: selected.report.id,
      actionType,
    });
    if (result.ok) {
      const details = await adapter.getReviewDetails(viewer, selected.report.id);
      if (details) setSelected(details);
      await refresh();
    }
  }

  if (!isReviewer) {
    return (
      <div className={styles.queueShell}>
        <div className={styles.statusBanner}>
          Ta sekcja jest dostępna wyłącznie dla moderatorów i administratorów.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.queueShell}>
      <h1>Moderacja zgłoszeń</h1>

      <div className={styles.queueFilters}>
        <select
          value={filter.status ?? ""}
          onChange={(event) =>
            setFilter((f) => ({ ...f, status: (event.target.value || undefined) as UiModerationReportStatus | undefined }))
          }
        >
          <option value="">Wszystkie statusy</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={filter.targetType ?? ""}
          onChange={(event) =>
            setFilter((f) => ({ ...f, targetType: (event.target.value || undefined) as UiModerationTargetType | undefined }))
          }
        >
          <option value="">Wszystkie typy celu</option>
          {TARGET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={filter.reason ?? ""}
          onChange={(event) =>
            setFilter((f) => ({ ...f, reason: (event.target.value || undefined) as UiModerationReportReason | undefined }))
          }
        >
          <option value="">Wszystkie powody</option>
          {UI_MODERATION_REPORT_REASONS.map((def) => (
            <option key={def.key} value={def.key}>{def.label}</option>
          ))}
        </select>
      </div>

      {loading ? <div className={styles.statusBanner}>Ładuję zgłoszenia…</div> : null}

      {!loading && items.length === 0 ? (
        <div className={styles.statusBanner}>Brak zgłoszeń dla wybranych filtrów.</div>
      ) : null}

      <div className={styles.queueTable}>
        {items.map((item) => (
          <ModerationQueueRow
            key={item.id}
            item={item}
            selected={selected?.report.id === item.id}
            onSelect={async () => {
              const details = await adapter.getReviewDetails(viewer, item.id);
              if (details) setSelected(details);
            }}
          />
        ))}
      </div>

      {selected ? (
        <div className={styles.detailPanel}>
          <h2>Szczegóły zgłoszenia</h2>
          <div>
            <span className={styles.statusChip} data-status={selected.report.status}>
              {selected.report.status}
            </span>
            <span
              className={styles.statusChip + " " + styles.severityChip}
              data-severity={selected.report.severity}
              style={{ marginLeft: "6px" }}
            >
              {selected.report.severity}
            </span>
          </div>
          <div>
            <strong>Powód:</strong>{" "}
            {UI_MODERATION_REPORT_REASONS.find((r) => r.key === selected.report.reason)?.label ?? selected.report.reason}
          </div>
          <div>
            <strong>Cel:</strong> {selected.report.targetType} / {selected.report.targetId}
          </div>
          {selected.report.description ? (
            <div>
              <strong>Opis zgłaszającego:</strong>
              <div className={styles.previewBox}>{selected.report.description}</div>
            </div>
          ) : null}
          <div>
            <strong>Podgląd celu:</strong>
            <div className={styles.previewBox}>
              {selected.targetPreview.previewText ?? "Podgląd niedostępny — TARGET_PREVIEW_PARTIAL."}
            </div>
          </div>
          <div className={styles.actionBar}>
            <button type="button" onClick={() => applyAction("mark_reviewed")}>Oznacz jako w trakcie</button>
            <button type="button" onClick={() => applyAction("dismiss_report")}>Odrzuć zgłoszenie</button>
            <button type="button" onClick={() => applyAction("hide_content")}>Ukryj treść</button>
            <button type="button" onClick={() => applyAction("deactivate_content")}>Dezaktywuj treść</button>
            <button type="button" onClick={() => applyAction("restrict_visibility")}>Ogranicz widoczność</button>
          </div>
          {selected.actions.length > 0 ? (
            <div>
              <strong>Historia działań:</strong>
              <ul>
                {selected.actions.map((a) => (
                  <li key={a.id}>
                    {a.createdAt} — {a.actionType}{a.reasonNote ? ` — ${a.reasonNote}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface RowProps {
  item: UiReportReviewItem;
  selected: boolean;
  onSelect(): void;
}

function ModerationQueueRow({ item, onSelect }: RowProps) {
  return (
    <button
      type="button"
      className={styles.queueRow}
      onClick={onSelect}
      style={{ textAlign: "left", appearance: "none", cursor: "pointer", background: "#fff" }}
    >
      <div className={styles.queueRowMeta}>
        <div>
          <strong>{item.targetType}</strong> · {item.targetId}
        </div>
        <div style={{ fontSize: "12px", color: "#475569" }}>
          {item.reason} · zgłoszone {item.createdAt}
        </div>
      </div>
      <div className={styles.queueRowActions}>
        <span className={styles.statusChip} data-status={item.status}>
          {item.status}
        </span>
        <span
          className={styles.statusChip + " " + styles.severityChip}
          data-severity={item.severity}
        >
          {item.severity}
        </span>
      </div>
    </button>
  );
}
