/**
 * features-v2/public-hub / NewsletterChatSlot — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * Renders a public preview of each newsletter chat the owner runs. NOT a chat
 * surface — this slot intentionally makes the broadcast nature explicit (the
 * composer for the owner lives elsewhere) and never claims that a private
 * 1:1 chat exists.
 */
import type { HubNewsletterChatUi } from "../types";
import styles from "../PublicHub.module.css";

type Props = { newsletterChats: readonly HubNewsletterChatUi[] };

export function NewsletterChatSlot({ newsletterChats }: Props) {
  if (newsletterChats.length === 0) {
    return <p className={styles.empty}>Właściciel nie publikuje jeszcze newslettera.</p>;
  }
  return (
    <ul className={styles.cardList} aria-label="Newsletter chatowy">
      {newsletterChats.map((chat) => (
        <li key={chat.id} className={styles.newsletterCard}>
          <p className={styles.cardTitle}>{chat.title}</p>
          {chat.description ? (
            <p className={styles.cardDesc}>{chat.description}</p>
          ) : null}
          <p className={styles.newsletterMeta}>
            <span className={styles.subscribers}>{chat.subscriberCount} subskrybentów</span>
            <span>· Newsletter (broadcast)</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
