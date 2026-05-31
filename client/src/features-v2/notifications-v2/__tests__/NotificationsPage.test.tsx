// UI_ONLY: uses React Testing Library `findAll*` / `getAll*` helpers; no runtime list APIs.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";
import { NotificationsPage } from "../NotificationsPage";
import { __resetNotificationsMockAdapterForTests, notificationsMockAdapter } from "../mock-adapter";

function renderPage() {
  return render(
    <MemoryRouter>
      <NotificationsPage viewerUserId="u-viewer" onNavigate={() => undefined} />
    </MemoryRouter>,
  );
}

describe("features-v2/notifications-v2 — NotificationsPage", () => {
  beforeEach(() => {
    __resetNotificationsMockAdapterForTests();
  });

  test("renders the Activity Center header and filter tabs", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: /Powiadomienia/ })).toBeInTheDocument();
    expect(screen.getByText(/Zobacz, co wydarzyło się/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Wszystkie/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nieprzeczytane/ })).toBeInTheDocument();
  });

  test("renders seeded notification cards (real data from the adapter)", async () => {
    renderPage();
    await waitFor(() => {
      const cards = screen.getAllByTestId("notification-card");
      expect(cards.length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/Ada skomentowała Twój wpis/)).toBeInTheDocument();
    expect(screen.getByText(/Zaproszenie do społeczności/)).toBeInTheDocument();
  });

  test("'Mark all as read' clears the unread chip", async () => {
    renderPage();
    const markAll = await screen.findByRole("button", { name: /Oznacz wszystkie jako przeczytane/ });
    fireEvent.click(markAll);
    await waitFor(() => {
      expect(markAll).toBeDisabled();
    });
  });

  test("filtering to a single category shows only that category", async () => {
    renderPage();
    await screen.findAllByTestId("notification-card");
    fireEvent.click(screen.getByRole("button", { name: /^Społeczności/ }));
    await waitFor(() => {
      expect(screen.getByText(/Zaproszenie do społeczności/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Kuba polubił/)).not.toBeInTheDocument();
  });

  test("settings panel toggle disables a category (no fake save)", async () => {
    renderPage();
    const toggle = await screen.findAllByRole("button", { name: /Włączone|Wyłączone/ });
    expect(toggle.length).toBeGreaterThan(0);
    fireEvent.click(toggle[0]);
    await waitFor(() => {
      const updated = screen.getAllByRole("button", { name: /Wyłączone/ });
      expect(updated.length).toBeGreaterThan(0);
    });
    // Confirm the adapter actually persisted the setting.
    const stored = await notificationsMockAdapter.getSettings("u-viewer");
    expect(stored.ok).toBe(true);
    if (stored.ok) {
      const disabled = stored.value.categories.filter((c) => !c.inAppEnabled);
      expect(disabled.length).toBeGreaterThan(0);
    }
  });

  test("notification card titles contain no PII (no @ characters)", async () => {
    renderPage();
    const cards = await screen.findAllByTestId("notification-card");
    for (const card of cards) {
      expect(card.textContent).not.toMatch(/@/);
    }
  });

  test("empty filter view shows an honest empty state", async () => {
    renderPage();
    await screen.findAllByTestId("notification-card");
    const markAll = screen.getByRole("button", { name: /Oznacz wszystkie jako przeczytane/ });
    fireEvent.click(markAll);
    await waitFor(() => expect(markAll).toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: /Nieprzeczytane/ }));
    expect(await screen.findByText(/Nic do pokazania/)).toBeInTheDocument();
  });
});
