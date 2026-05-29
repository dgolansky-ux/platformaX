import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { ChannelProfileShell } from "../ChannelProfileShell";
import { channelsMockAdapter } from "../channels-mock-adapter";

// TEST_FIXTURE: RTL queries use *AllBy* helpers; this is not a runtime list API.

function renderProfile(slug = "pb-ogolny") {
  return render(
    <MemoryRouter>
      <ChannelProfileShell slug={slug} />
    </MemoryRouter>,
  );
}

describe("ChannelProfileShell — channel content feed", () => {
  beforeEach(() => channelsMockAdapter.__resetForTests());

  it("renders seeded feed and pinned post", async () => {
    renderProfile();
    expect(await screen.findByRole("heading", { name: "Ogólny" })).toBeInTheDocument();
    expect(screen.getByText(/Startujemy z krótkimi aktualizacjami/)).toBeInTheDocument();
    expect(screen.getByText("Przypięte")).toBeInTheDocument();
  });

  it("shows composer for lead with publish permission and publishes into feed", async () => {
    renderProfile();
    const textarea = await screen.findByPlaceholderText("Napisz wpis na kanale...");
    fireEvent.change(textarea, { target: { value: "Nowy wpis kanału" } });
    fireEvent.click(screen.getByRole("button", { name: "Opublikuj" }));
    await waitFor(() => expect(screen.getByText("Nowy wpis kanału")).toBeInTheDocument());
  });

  it("pin action is visible only for permitted lead and moves one pinned post", async () => {
    renderProfile();
    const pinButtons = await screen.findAllByRole("button", { name: "Przypnij" });
    fireEvent.click(pinButtons[0]);
    await waitFor(() => expect(screen.getByRole("button", { name: "Odepnij" })).toBeInTheDocument());
  });

  it("non-lead channel profile hides composer", async () => {
    renderProfile("zdrowie-trening");
    expect(await screen.findByRole("heading", { name: "Treningi" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Napisz wpis na kanale...")).toBeNull();
  });
});
