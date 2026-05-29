/**
 * features-v2/communities-v2 / CreateCommunityForm — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * Captures community name/slug/description/visibility and submits through the
 * local mock adapter (no `@server/*` import, no HTTP transport). On success the
 * caller navigates to the new community's profile route.
 */
import { useState, type FormEvent } from "react";
import type {
  CommunityActionError,
  CommunityProfileDTO,
  CreateCommunityInput,
} from "@shared/contracts/communities";
import { communitiesMockAdapter } from "./mock-adapter";
import { slugify } from "./slugify";
import styles from "./CommunityForms.module.css";

type CreateCommunityFormProps = {
  onCreated: (community: CommunityProfileDTO) => void;
  onCancel: () => void;
};

type VisibilityValue = NonNullable<CreateCommunityInput["visibility"]>;
const VISIBILITY_OPTIONS: readonly { value: VisibilityValue; label: string; help: string }[] = [
  { value: "public", label: "Publiczna", help: "każdy może dołączyć i widzieć kartę społeczności." },
  { value: "private", label: "Prywatna", help: "dołączenie wymaga zaakceptowania zgłoszenia." },
];

export function CreateCommunityForm({ onCreated, onCancel }: CreateCommunityFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<CreateCommunityInput["visibility"]>("public");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<CommunityActionError | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await communitiesMockAdapter.createCommunity({
      name,
      slug,
      description,
      visibility,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCreated(result.value);
  }

  const fieldError = (field: string) =>
    error && error.code === "VALIDATION" && error.field === field ? error.message : null;
  const generalError =
    error && (error.code === "CONFLICT" || error.code === "FORBIDDEN" || error.code === "UNKNOWN")
      ? error.message
      : null;

  return (
    <form className={styles.form} onSubmit={handleSubmit} aria-labelledby="create-community-heading">
      <header className={styles.formHeader}>
        <h1 id="create-community-heading" className={styles.title}>Utwórz społeczność</h1>
        <p className={styles.subtitle}>
          Wypełnij podstawowe informacje. Wszystko zapisuje się lokalnie (MOCK_LOCAL_ONLY).
        </p>
      </header>

      <div className={styles.field}>
        <label htmlFor="community-name" className={styles.label}>Nazwa społeczności</label>
        <input
          id="community-name"
          className={styles.input}
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          minLength={3}
          maxLength={80}
          autoComplete="off"
        />
        {fieldError("name") ? <p className={styles.fieldError}>{fieldError("name")}</p> : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="community-slug" className={styles.label}>Identyfikator (slug)</label>
        <input
          id="community-slug"
          className={styles.input}
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          required
          pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          maxLength={48}
          autoComplete="off"
        />
        <p className={styles.help}>Pojawi się w adresie: /communities/{slug || "twoj-slug"}</p>
        {fieldError("slug") ? <p className={styles.fieldError}>{fieldError("slug")}</p> : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="community-description" className={styles.label}>Opis</label>
        <textarea
          id="community-description"
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={500}
        />
      </div>

      <fieldset className={styles.field}>
        <legend className={styles.label}>Widoczność</legend>
        {VISIBILITY_OPTIONS.map((opt) => (
          <label key={opt.value} className={styles.radioRow}>
            <input type="radio" name="visibility" value={opt.value} checked={visibility === opt.value} onChange={() => setVisibility(opt.value)} />
            <span><strong>{opt.label}</strong> — {opt.help}</span>
          </label>
        ))}
      </fieldset>

      {generalError ? (
        <p className={styles.formError} role="alert">
          {generalError}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Anuluj
        </button>
        <button type="submit" className={styles.primaryButton} disabled={submitting}>
          {submitting ? "Tworzenie..." : "Utwórz społeczność"}
        </button>
      </div>
    </form>
  );
}
