/**
 * features-v2/channels / ChannelSection — one section in the directory page
 * (Obserwowane / Moich społeczności / Prowadzę / Odkrywaj).
 */
import type { ChannelCardDTO } from "@shared/contracts/channels";
import { ChannelCard } from "./ChannelCard";
import styles from "./Channels.module.css";

type Props = {
  title: string;
  subtitle: string;
  emptyMessage: string;
  channels: readonly ChannelCardDTO[];
  trailing?: React.ReactNode;
};

export function ChannelSection({ title, subtitle, emptyMessage, channels, trailing }: Props) {
  return (
    <section className={styles.section} aria-labelledby={`section-${title}`}>
      <header className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle} id={`section-${title}`}>{title}</h2>
          <p className={styles.sectionSubtitle}>{subtitle}</p>
        </div>
        {trailing}
        {channels.length > 0 ? <span className={styles.sectionMeta}>{channels.length}</span> : null}
      </header>
      {channels.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <div className={styles.grid}>
          {channels.map((c) => (
            <ChannelCard key={c.id} channel={c} />
          ))}
        </div>
      )}
    </section>
  );
}
