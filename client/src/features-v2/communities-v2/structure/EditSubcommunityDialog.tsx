/**
 * features-v2/communities-v2 / structure / EditSubcommunityDialog — edit a
 * subcommunity's basics (name, description, visibility). Mirrors the legacy
 * EditElementSheet. Submits through the structure mock-adapter (no fake save).
 */
import { useState } from "react";
import type { CommunityStructureNodeDTO } from "@shared/contracts/communities-structure";
import styles from "./Structure.module.css";

export function EditSubcommunityDialog({
  node,
  onSubmit,
  onCancel,
}: {
  node: CommunityStructureNodeDTO;
  onSubmit: (input: { name: string; description: string; visibility: "public" | "private" }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(node.name);
  const [description, setDescription] = useState(node.description);
  const [visibility, setVisibility] = useState<"public" | "private">(
    node.visibility === "private" ? "private" : "public",
  );
  const nameError = name.trim().length < 3 ? "Nazwa musi mieć co najmniej 3 znaki." : null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="edit-title">
      <div className={styles.dialog}>
        <h2 id="edit-title" className={styles.dialogTitle}>Edytuj „{node.name}”</h2>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="edit-name">Nazwa</label>
          <input id="edit-name" className={styles.input} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
          {nameError ? <span className={styles.fieldError}>{nameError}</span> : null}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="edit-desc">Opis</label>
          <textarea id="edit-desc" className={styles.textarea} value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Widoczność</span>
          <div className={styles.choiceGrid}>
            {(["public", "private"] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={`${styles.choice} ${visibility === v ? styles.choiceActive : ""}`.trim()}
                onClick={() => setVisibility(v)}
              >
                <p className={styles.choiceTitle}>{v === "public" ? "Publiczna" : "Prywatna"}</p>
                <p className={styles.choiceDesc}>{v === "public" ? "Każdy może dołączyć" : "Tylko po zaproszeniu"}</p>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.ghostBtn} onClick={onCancel}>Anuluj</button>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!!nameError}
            onClick={() => onSubmit({ name: name.trim(), description: description.trim(), visibility })}
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
}
