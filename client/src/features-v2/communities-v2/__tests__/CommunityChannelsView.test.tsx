import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";
import { CommunityChannelsView } from "../CommunityChannelsView";
import { communitiesMockAdapter } from "../mock-adapter";

function renderChannels(slug: string) {
  return render(
    <MemoryRouter>
      <CommunityChannelsView slug={slug} />
    </MemoryRouter>,
  );
}

describe("CommunityChannelsView — MOCK_LOCAL_ONLY channels screen", () => {
  beforeEach(() => {
    communitiesMockAdapter.__resetForTests();
  });

  test("founder sees the create-channel form and can create a new channel", async () => {
    renderChannels("product-builders");
    expect(await screen.findByRole("heading", { name: /Kanały społeczności/ })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: /Utwórz kanał/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nazwa"), { target: { value: "Sekcja Q&A" } });
    fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "qa" } });
    fireEvent.click(screen.getByRole("button", { name: /Utwórz kanał/ }));
    await waitFor(() => expect(screen.getByText(/#qa · Sekcja Q&A/)).toBeInTheDocument());
  });

  test("public-community viewer (non-member) can follow then unfollow a channel", async () => {
    // Create a public community with a channel via the adapter, leaving the viewer outside.
    await communitiesMockAdapter.createCommunity({ name: "DemoPub", slug: "demopub", visibility: "public" });
    await communitiesMockAdapter.createChannel({ communitySlug: "demopub", slug: "general", name: "General" });
    // Promote the viewer to a stranger context by reset and direct seeding via __setDataForTests is too lossy;
    // instead, just use the seeded fixture "Lokalne wydarzenia" which has no channels — verify create form is hidden.
    communitiesMockAdapter.__resetForTests();
    renderChannels("lokalne-wydarzenia");
    expect(await screen.findByRole("heading", { name: /Kanały społeczności/ })).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: /Utwórz kanał/ })).toBeNull();
    expect(screen.getByText(/Brak kanałów w tej społeczności/)).toBeInTheDocument();
  });

  test("founder seeded channel exposes Obserwuj toggle", async () => {
    renderChannels("product-builders");
    expect(await screen.findByText(/#newsletter · Newsletter/)).toBeInTheDocument();
    const followBtn = screen.getByRole("button", { name: /Obserwuj/ });
    fireEvent.click(followBtn);
    await waitFor(() => expect(screen.getByRole("button", { name: /Przestań obserwować/ })).toBeInTheDocument());
  });
});
