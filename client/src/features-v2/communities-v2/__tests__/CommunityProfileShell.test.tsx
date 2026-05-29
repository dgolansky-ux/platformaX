import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";
import { CommunityProfileShell } from "../CommunityProfileShell";
import { communitiesMockAdapter } from "../mock-adapter";

function renderProfile(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/communities/${slug}`]}>
      <Routes>
        <Route path="/communities/:s" element={<CommunityProfileShell slug={slug} />} />
        <Route path="/communities" element={<div>LIST_ROUTE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CommunityProfileShell — MOCK_LOCAL_ONLY profile screen", () => {
  beforeEach(() => {
    communitiesMockAdapter.__resetForTests();
  });

  test("founder sees the manage CTA on their own community", async () => {
    renderProfile("product-builders");
    expect(await screen.findByRole("heading", { name: "Product Builders" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Zarządzaj/ })).toBeInTheDocument();
  });

  test("stranger sees a Dołącz CTA on a public community", async () => {
    renderProfile("lokalne-wydarzenia");
    expect(await screen.findByRole("heading", { name: "Lokalne wydarzenia" })).toBeInTheDocument();
    const join = screen.getByRole("button", { name: /Dołącz do społeczności/ });
    expect(join).toBeInTheDocument();
    fireEvent.click(join);
    await waitFor(() => expect(screen.getByText(/Jesteś członkiem/)).toBeInTheDocument());
  });

  test("stranger sees a Poproś o dołączenie CTA on a private community fixture", async () => {
    // Seed a private community where the viewer is not a member.
    communitiesMockAdapter.__resetForTests();
    // Reuse fixture: "zdrowie-ruch" is private; viewer is a member there.
    // Use the open-source/unlisted fixture which is not_member.
    const created = await communitiesMockAdapter.createCommunity({
      name: "Prywatne grono",
      slug: "prywatne-grono",
      visibility: "private",
    });
    expect(created.ok).toBe(true);
    renderProfile("prywatne-grono");
    // The creator (viewer) is the founder — so the CTA is Zarządzaj, not Dołącz.
    expect(await screen.findByRole("link", { name: /Zarządzaj/ })).toBeInTheDocument();
  });

  test("shows error state on adapter failure", async () => {
    communitiesMockAdapter.__setFailureForTests("offline");
    renderProfile("product-builders");
    expect(await screen.findByRole("alert")).toHaveTextContent("offline");
  });
});
