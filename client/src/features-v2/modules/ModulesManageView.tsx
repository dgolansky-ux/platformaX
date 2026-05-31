/**
 * features-v2/modules / ModulesManageView — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * Owner-agnostic module management surface. Renders the whitelisted module
 * definitions plus the owner's enablement state, with a per-row toggle for
 * managers and a "not available for this owner" badge for modules whose
 * `allowedOwnerTypes` exclude the current owner. No `@server/*` imports.
 */
import { useCallback, useEffect, useState } from "react";
import type {
  ModuleEnablementUiDTO,
  ModuleOwnerContextUiDTO,
  ModuleOwnerType,
} from "./types";
import { modulesMockAdapter } from "./mock-adapter";
import styles from "./Modules.module.css";

type ModulesManageViewProps = {
  ownerType: ModuleOwnerType;
  ownerId: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; context: ModuleOwnerContextUiDTO; modules: readonly ModuleEnablementUiDTO[] };

export function ModulesManageView({ ownerType, ownerId }: ModulesManageViewProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [contextRes, modulesRes] = await Promise.all([
      modulesMockAdapter.getOwnerContext(ownerType, ownerId),
      modulesMockAdapter.listModulesForOwner(ownerType, ownerId),
    ]);
    if (!contextRes.ok) {
      setState({ status: "error", message: contextRes.error.message });
      return;
    }
    if (!modulesRes.ok) {
      setState({ status: "error", message: modulesRes.error.message });
      return;
    }
    setState({ status: "ready", context: contextRes.value, modules: modulesRes.value });
  }, [ownerType, ownerId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return <div className={styles.loading} aria-busy="true">Ładowanie modułów…</div>;
  }
  if (state.status === "error") {
    return <div className={styles.error} role="alert">{state.message}</div>;
  }

  const { context, modules } = state;
  const title =
    ownerType === "profile" ? "Moduły profilu" : "Moduły społeczności";
  const subtitle =
    ownerType === "profile"
      ? "Włącz tylko moduły, które mają być widoczne w Public Hub profilu. Moduły nie przechowują danych — udostępniają sloty."
      : "Włącz tylko te moduły, których potrzebuje społeczność. Sloty trafiają do Public Hub społeczności.";

  async function handleToggle(moduleKey: ModuleEnablementUiDTO["key"], enabled: boolean) {
    setActionError(null);
    setPendingKey(moduleKey);
    const res = await modulesMockAdapter.toggleModule({
      ownerType,
      ownerId,
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
        <p className={styles.kicker}>{context.ownerDisplayName}</p>
        <h1 id="modules-heading" className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      {!context.canManage ? (
        <p className={styles.notice}>
          Tryb tylko do odczytu — modułami zarządza właściciel profilu lub admin społeczności.
        </p>
      ) : null}

      {actionError ? <p className={styles.error} role="alert">{actionError}</p> : null}

      <ul className={styles.list}>
        {modules.map((module) => {
          const available = module.allowedOwnerTypes.includes(ownerType);
          return (
            <li key={module.key} className={styles.row}>
              <div className={styles.rowTitleWrap}>
                <p className={styles.rowTitle}>{module.name}</p>
                <p className={styles.rowDesc}>{module.description}</p>
                <div className={styles.badges}>
                  <span className={styles.badge}>
                    {module.allowedOwnerTypes.includes("profile") && module.allowedOwnerTypes.includes("community")
                      ? "Profil + Społeczność"
                      : module.allowedOwnerTypes.includes("profile")
                        ? "Profil"
                        : "Społeczność"}
                  </span>
                  {!available ? (
                    <span className={styles.badgeMuted}>Niedostępny dla tego właściciela</span>
                  ) : null}
                </div>
              </div>
              <div className={styles.rowActions}>
                <span className={module.enabled ? styles.statusOn : styles.statusOff}>
                  {module.enabled ? "Włączony" : "Wyłączony"}
                </span>
                {!available ? (
                  <button type="button" className={styles.disabledBtn} disabled aria-disabled="true">
                    Niedostępny
                  </button>
                ) : context.canManage ? (
                  <button
                    type="button"
                    className={module.enabled ? styles.secondaryButton : styles.primaryButton}
                    onClick={() => handleToggle(module.key, !module.enabled)}
                    disabled={pendingKey === module.key}
                  >
                    {pendingKey === module.key
                      ? "Aktualizacja…"
                      : module.enabled
                        ? "Wyłącz"
                        : "Włącz"}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
