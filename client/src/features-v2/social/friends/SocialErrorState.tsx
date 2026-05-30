import styles from "./Friends.module.css";

type Props = {
  message: string;
};

export function SocialErrorState({ message }: Props) {
  return (
    <div className={styles.state} role="alert">
      Błąd: {message}
    </div>
  );
}
