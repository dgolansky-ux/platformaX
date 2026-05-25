import styles from "../profile.module.css";

type ProfileBioProps = {
  bio: string | null;
  isOwner: boolean;
};

export function ProfileBio({ bio, isOwner }: ProfileBioProps) {
  return (
    <div className={styles.bioCol}>
      <p className={styles.label}>O mnie</p>
      {bio ? (
        <p className={styles.bioText}>{bio}</p>
      ) : isOwner ? (
        <p className={`${styles.bioText} ${styles.bioEmpty}`}>Dodaj opis...</p>
      ) : null}
    </div>
  );
}
