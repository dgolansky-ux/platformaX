/**
 * features-v2/communities-v2 / structure / CommunityStructureShell — the
 * community structure screen (UI_SHELL_ONLY + MOCK_LOCAL_ONLY). Mirrors the
 * legacy ManageStructure page: header + breadcrumb + Drzewo/Lista toggle +
 * create CTA + node actions, with empty/loading/error/unauthorized states. The
 * legacy "Zasięgi" (broadcast) tab is intentionally NOT carried over — that is
 * Slice 5 (feeds). No `@server/*` imports; every action hits the mock-adapter.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CommunityStructureNodeDTO, CommunityStructureViewDTO } from "@shared/contracts/communities-structure";
import { communityStructureMockAdapter } from "./structure-mock-adapter";
import { CommunityStructureBreadcrumb } from "./CommunityStructureBreadcrumb";
import { CommunityStructureTree } from "./CommunityStructureTree";
import { CommunityStructureList } from "./CommunityStructureList";
import { StructureToolbar, StructureHero, type ViewMode } from "./CommunityStructureChrome";
import { StructureDialogs, type DialogState } from "./CommunityStructureDialogs";
import styles from "./Structure.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "forbidden"; message: string }
  | { status: "ready"; view: CommunityStructureViewDTO };

function descendantIds(tree: readonly CommunityStructureNodeDTO[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of tree) {
      if (n.parentId && ids.has(n.parentId) && !ids.has(n.id)) {
        ids.add(n.id);
        changed = true;
      }
    }
  }
  return ids;
}

export function CommunityStructureShell({ slug }: { slug: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });

  const load = useCallback(async () => {
    const res = await communityStructureMockAdapter.getCommunityStructureView(slug);
    if (!res.ok) {
      setState(res.error.code === "FORBIDDEN"
        ? { status: "forbidden", message: res.error.message }
        : { status: "error", message: res.error.message });
      return;
    }
    setState({ status: "ready", view: res.value });
  }, [slug]);

  useEffect(() => { void load(); }, [load]);

  const wrap = useCallback(async (op: () => Promise<{ ok: boolean; error?: { message: string } }>) => {
    setActionError(null);
    const res = await op();
    if (!res.ok && res.error) setActionError(res.error.message);
    setSelectedId(null);
    setDialog({ kind: "none" });
    await load();
  }, [load]);

  const view = state.status === "ready" ? state.view : null;
  const moveCandidates = useMemo(() => {
    if (!view || dialog.kind !== "move") return [];
    const blocked = descendantIds(view.tree, dialog.node.id);
    return view.tree.filter(
      (n) => !blocked.has(n.id) && n.status === "active" && n.depth < view.maxDepth && n.id !== dialog.node.parentId,
    );
  }, [view, dialog]);

  if (state.status === "loading") {
    return <div className={styles.root}><div className={styles.state} aria-busy="true">Ładowanie struktury…</div></div>;
  }
  if (state.status === "error") {
    return <div className={styles.root}><div className={styles.errorState} role="alert">{state.message}</div></div>;
  }
  if (state.status === "forbidden") {
    return (
      <div className={styles.root}>
        <div className={styles.state} role="alert">
          <div className={styles.stateIcon} aria-hidden="true">🔒</div>
          <p className={styles.stateTitle}>Struktura jest prywatna</p>
          <p>{state.message}</p>
          <p style={{ marginTop: 12 }}><Link className={styles.backButton} to={`/communities/${slug}`}>← Wróć do profilu</Link></p>
        </div>
      </div>
    );
  }

  const v = state.view;
  const hasSubcommunities = v.tree.length > 1;
  const handlers = {
    canManage: v.canManage,
    maxDepth: v.maxDepth,
    onToggleSelect: (id: string) => setSelectedId((cur) => (cur === id ? null : id)),
    onAddChild: (node: CommunityStructureNodeDTO) => setDialog({ kind: "create", parent: node }),
    onEdit: (node: CommunityStructureNodeDTO) => setDialog({ kind: "edit", node }),
    onMove: (node: CommunityStructureNodeDTO) => setDialog({ kind: "move", node }),
    onDeactivate: (node: CommunityStructureNodeDTO) => setDialog({ kind: "deactivate", node }),
    onReactivate: (node: CommunityStructureNodeDTO) =>
      void wrap(() => communityStructureMockAdapter.reactivateSubcommunity({ communityId: node.id })),
  };

  return (
    <section className={styles.root} aria-labelledby="structure-heading">
      <StructureHero view={v} slug={slug} />
      <CommunityStructureBreadcrumb trail={v.breadcrumbs} />
      {actionError ? <p className={styles.errorState} role="alert">{actionError}</p> : null}
      <StructureToolbar
        view={v}
        viewMode={viewMode}
        hasSubcommunities={hasSubcommunities}
        onViewMode={setViewMode}
        onCreate={() => setDialog({ kind: "create", parent: v.current })}
      />
      {!v.canManage ? (
        <p className={styles.notice}>Masz podgląd struktury. Zarządzać może founder lub admin społeczności.</p>
      ) : null}
      {!hasSubcommunities && !v.canCreateChild ? (
        <div className={`${styles.state} ${styles.stateEmpty}`}>
          <div className={styles.stateIcon} aria-hidden="true">🌳</div>
          <p className={styles.stateTitle}>Brak podspołeczności</p>
          <p>Ta społeczność nie ma jeszcze elementów podrzędnych.</p>
        </div>
      ) : viewMode === "tree" ? (
        <CommunityStructureTree tree={v.tree} rootId={v.root.id} selectedId={selectedId} {...handlers} />
      ) : (
        <CommunityStructureList tree={v.tree} rootId={v.root.id} selectedId={selectedId} {...handlers} />
      )}
      <StructureDialogs
        dialog={dialog}
        slug={slug}
        moveCandidates={moveCandidates}
        onClose={() => setDialog({ kind: "none" })}
        onReload={load}
        run={wrap}
      />
    </section>
  );
}
