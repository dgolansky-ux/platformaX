import styles from "./Friends.module.css";

type Props = {
  label?: string;
};

export function SocialLoadingState({ label = "Ładowanie..." }: Props) {
  return (
    <div className={styles.state} aria-busy="true">
      {label}
    </div>
  );
}
