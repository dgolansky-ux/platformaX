/**
 * features-v2/communities-v2 / structure / CommunityStructureDialogs — renders
 * the active overlay (create wizard, move, deactivate, edit) for the structure
 * screen. Extracted from the shell to keep components small. Every action is
 * wired to the structure mock-adapter — no fake save.
 */
import type { CommunityStructureNodeDTO } from "@shared/contracts/communities-structure";
import { communityStructureMockAdapter } from "./structure-mock-adapter";
import { CreateSubcommunityWizard } from "./CreateSubcommunityWizard";
import { MoveSubcommunityDialog } from "./MoveSubcommunityDialog";
import { DeactivateSubcommunityDialog } from "./DeactivateSubcommunityDialog";
import { EditSubcommunityDialog } from "./EditSubcommunityDialog";

export type DialogState =
  | { kind: "none" }
  | { kind: "create"; parent: CommunityStructureNodeDTO }
  | { kind: "move"; node: CommunityStructureNodeDTO }
  | { kind: "deactivate"; node: CommunityStructureNodeDTO }
  | { kind: "edit"; node: CommunityStructureNodeDTO };

type ActionResult = { ok: boolean; error?: { message: string } };

export function StructureDialogs({
  dialog,
  slug,
  moveCandidates,
  onClose,
  onReload,
  run,
}: {
  dialog: DialogState;
  slug: string;
  moveCandidates: readonly CommunityStructureNodeDTO[];
  onClose: () => void;
  onReload: () => Promise<void>;
  run: (op: () => Promise<ActionResult>) => Promise<void>;
}) {
  if (dialog.kind === "create") {
    return (
      <CreateSubcommunityWizard
        parent={dialog.parent}
        parentSlug={slug}
        onClose={onClose}
        onCreated={() => { onClose(); void onReload(); }}
      />
    );
  }
  if (dialog.kind === "move") {
    const node = dialog.node;
    return (
      <MoveSubcommunityDialog
        node={node}
        candidates={moveCandidates}
        onCancel={onClose}
        onSubmit={(newParentId) => void run(() => communityStructureMockAdapter.moveSubcommunity({ communityId: node.id, newParentId }))}
      />
    );
  }
  if (dialog.kind === "deactivate") {
    const node = dialog.node;
    return (
      <DeactivateSubcommunityDialog
        node={node}
        onCancel={onClose}
        onConfirm={() => void run(() => communityStructureMockAdapter.deactivateSubcommunity({ communityId: node.id }))}
      />
    );
  }
  if (dialog.kind === "edit") {
    const node = dialog.node;
    return (
      <EditSubcommunityDialog
        node={node}
        onCancel={onClose}
        onSubmit={(input) => void run(() => communityStructureMockAdapter.updateSubcommunityBasics({ communityId: node.id, ...input }))}
      />
    );
  }
  return null;
}
