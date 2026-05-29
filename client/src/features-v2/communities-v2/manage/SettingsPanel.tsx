import { useEffect, useState } from "react";
import type { CommunityProfileDTO } from "@shared/contracts/communities";
import styles from "../CommunityManage.module.css";

export type SettingsPanelProps = {
  profile: CommunityProfileDTO;
  onSubmit: (input: { name?: string; description?: string; visibility?: "public" | "private" }) => Promise<void>;
};

export function SettingsPanel({ profile, onSubmit }: SettingsPanelProps) {
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description);
  const [visibility, setVisibility] = useState<"public" | "private">(
    profile.visibility === "private" ? "private" : "public",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setDescription(profile.description);
    setVisibility(profile.visibility === "private" ? "private" : "public");
  }, [profile]);

  return (
    <section className={styles.panel} aria-labelledby="settings-heading">
      <h2 id="settings-heading" className={styles.panelTitle}>Ustawienia podstawowe</h2>
      <form
        className={styles.settingsForm}
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          await onSubmit({ name, description, visibility });
          setSaving(false);
        }}
      >
        <label className={styles.field}>
          <span className={styles.label}>Nazwa</span>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={3}
            maxLength={80}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Opis</span>
          <textarea
            className={styles.textarea}
            value={description}
            rows={3}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <fieldset className={styles.field}>
          <legend className={styles.label}>Widoczność</legend>
          <label className={styles.radioRow}>
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
            />
            <span>Publiczna</span>
          </label>
          <label className={styles.radioRow}>
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={visibility === "private"}
              onChange={() => setVisibility("private")}
            />
            <span>Prywatna</span>
          </label>
        </fieldset>
        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryButton} disabled={saving}>
            {saving ? "Zapisywanie..." : "Zapisz zmiany"}
          </button>
        </div>
      </form>
    </section>
  );
}
