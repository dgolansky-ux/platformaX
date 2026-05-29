/**
 * features-v2/social/contacts / ContactsTab — UI shell.
 *
 * Status: UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * Renders the four sections (Znajomi / Kontakty / Specjaliści / Prośby) on
 * top of the in-process mock adapter. No `@server/*` imports; no native
 * alert/confirm dialogs; no no-op buttons — every action wires to the
 * adapter or to a documented `disabled` state. The four list components
 * and the accept-fields modal live in sibling files so the orchestrator
 * stays under the per-file size budget.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import type { ContactRequest, ContactsTabData } from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import { contactsMockAdapter } from "./mock-adapter";
import {
  ContactList,
  FriendList,
  RequestsList,
  SpecialistList,
} from "./ContactsLists";
import { AcceptContactRequestModal } from "./AcceptContactRequestModal";
import styles from "./ContactsTab.module.css";

type TabKey = "friends" | "contacts" | "specialists" | "requests";

type AcceptModalState = { request: ContactRequest } | null;

export type ContactsTabProps = {
  /** The signed-in viewer; in MOCK_LOCAL_ONLY this is a fixed demo id. */
  viewerId: UserId;
};

const TAB_LABELS: Record<TabKey, string> = {
  friends: "Znajomi",
  contacts: "Kontakty",
  specialists: "Specjaliści",
  requests: "Prośby",
};

export function ContactsTab({ viewerId }: ContactsTabProps): ReactElement {
  const [data, setData] = useState<ContactsTabData | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("friends");
  const [acceptModal, setAcceptModal] = useState<AcceptModalState>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await contactsMockAdapter.getContactsTabData(viewerId);
      setData(next);
      setLoadError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nieznany błąd";
      setLoadError(message);
    }
  }, [viewerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const counts = useMemo(() => {
    if (!data) return { friends: 0, contacts: 0, specialists: 0, requests: 0 };
    return {
      friends: data.friends.length,
      contacts: data.contacts.length,
      specialists: data.specialists.length,
      requests:
        data.incomingContactRequests.length +
        data.incomingFriendRequests.length,
    };
  }, [data]);

  if (loadError) {
    return (
      <div className={styles.errorState} role="alert">
        Nie udało się załadować listy kontaktów: {loadError}
      </div>
    );
  }
  if (!data) {
    return (
      <div className={styles.loadingState} aria-busy="true">
        Ładowanie kontaktów…
      </div>
    );
  }

  return (
    <section className={styles.root} aria-labelledby="contacts-heading">
      <header className={styles.header}>
        <h1 id="contacts-heading" className={styles.title}>
          Kontakty
        </h1>
        <p className={styles.modeNote} title="MOCK_LOCAL_ONLY — patrz README.md">
          UI_SHELL_ONLY — backend mock
        </p>
      </header>

      <nav className={styles.tabs} role="tablist" aria-label="Sekcje kontaktów">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            className={
              activeTab === key
                ? `${styles.tab} ${styles.tabActive}`
                : styles.tab
            }
            onClick={() => setActiveTab(key)}
          >
            {TAB_LABELS[key]}
            {counts[key] > 0 ? (
              <span className={styles.tabBadge}>{counts[key]}</span>
            ) : null}
          </button>
        ))}
      </nav>

      {activeTab === "friends" ? (
        <FriendList data={data} />
      ) : activeTab === "contacts" ? (
        <ContactList
          data={data}
          onRemove={async (contactId) => {
            await contactsMockAdapter.removeAddressBookContact(viewerId, contactId);
            await refresh();
          }}
        />
      ) : activeTab === "specialists" ? (
        <SpecialistList
          data={data}
          onRemove={async (specialistId) => {
            await contactsMockAdapter.removeSpecialist(viewerId, specialistId);
            await refresh();
          }}
        />
      ) : (
        <RequestsList
          data={data}
          onAcceptOpen={(req) => setAcceptModal({ request: req })}
          onReject={async (req) => {
            await contactsMockAdapter.respondToContactRequest({
              requestId: req.id,
              responderId: viewerId,
              action: "rejected",
            });
            await refresh();
          }}
        />
      )}

      {acceptModal ? (
        <AcceptContactRequestModal
          request={acceptModal.request}
          viewerId={viewerId}
          onClose={() => setAcceptModal(null)}
          onSubmit={async (approvedFields) => {
            await contactsMockAdapter.respondToContactRequest({
              requestId: acceptModal.request.id,
              responderId: viewerId,
              action: "accepted",
              approvedFields,
            });
            setAcceptModal(null);
            await refresh();
          }}
        />
      ) : null}
    </section>
  );
}
