// UI_ONLY: uses React Testing Library `findAll*` helpers; no runtime list APIs.
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { PersonalProfilePage } from "../PersonalProfilePage";
import { __resetPersonalProfileMockForTests } from "../mock-adapter";

function renderPage(viewerUserId: string | null, profileUsername: string) {
  return render(
    <MemoryRouter>
      <PersonalProfilePage
        viewerUserId={viewerUserId}
        profileUsername={profileUsername}
        onNavigate={() => undefined}
      />
    </MemoryRouter>,
  );
}

describe("PersonalProfilePage — unified owner/viewer screen", () => {
  beforeEach(() => {
    __resetPersonalProfileMockForTests();
  });

  afterEach(() => {
    cleanup();
  });

  test("owner mode: subtle edit pills, no relation CTA", async () => {
    renderPage("u-viewer", "viewer");
    expect(await screen.findByRole("heading", { name: /Marek Viewer/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Edytuj baner/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Edytuj awatar/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zarządzaj profilem/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Dodaj do znajomych/ })).not.toBeInTheDocument();
  });

  test("friend mode: friend-visible contact fields, no edit pills, friends pill", async () => {
    renderPage("u-viewer", "ada");
    await screen.findByRole("heading", { name: /Ada Lovelace/ });
    expect(screen.queryByRole("button", { name: /Edytuj awatar/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Znajomi/)).toBeInTheDocument();
    expect(screen.getByText(/@ada\.lovelace/)).toBeInTheDocument();
    expect(screen.queryByText(/ada@example\.com/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+48 700 000 700/)).not.toBeInTheDocument();
  });

  test("stranger mode: 'Dodaj do znajomych' CTA + 'Poproś o kontakt'", async () => {
    renderPage("u-viewer", "kuba");
    await screen.findByRole("heading", { name: /Kuba Demo/ });
    expect(screen.getByRole("button", { name: /Dodaj do znajomych/ })).toBeInTheDocument();
    const reqButtons = screen.getAllByRole("button", { name: /Poproś o kontakt/ });
    expect(reqButtons.length).toBeGreaterThan(0);
    expect(screen.queryByText(/kuba@example\.com/)).not.toBeInTheDocument();
  });

  test("stranger -> sending friend request flips the CTA to 'Zaproszenie wysłane'", async () => {
    renderPage("u-viewer", "kuba");
    const send = await screen.findByRole("button", { name: /Dodaj do znajomych/ });
    fireEvent.click(send);
    await waitFor(() => {
      expect(screen.getByText(/Zaproszenie wysłane/)).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /Dodaj do znajomych/ })).not.toBeInTheDocument();
  });

  test("private profile: restricted state for non-owner viewer", async () => {
    renderPage("u-viewer", "private");
    const banner = await screen.findByTestId("profile-error-state");
    expect(banner.getAttribute("data-code")).toBe("PROFILE_RESTRICTED");
  });

  test("not-found profile: friendly not-found state", async () => {
    renderPage("u-viewer", "no-such-username");
    const banner = await screen.findByTestId("profile-error-state");
    expect(banner.getAttribute("data-code")).toBe("PROFILE_NOT_FOUND");
  });

  test("unauthenticated viewer: login CTA in hero, no friend-feed preview", async () => {
    renderPage(null, "ada");
    await screen.findByRole("heading", { name: /Ada Lovelace/ });
    expect(screen.getByRole("link", { name: /Zaloguj się/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Dodaj do znajomych/ })).not.toBeInTheDocument();
  });

  test("workplaces section hides friends_only / private from strangers", async () => {
    renderPage("u-viewer", "kuba");
    await screen.findByRole("heading", { name: /Miejsca pracy/ });
    expect(screen.getByText(/Kuba Code/)).toBeInTheDocument();
    expect(screen.queryByText(/Sekret/)).not.toBeInTheDocument();
  });

  test("owner sees the 'Dodaj miejsce pracy' CTA", async () => {
    renderPage("u-viewer", "viewer");
    expect(await screen.findByRole("button", { name: /Dodaj miejsce pracy/ })).toBeInTheDocument();
  });

  test("owner profile wires important events and presentation publishing sections", async () => {
    renderPage("u-viewer", "viewer");
    expect(await screen.findByRole("heading", { name: /Ważne wydarzenia i prezentacja/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Ważne wydarzenie$/ })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: /^Prezentacja profilu$/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("w przygotowaniu").length).toBeGreaterThanOrEqual(2);
  });

  test("viewer profile sees public empty states, not profile publishing composers", async () => {
    renderPage("u-viewer", "kuba");
    expect(await screen.findByText(/Ten profil nie ma jeszcze publicznych ważnych wydarzeń/)).toBeInTheDocument();
    expect(screen.getByText(/Ten profil nie ma jeszcze publicznej prezentacji/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Zapisz wydarzenie/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Zapisz sekcję/ })).not.toBeInTheDocument();
  });

  test("stranger does not see 'Dodaj miejsce pracy'", async () => {
    renderPage("u-viewer", "kuba");
    await screen.findByRole("heading", { name: /Miejsca pracy/ });
    expect(screen.queryByRole("button", { name: /Dodaj miejsce pracy/ })).not.toBeInTheDocument();
  });

  test("Public Hub: owner sees Zarządzaj modułami", async () => {
    renderPage("u-viewer", "viewer");
    expect(await screen.findByRole("button", { name: /Zarządzaj modułami/ })).toBeInTheDocument();
  });

  test("Public Hub: viewer does not see Zarządzaj modułami", async () => {
    renderPage("u-viewer", "kuba");
    await screen.findByRole("heading", { name: /Public Hub/ });
    expect(screen.queryByRole("button", { name: /Zarządzaj modułami/ })).not.toBeInTheDocument();
  });

  test("channels entry routes to /channels and shows real count (not fake)", async () => {
    renderPage("u-viewer", "kuba");
    await screen.findByRole("heading", { name: /Kanały tej osoby/ });
    expect(screen.getByText(/Brak publicznych kanałów/)).toBeInTheDocument();
  });

  test("friend feed preview: stranger sees restricted state copy", async () => {
    renderPage("u-viewer", "kuba");
    await screen.findByRole("heading", { name: /Kuba Demo/ });
    expect(screen.getByText(/musisz być w gronie znajomych/)).toBeInTheDocument();
  });

  test("friend feed preview: friend sees the embedded preview heading", async () => {
    renderPage("u-viewer", "ada");
    await screen.findByRole("heading", { name: /Ada Lovelace/ });
    expect(await screen.findByRole("heading", { name: /Feed znajomych/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Zobacz więcej/ })).toHaveAttribute("href", "/friends-feed");
  });

  test("DOM never contains owner email/phone when viewer is stranger", async () => {
    renderPage("u-viewer", "ada");
    await screen.findByRole("heading", { name: /Ada Lovelace/ });
    const text = document.body.textContent ?? "";
    expect(text).not.toContain("ada@example.com");
    expect(text).not.toContain("+48 700 000 700");
  });
});
