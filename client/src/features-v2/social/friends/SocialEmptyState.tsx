import styles from "./Friends.module.css";

type Props = {
  title: string;
  body?: string;
};

export function SocialEmptyState({ title, body }: Props) {
  return (
    <div className={styles.state} role="status">
      <strong>{title}</strong>
      {body ? <div>{body}</div> : null}
    </div>
  );
}
