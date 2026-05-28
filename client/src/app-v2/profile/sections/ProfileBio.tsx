import styles from "../styles/profile-header.module.css";

type ProfileBioProps = {
  bio: string | null;
  /** True only for authenticated owner. Controls the empty-state "Dodaj opis..." owner prompt. */
  canEdit: boolean;
};

export function ProfileBio({ bio, canEdit }: ProfileBioProps) {
  return (
    <div className={styles.bioCol}>
      <p className={styles.label}>O mnie</p>
      {bio ? (
        <p className={styles.bioText}>{bio}</p>
      ) : canEdit ? (
        <p className={`${styles.bioText} ${styles.bioEmpty}`}>Dodaj opis...</p>
      ) : null}
    </div>
  );
}
