/**
 * features-v2/public-hub / TopicsSlot — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 */
import type { HubTopicUi } from "../types";
import styles from "../PublicHub.module.css";

type Props = { topics: readonly HubTopicUi[] };

export function TopicsSlot({ topics }: Props) {
  if (topics.length === 0) {
    return <p className={styles.empty}>Tu jeszcze nie ma publicznych tematów.</p>;
  }
  return (
    <ul className={styles.cardList} aria-label="Tematy">
      {topics.map((topic) => (
        <li key={topic.id} className={styles.card}>
          <p className={styles.cardTitle}>#{topic.slug} · {topic.title}</p>
          {topic.description ? (
            <p className={styles.cardDesc}>{topic.description}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
