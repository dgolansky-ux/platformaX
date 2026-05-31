/**
 * features-v2/public-hub / IntegrationsSlot — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 */
import type { HubIntegrationUi } from "../types";
import styles from "../PublicHub.module.css";

type Props = { integrations: readonly HubIntegrationUi[] };

export function IntegrationsSlot({ integrations }: Props) {
  if (integrations.length === 0) {
    return <p className={styles.empty}>Brak publicznych integracji.</p>;
  }
  return (
    <ul className={styles.cardList} aria-label="Integracje">
      {integrations.map((integration) => (
        <li key={integration.id} className={styles.card}>
          <p className={styles.cardTitle}>{integration.name}</p>
          {integration.description ? (
            <p className={styles.cardDesc}>{integration.description}</p>
          ) : null}
          <a
            className={styles.integrationLink}
            href={integration.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {integration.url}
          </a>
        </li>
      ))}
    </ul>
  );
}
