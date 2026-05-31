/**
 * features-v2/professional-profile / ProfileProfessionalLayer.
 *
 * The "Miejsca pracy" section that lives inside the personal profile
 * professional layer. Owner sees an "Add workplace" CTA; viewers see public
 * cards only. No fake routes, no no-op clicks: the CTA calls the parent
 * handler.
 */
import { useCallback, useEffect, useState } from "react";
import { professionalProfileMockAdapter } from "./mock-adapter";
import type { ProfessionalLayerUi } from "./types";
import styles from "./Workplace.module.css";

type Props = {
  viewerUserId: string;
  profileOwnerId: string;
  onAddWorkplace?: () => void;
  onOpenWorkplace?: (workplaceSlug: string) => void;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; layer: ProfessionalLayerUi };

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function ProfileProfessionalLayer({
  viewerUserId,
  profileOwnerId,
  onAddWorkplace,
  onOpenWorkplace,
}: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const res = await professionalProfileMockAdapter.listProfessionalLayer(
      viewerUserId,
      profileOwnerId,
    );
    if (!res.ok) {
      setState({ status: "error", message: res.error.message });
      return;
    }
    setState({ status: "ready", layer: res.value });
  }, [viewerUserId, profileOwnerId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return <div className={styles.loading} aria-busy="true">Ładuję miejsca pracy…</div>;
  }
  if (state.status === "error") {
    return <p className={styles.errorBanner} role="alert">{state.message}</p>;
  }

  const { layer } = state;
  return (
    <section className={styles.layerRoot} aria-labelledby="professional-layer-title">
      <div className={styles.layerHeader}>
        <h2 id="professional-layer-title" className={styles.layerTitle}>Miejsca pracy</h2>
        {layer.canAddWorkplace ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onAddWorkplace}
            disabled={!onAddWorkplace}
          >
            Dodaj miejsce pracy
          </button>
        ) : null}
      </div>

      {layer.workplaces.length === 0 ? (
        <p className={styles.empty}>
          {layer.canAddWorkplace
            ? "Nie dodano jeszcze miejsc pracy."
            : "Ten użytkownik nie ma jeszcze widocznych miejsc pracy."}
        </p>
      ) : (
        <ul className={styles.layerList}>
          {layer.workplaces.map((w) => (
            <li key={w.workplaceId}>
              <button
                type="button"
                className={styles.cardLink}
                onClick={() => onOpenWorkplace?.(w.slug)}
                disabled={!onOpenWorkplace}
              >
                <span className={styles.cardLogo} aria-hidden="true">{initials(w.name)}</span>
                <span className={styles.cardBody}>
                  <span className={styles.cardName}>{w.name}</span>
                  {w.headline ? <span className={styles.cardHeadline}>{w.headline}</span> : null}
                </span>
                <span className={styles.visibilityChip}>
                  {w.visibility === "public" ? "Publiczne" : w.visibility === "friends_only" ? "Znajomi" : "Prywatne"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
