/**
 * app-v2/manage/ManageSectionRoute — generic owner-only route shell for
 * per-section "Wkrótce / PARTIAL" pages under /manage/* (Slice 21).
 *
 * Used by the 10 sub-routes that don't yet have a dedicated editor wired:
 * account, privacy, contact, friends, notifications, media, workplaces,
 * modules, channels, communities, security. Each one is a truthful shell
 * with a back-link to the dashboard, a runtime status note and existing
 * links to the underlying feature (e.g. /contacts/requests for "contact").
 *
 * IMPORTANT: this is NOT the dashboard. The dashboard is at /manage.
 */
import { Link } from "react-router-dom";
import type { ReactElement, ReactNode } from "react";
import { AppShell } from "../navigation/AppShell";
import card from "@client/features-v2/manage/Manage.module.css";
import {
  ContactConsentsPanel,
  NotificationsEditorPanel,
  PrivacyEditorPanel,
} from "@client/features-v2/manage";

const DEMO_VIEWER_ID = "u-viewer";

interface ManageSectionRouteProps {
  title: string;
  description: string;
  statusNote: string;
  related?: readonly { label: string; to: string }[];
  children?: ReactNode;
}

export function ManageSectionRoute({
  title,
  description,
  statusNote,
  related,
  children,
}: ManageSectionRouteProps): ReactElement {
  return (
    <AppShell active="zarzadzaj" viewerUserId={DEMO_VIEWER_ID}>
      <section className={card.simpleShell} aria-labelledby="manage-section-title">
        <Link to="/manage">← Wróć do panelu Zarządzaj</Link>
        <h1 id="manage-section-title">{title}</h1>
        <p>{description}</p>
        <span className={card.runtimeBadge} role="note">{statusNote}</span>
        {children}
        {related && related.length > 0 ? (
          <nav aria-label="Powiązane miejsca">
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {related.map((r) => (
                <li key={r.to}>
                  <Link to={r.to}>{r.label} →</Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </section>
    </AppShell>
  );
}

export function ManageAccountRoute() {
  return (
    <ManageSectionRoute
      title="Konto"
      description="Nazwa profilu, login, adres e-mail konta, status konta i preferencje. Po podpięciu transportu pojawi się pełna edycja."
      statusNote="Tryb demo — edycja konta po podpięciu transportu (PARTIAL)"
    />
  );
}

export function ManagePrivacyRoute() {
  return (
    <ManageSectionRoute
      title="Prywatność"
      description="Widoczność profilu, warstwy zawodowej, Public Hub, podglądu feedu i miejsc pracy. Każde pole ma niezależny poziom widoczności (publiczne / tylko znajomi / prywatne)."
      statusNote="Tryb demo — zmiany aplikują się natychmiast lokalnie; po podpięciu transportu zostaną zapisane na serwerze"
      related={[{ label: "Profil osobisty (dane i kontakt)", to: "/manage/profil-osobisty" }]}
    >
      <PrivacyEditorPanel />
    </ManageSectionRoute>
  );
}

export function ManageContactRoute() {
  return (
    <ManageSectionRoute
      title="Kontakt i zgody kontaktowe"
      description="Komu udostępniasz e-mail i telefon. Znajomość ≠ dostęp do kontaktu — każda osoba musi mieć osobną, zaakceptowaną zgodę."
      statusNote="Tryb demo — zatwierdzanie/odrzucanie działa lokalnie; po podpięciu transportu zostanie zapisane"
      related={[
        { label: "Prośby kontaktowe", to: "/contacts/requests" },
        { label: "Lista kontaktów", to: "/contacts" },
        { label: "Profil osobisty (pola kontaktowe)", to: "/manage/profil-osobisty" },
      ]}
    >
      <ContactConsentsPanel />
    </ManageSectionRoute>
  );
}

export function ManageFriendsRoute() {
  return (
    <ManageSectionRoute
      title="Znajomi i blokady"
      description="Lista znajomych, zaproszenia wysłane i odebrane oraz lista zablokowanych użytkowników. Blokada cofnięta tutaj nie cofa zgody kontaktowej automatycznie."
      statusNote="Tryb demo — pełna edycja blokad po podpięciu transportu (PARTIAL)"
      related={[
        { label: "Znajomi", to: "/friends" },
        { label: "Zaproszenia", to: "/friends/requests" },
      ]}
    />
  );
}

export function ManageNotificationsRoute() {
  return (
    <ManageSectionRoute
      title="Powiadomienia"
      description="Kategorie powiadomień in-app: feed znajomych, społeczności, kanały, profil zawodowy, moduły, system. E-mail i push pojawią się po podpięciu transportu."
      statusNote="Tryb demo — togglowanie in-app działa lokalnie; e-mail/push wymaga transportu"
      related={[{ label: "Centrum aktywności", to: "/notifications" }]}
    >
      <NotificationsEditorPanel />
    </ManageSectionRoute>
  );
}

export function ManageMediaRoute() {
  return (
    <ManageSectionRoute
      title="Media"
      description="Avatar, baner i media profilu. Upload przez pipeline media-v2 (typed upload intents, bez inline byte encoding). Zdjęcie i baner edytujesz na profilu osobistym; tutaj zobaczysz listę i statusy."
      statusNote="Tryb demo — zarządzanie mediami po podpięciu transportu (PARTIAL)"
      related={[{ label: "Edytuj na profilu", to: "/profile" }]}
    />
  );
}

export function ManageWorkplacesRoute() {
  return (
    <ManageSectionRoute
      title="Miejsca pracy"
      description="Aktywne i archiwalne miejsca pracy ownera. Każde miejsce pracy ma własny mikro-feed i mini-teasery, ale NIE jest społecznością."
      statusNote="Tryb demo — lista i edycja po podpięciu transportu (PARTIAL)"
      related={[
        { label: "Dodaj miejsce pracy", to: "/manage/profile/workplaces/new" },
      ]}
    />
  );
}

export function ManageModulesRoute() {
  return (
    <ManageSectionRoute
      title="Moduły profilu (Public Hub)"
      description="Włączone moduły profilu (tematy, wydarzenia, integracje, newsletter chatowy) i widoczność Public Hub. Moduły społeczności zarządzasz w kontekście danej społeczności."
      statusNote="Tryb demo — zarządzanie modułami po podpięciu transportu (PARTIAL)"
    />
  );
}

export function ManageChannelsRoute() {
  return (
    <ManageSectionRoute
      title="Kanały"
      description="Kanały, które prowadzisz, i kanały, które obserwujesz. Zarządzanie pojedynczym kanałem dostępne ze strony kanału."
      statusNote="Tryb demo — zarządzanie kanałami po podpięciu transportu (PARTIAL)"
      related={[{ label: "Wszystkie kanały", to: "/channels" }]}
    />
  );
}

export function ManageCommunitiesRoute() {
  return (
    <ManageSectionRoute
      title="Społeczności zarządzane"
      description="Społeczności, w których jesteś założycielem, adminem lub moderatorem. Pełne zarządzanie społecznością odbywa się na jej własnej karcie /communities/:slug/manage."
      statusNote="Tryb demo — lista i linki po podpięciu transportu (PARTIAL)"
      related={[{ label: "Wszystkie społeczności", to: "/communities" }]}
    />
  );
}

export function ManageSecurityRoute() {
  return (
    <ManageSectionRoute
      title="Bezpieczeństwo i sesje"
      description="Aktywne sesje, ostatnie logowanie, dwuetapowa weryfikacja. Moduł foundation — pojawi się po podpięciu transportu Supabase Auth + backendu sesji."
      statusNote="W przygotowaniu — moduł wymaga transportu Supabase Auth + backendu sesji"
    />
  );
}
