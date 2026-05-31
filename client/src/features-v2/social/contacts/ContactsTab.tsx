/**
 * features-v2/social/contacts / ContactsTab — UI shell.
 *
 * Status: UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * Renders the legacy eight-section view (Wszyscy / Kontakty / Specjaliści /
 * Bliżsi znajomi / Dalsi znajomi / Bliska rodzina / Dalsza rodzina / Prośby)
 * on top of the in-process mock adapter. The circle tabs are owner-local
 * labels — switching a person's circle changes only how MY list groups them;
 * it grants no consent and reveals no PII. No `@server/*` imports; no native
 * alert/confirm dialogs; every action wires to the adapter.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import type {
  ContactListItemDTO,
  ContactPersonSummary,
  ContactsTabData,
  FriendCircle,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import { contactsMockAdapter } from "./mock-adapter";
import { PeopleList } from "./ContactsLists";
import { RequestsList } from "./ContactsRequestsList";
import {
  ContactsTabBar,
  type ContactsTabKey,
} from "./ContactsTabBar";
import { ContactsContentPanel, ContactsHero } from "./ContactsTabLayout";
import { ContactsInteractionLayer } from "./ContactsInteractionLayer";
import { useContactInteractions } from "./useContactInteractions";
import styles from "./ContactsTab.module.css";

export type ContactsTabProps = {
  /** The signed-in viewer; in MOCK_LOCAL_ONLY this is a fixed demo id. */
  viewerId: UserId;
};

const EMPTY: Record<ContactsTabKey, { emoji: string; title: string; body: string }> = {
  all: { emoji: "👥", title: "Brak kontaktów", body: "Dodaj osoby do swojej listy kontaktów." },
  contacts: { emoji: "📇", title: "Brak zapisanych kontaktów", body: "Dodaj osoby do kontaktów aby mieć szybki dostęp do ich profilu." },
  specialists: { emoji: "🩺", title: "Brak specjalistów", body: "Dodaj specjalistów z wyszukiwarki." },
  close_friend: { emoji: "⭐", title: "Brak bliższych znajomych", body: "Oznacz bliższych znajomych, aby mieć ich pod ręką." },
  distant_friend: { emoji: "🙂", title: "Brak dalszych znajomych", body: "Tu pojawią się dalsi znajomi." },
  close_family: { emoji: "❤️", title: "Brak bliskiej rodziny", body: "Oznacz osoby jako bliska rodzina." },
  distant_family: { emoji: "💜", title: "Brak dalszej rodziny", body: "Oznacz osoby jako dalsza rodzina." },
  requests: { emoji: "📥", title: "Brak nowych próśb", body: "Tu pojawią się prośby o kontakt." },
};

function itemsForTab(
  items: readonly ContactListItemDTO[],
  tab: ContactsTabKey,
): ContactListItemDTO[] {
  if (tab === "all") return [...items];
  if (tab === "contacts") return items.filter((i) => i.isAddressBookContact);
  if (tab === "specialists") return items.filter((i) => i.isSpecialist);
  return items.filter((i) => i.friendCircle === tab);
}

function computeCounts(
  items: readonly ContactListItemDTO[],
  tabData: ContactsTabData | null,
): Record<ContactsTabKey, number> {
  const c = (circle: FriendCircle) => items.filter((i) => i.friendCircle === circle).length;
  return {
    all: items.length,
    contacts: items.filter((i) => i.isAddressBookContact).length,
    specialists: items.filter((i) => i.isSpecialist).length,
    close_friend: c("close_friend"),
    distant_friend: c("distant_friend"),
    close_family: c("close_family"),
    distant_family: c("distant_family"),
    requests: tabData
      ? tabData.incomingContactRequests.length + tabData.incomingFriendRequests.length
      : 0,
  };
}

export function ContactsTab({ viewerId }: ContactsTabProps): ReactElement {
  const [items, setItems] = useState<ContactListItemDTO[]>([]);
  const [tabData, setTabData] = useState<ContactsTabData | null>(null);
  const [activeTab, setActiveTab] = useState<ContactsTabKey>("all");
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [list, data] = await Promise.all([
        contactsMockAdapter.getContactList(viewerId),
        contactsMockAdapter.getContactsTabData(viewerId),
      ]);
      setItems(list);
      setTabData(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Nieznany błąd");
    }
  }, [viewerId]);

  const interactions = useContactInteractions(viewerId, tabData, refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const counts = useMemo(() => computeCounts(items, tabData), [items, tabData]);
  const nameOf = useMemo(() => {
    const map = new Map<UserId, ContactPersonSummary>();
    for (const it of items) map.set(it.person.userId, it.person);
    return (id: UserId): ContactPersonSummary =>
      map.get(id) ?? {
        userId: id,
        displayName: String(id),
        handle: String(id).replace(/^u-?/, ""),
        avatarInitial: String(id).replace(/^u-?/, "").slice(0, 1).toUpperCase() || "?",
      };
  }, [items]);

  if (loadError) {
    return (
      <div className={styles.errorState} role="alert">
        Nie udało się załadować listy kontaktów: {loadError}
      </div>
    );
  }
  if (!tabData) {
    return (
      <div className={styles.loadingState} aria-busy="true">
        Ładowanie kontaktów…
      </div>
    );
  }
  const requestCount =
    tabData.incomingContactRequests.length + tabData.incomingFriendRequests.length;
  const dashboardStats = [
    { key: "contacts", value: counts.contacts, label: "Kontakty" },
    { key: "specialists", value: counts.specialists, label: "Specjaliści" },
    { key: "friends", value: items.filter((i) => i.isMutualFriend).length, label: "Znajomi" },
    { key: "family", value: counts.close_family + counts.distant_family, label: "Rodzina" },
    { key: "requests", value: requestCount, label: "Prośby" },
  ];

  return (
    <section className={styles.root} aria-labelledby="contacts-heading">
      <ContactsHero stats={dashboardStats} />

      <ContactsTabBar activeTab={activeTab} counts={counts} onSelect={setActiveTab} />

      <ContactsContentPanel activeTab={activeTab} counts={counts}>
        {activeTab === "requests" ? (
          <RequestsList
            data={tabData}
            nameOf={nameOf}
            onAcceptOpen={interactions.openAccept}
            onReject={async (req) => {
              await contactsMockAdapter.respondToContactRequest({
                requestId: req.id,
                responderId: viewerId,
                action: "rejected",
              });
              await refresh();
            }}
          />
        ) : (
          <PeopleList
            items={itemsForTab(items, activeTab)}
            empty={EMPTY[activeTab]}
            onOpen={interactions.openDetail}
            onRemoveContact={async (id) => {
              await contactsMockAdapter.removeAddressBookContact(viewerId, id);
              await refresh();
            }}
            onRemoveSpecialist={async (id) => {
              await contactsMockAdapter.removeSpecialist(viewerId, id);
              await refresh();
            }}
            onSetCircle={async (id, circle) => {
              await contactsMockAdapter.setFriendCircle(viewerId, id, circle);
              await refresh();
            }}
          />
        )}
      </ContactsContentPanel>

      <ContactsInteractionLayer viewerId={viewerId} interactions={interactions} />
    </section>
  );
}
