/**
 * features-v2/public-hub / PublicHubView — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * Owner-agnostic Public Hub renderer. Composes a hero + per-module slot
 * sections from the public-hub mock adapter, which itself reads enablement
 * from the modules mock adapter. No `@server/*` imports.
 *
 * When no modules are enabled, the view renders an explicit empty state
 * instead of an empty page.
 */
import { useEffect, useState } from "react";
import type { HubModuleSlotUi, HubViewUiDTO, ModuleOwnerType } from "./types";
import { publicHubMockAdapter } from "./mock-adapter";
import { TopicsSlot } from "./slots/TopicsSlot";
import { EventsSlot } from "./slots/EventsSlot";
import { IntegrationsSlot } from "./slots/IntegrationsSlot";
import { NewsletterChatSlot } from "./slots/NewsletterChatSlot";
import styles from "./PublicHub.module.css";

type PublicHubViewProps = {
  ownerType: ModuleOwnerType;
  ownerId: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; hub: HubViewUiDTO };

function renderSlotBody(slot: HubModuleSlotUi) {
  switch (slot.key) {
    case "topics":
      return <TopicsSlot topics={slot.topics} />;
    case "events":
      return <EventsSlot events={slot.events} />;
    case "integrations":
      return <IntegrationsSlot integrations={slot.integrations} />;
    case "newsletter_chat":
      return <NewsletterChatSlot newsletterChats={slot.newsletterChats} />;
    case "channel_entry":
      return (
        <p className={styles.empty}>
          Społeczność udostępnia tu kanały — szczegóły w widoku kanałów.
        </p>
      );
    default: {
      const _exhaustive: never = slot;
      void _exhaustive;
      return null;
    }
  }
}

const ICON_LETTER: Record<HubModuleSlotUi["key"], string> = {
  topics: "T",
  events: "W",
  integrations: "I",
  newsletter_chat: "N",
  channel_entry: "K",
};

export function PublicHubView({ ownerType, ownerId }: PublicHubViewProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    void (async () => {
      const res =
        ownerType === "profile"
          ? await publicHubMockAdapter.getProfileHub(ownerId)
          : await publicHubMockAdapter.getCommunityHub(ownerId);
      if (!alive) return;
      if (!res.ok) {
        setState({ status: "error", message: res.error.message });
      } else {
        setState({ status: "ready", hub: res.value });
      }
    })();
    return () => {
      alive = false;
    };
  }, [ownerType, ownerId]);

  if (state.status === "loading") {
    return <div className={styles.loading} aria-busy="true">Ładowanie Public Hub…</div>;
  }
  if (state.status === "error") {
    return <div className={styles.error} role="alert">{state.message}</div>;
  }

  const { hub } = state;
  const kicker = ownerType === "profile" ? "Profil osobisty" : "Społeczność";

  return (
    <section className={styles.root} aria-labelledby="hub-heading">
      <header className={styles.hero}>
        <p className={styles.heroKicker}>{kicker} · Public Hub</p>
        <h1 id="hub-heading" className={styles.heroTitle}>{hub.owner.displayName}</h1>
        {hub.owner.handle ? (
          <p className={styles.heroHandle}>@{hub.owner.handle}</p>
        ) : null}
        <span
          className={
            hub.owner.visibility === "public"
              ? styles.heroVisibility
              : `${styles.heroVisibility} ${styles.heroVisibilityPrivate}`
          }
        >
          {hub.owner.visibility === "public" ? "Publiczny" : "Prywatny"}
        </span>
      </header>

      {!hub.hasModulesEnabled ? (
        <div className={styles.bigEmpty} role="status">
          {ownerType === "profile"
            ? "Ten profil nie ma jeszcze włączonych modułów."
            : "Ta społeczność nie ma jeszcze włączonych modułów."}
        </div>
      ) : (
        hub.slots.map((slot) => (
          <article key={slot.key} className={styles.slot} role="region" aria-label={slot.name}>
            <div className={styles.slotHead}>
              <span className={styles.slotIcon} aria-hidden="true">{ICON_LETTER[slot.key]}</span>
              <div>
                <h2 className={styles.slotTitle}>{slot.name}</h2>
                <p className={styles.slotDesc}>{slot.description}</p>
              </div>
            </div>
            {renderSlotBody(slot)}
          </article>
        ))
      )}
    </section>
  );
}
