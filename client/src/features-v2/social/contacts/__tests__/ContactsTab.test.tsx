import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { ContactsTab } from "../ContactsTab";
import { contactsMockAdapter } from "../mock-adapter";
import { toUserId } from "@shared/contracts/branded-ids";

const VIEWER = toUserId("u-mock-alice");

function renderTab() {
  return render(<ContactsTab viewerId={VIEWER} />);
}

describe("ContactsTab — eight owner-local sections", () => {
  beforeEach(() => {
    contactsMockAdapter.__resetForTests();
  });

  test("renders the legacy section tabs and the full list by default", async () => {
    renderTab();
    expect(await screen.findByRole("heading", { name: "Kontakty" })).toBeInTheDocument();
    for (const label of [
      "Wszyscy",
      "Kontakty",
      "Specjaliści",
      "Bliżsi znajomi",
      "Dalsi znajomi",
      "Bliska rodzina",
      "Dalsza rodzina",
      "Prośby",
    ]) {
      expect(screen.getByRole("tab", { name: new RegExp(label) })).toBeInTheDocument();
    }
    // "Wszyscy" is the default tab — the seeded people are all listed.
    expect(await screen.findByText("Bartek Nowak")).toBeInTheDocument();
    expect(screen.getByText("Ewa Zielińska")).toBeInTheDocument();
    expect(screen.getByText("Damian Lis")).toBeInTheDocument();
  });

  test("'Bliska rodzina' shows only the close-family circle (owner-local filter)", async () => {
    renderTab();
    fireEvent.click(await screen.findByRole("tab", { name: /Bliska rodzina/ }));
    await waitFor(() => expect(screen.getByText("Ewa Zielińska")).toBeInTheDocument());
    expect(screen.queryByText("Bartek Nowak")).not.toBeInTheDocument();
  });

  test("'Specjaliści' shows the specialist and marks the badge", async () => {
    renderTab();
    fireEvent.click(await screen.findByRole("tab", { name: /Specjaliści/ }));
    await waitFor(() => expect(screen.getByText("Damian Lis")).toBeInTheDocument());
    expect(screen.getByText("Specjalista")).toBeInTheDocument();
  });

  test("'Prośby' lists the incoming contact + friend requests", async () => {
    renderTab();
    fireEvent.click(await screen.findByRole("tab", { name: /Prośby/ }));
    await waitFor(() =>
      expect(screen.getByText("Chce dołączyć do znajomych")).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Akceptuj" })).toBeInTheDocument();
  });
});
