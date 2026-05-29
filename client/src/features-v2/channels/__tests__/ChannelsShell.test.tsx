import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { ChannelsShell } from "../ChannelsShell";
import { channelsMockAdapter } from "../channels-mock-adapter";

// TEST_FIXTURE: RTL queries use *AllBy* helpers; this is not a runtime list API.

describe("ChannelsShell — directory post preview", () => {
  beforeEach(() => channelsMockAdapter.__resetForTests());

  it("shows latest real post preview and real post counts", async () => {
    render(
      <MemoryRouter>
        <ChannelsShell />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: "Kanały" })).toBeInTheDocument();
    expect(screen.getAllByText(/Ostatnio: Dziś zbieramy pytania/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/wpisów/).length).toBeGreaterThan(0);
  });
});
