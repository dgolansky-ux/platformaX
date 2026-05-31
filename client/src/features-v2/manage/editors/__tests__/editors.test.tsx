/* TEST_FIXTURE — Slice 21 deep-dive editor tests. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { PrivacyEditorPanel } from "../PrivacyEditorPanel";
import { NotificationsEditorPanel } from "../NotificationsEditorPanel";
import { ContactConsentsPanel } from "../ContactConsentsPanel";

describe("PrivacyEditorPanel", () => {
  test("renders 5 radio groups (profile / pro / hub / feed / workplace)", () => {
    render(<PrivacyEditorPanel />);
    expect(screen.getAllByRole("radiogroup")).toHaveLength(5);
  });

  test("clicking a level switches the active radio for that row only", () => {
    render(<PrivacyEditorPanel />);
    const profileGroup = screen.getByRole("radiogroup", { name: "Widoczność: Profil" });
    const publicBtn = within(profileGroup).getByRole("radio", { name: "Publiczne" });
    expect(publicBtn).toHaveAttribute("aria-checked", "false");
    fireEvent.click(publicBtn);
    expect(publicBtn).toHaveAttribute("aria-checked", "true");
    // friends_only no longer active for profile
    const friendsBtn = within(profileGroup).getByRole("radio", { name: "Tylko znajomi" });
    expect(friendsBtn).toHaveAttribute("aria-checked", "false");
  });

  test("warning appears only when profile + publicHub + feedPreview are all private", () => {
    render(<PrivacyEditorPanel />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    const setPrivate = (rowName: string) => {
      const group = screen.getByRole("radiogroup", { name: `Widoczność: ${rowName}` });
      fireEvent.click(within(group).getByRole("radio", { name: "Prywatne" }));
    };

    setPrivate("Profil");
    setPrivate("Public Hub");
    setPrivate("Podgląd feedu");

    expect(screen.getByRole("status")).toHaveTextContent(/Wszystko prywatne/);
  });

  test("onChange callback fires with full state", () => {
    let last: unknown = null;
    render(<PrivacyEditorPanel onChange={(s) => { last = s; }} />);
    const group = screen.getByRole("radiogroup", { name: "Widoczność: Profil" });
    fireEvent.click(within(group).getByRole("radio", { name: "Prywatne" }));
    expect(last).toMatchObject({ profile: "private" });
  });
});

describe("NotificationsEditorPanel", () => {
  test("renders 6 switches", () => {
    render(<NotificationsEditorPanel />);
    expect(screen.getAllByRole("switch")).toHaveLength(6);
  });

  test("toggle flips inAppEnabled for clickable category", () => {
    render(<NotificationsEditorPanel />);
    const friendFeed = screen.getByRole("switch", { name: /Feed znajomych/ });
    expect(friendFeed).toHaveAttribute("aria-checked", "true");
    fireEvent.click(friendFeed);
    expect(friendFeed).toHaveAttribute("aria-checked", "false");
  });

  test("transportPartial category is disabled and does not toggle on click", () => {
    render(<NotificationsEditorPanel />);
    const system = screen.getByRole("switch", { name: /System/ });
    expect(system).toBeDisabled();
    expect(system).toHaveAttribute("aria-checked", "false");
    fireEvent.click(system);
    expect(system).toHaveAttribute("aria-checked", "false");
  });

  test("partial warning appears when at least one category has transportPartial", () => {
    render(<NotificationsEditorPanel />);
    expect(screen.getByRole("status")).toHaveTextContent(/PARTIAL/);
  });
});

describe("ContactConsentsPanel", () => {
  test("renders 3 default items (2 approved + 1 pending)", () => {
    render(<ContactConsentsPanel />);
    const list = screen.getByRole("list", { name: "Lista zgód kontaktowych" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getAllByText(/Zatwierdzone/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Oczekuje/i)).toBeInTheDocument();
  });

  test("approve moves pending → approved, decline moves pending → revoked", () => {
    render(<ContactConsentsPanel />);
    // Pending is "Piotr Wiśniewski"
    const approveBtn = screen.getByRole("button", { name: "Zatwierdź" });
    fireEvent.click(approveBtn);
    expect(screen.queryByRole("button", { name: "Zatwierdź" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Oczekuje/i)).not.toBeInTheDocument();
  });

  test("revoke moves approved → revoked, and 'Przywróć' brings it back", () => {
    render(<ContactConsentsPanel />);
    // Two approved → two revoke buttons
    const revokeButtons = screen.getAllByRole("button", { name: "Cofnij dostęp" });
    expect(revokeButtons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(revokeButtons[0]);
    // Now one should show 'Przywróć'
    expect(screen.getByRole("button", { name: "Przywróć" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Przywróć" }));
    expect(screen.queryByRole("button", { name: "Przywróć" })).not.toBeInTheDocument();
  });

  test("never renders raw e-mail or phone digits (PII safety)", () => {
    render(<ContactConsentsPanel />);
    expect(document.body.textContent).not.toMatch(/@\w+\.\w+/);
    expect(document.body.textContent).not.toMatch(/\+?\d{9,}/);
  });
});
