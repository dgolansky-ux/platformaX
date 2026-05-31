/**
 * features-v2/communities-v2 / CommunityModulesManage — UI_SHELL_ONLY +
 * MOCK_LOCAL_ONLY.
 *
 * Lists whitelisted modules and lets founder/admin toggle them on/off through
 * the local adapter. No `@server/*` imports. Disabled when viewer cannot manage.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  CommunityModuleSummaryDTO,
  CommunityProfileDTO,
} from "@shared/contracts/communities";
import { communitiesMockAdapter } from "./mock-adapter";
import styles from "./CommunitySubScreens.module.css";

type CommunityModulesManageProps = {
  slug: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: CommunityProfileDTO; modules: CommunityModuleSummaryDTO[] };

export function CommunityModulesManage({ slug }: CommunityModulesManageProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [profileRes, modulesRes] = await Promise.all([
      communitiesMockAdapter.getCommunityProfile(slug),
      communitiesMockAdapter.listModules(slug),
    ]);
    if (!profileRes.ok) {
      setState({ status: "error", message: profileRes.error.message });
      return;
    }
    if (!modulesRes.ok) {
      setState({ status: "error", message: modulesRes.error.message });
      return;
    }
    setState({ status: "ready", profile: profileRes.value, modules: modulesRes.value });
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return <div className={styles.loading} aria-busy="true">Ładowanie modułów…</div>;
  }
  if (state.status === "error") {
    return <div className={styles.error} role="alert">{state.message}</div>;
  }

  const { profile, modules } = state;

  async function handleToggle(moduleKey: string, enabled: boolean) {
    setActionError(null);
    setPendingKey(moduleKey);
    const res = await communitiesMockAdapter.toggleModule({
      communitySlug: slug,
      moduleKey,
      enabled,
    });
    setPendingKey(null);
    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }
    await load();
  }

  return (
    <section className={styles.root} aria-labelledby="modules-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{profile.name}</p>
          <h1 id="modules-heading" className={styles.title}>Moduły społeczności</h1>
          <p className={styles.subtitle}>
            Włącz tylko te moduły, których potrzebuje społeczność. Moduły nie przechowują danych —
            udostępniają sloty, do których podłącza się Public Hub i kanały.
          </p>
        </div>
        <Link to={`/communities/${slug}/manage`} className={styles.backLink}>← Zarządzanie</Link>
      </header>

      {!profile.canManage ? (
        <p className={styles.notice}>
          Tryb tylko do odczytu — modułami zarządzają founder/admin społeczności.
        </p>
      ) : null}

      {actionError ? <p className={styles.error} role="alert">{actionError}</p> : null}

      <ul className={styles.list}>
        {modules.map((module) => (
          <li key={module.key} className={styles.row}>
            <div>
              <p className={styles.rowTitle}>{module.name}</p>
              <p className={styles.rowDesc}>{module.description}</p>
            </div>
            <div className={styles.rowActions}>
              <span className={module.enabled ? styles.statusOn : styles.statusOff}>
                {module.enabled ? "Włączony" : "Wyłączony"}
              </span>
              {profile.canManage ? (
                <button
                  type="button"
                  className={module.enabled ? styles.secondaryButton : styles.primaryButton}
                  onClick={() => handleToggle(module.key, !module.enabled)}
                  disabled={pendingKey === module.key}
                >
                  {pendingKey === module.key ? "Aktualizacja…" : module.enabled ? "Wyłącz" : "Włącz"}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
