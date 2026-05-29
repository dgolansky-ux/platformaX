import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";
import { CommunitiesShell } from "../CommunitiesShell";
import { communitiesMockAdapter } from "../mock-adapter";

function renderShell() {
  return render(
    <MemoryRouter initialEntries={["/communities"]}>
      <Routes>
        <Route path="/communities" element={<CommunitiesShell />} />
        <Route path="/communities/new" element={<div>NEW_ROUTE</div>} />
        <Route path="/communities/:slug" element={<div>PROFILE_ROUTE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CommunitiesShell — Slice 1 legacy layout", () => {
  beforeEach(() => {
    communitiesMockAdapter.__resetForTests();
  });

  test("renders header + Utwórz CTA + seeded sections", async () => {
    renderShell();
    expect(screen.getByText("Ładowanie społeczności…")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Społeczności" })).toBeInTheDocument();
    // My communities section
    expect(await screen.findByRole("region", { name: /Moje społeczności/ })).toBeInTheDocument();
    // Recommended section (seeded discover has 2 entries → recommended renders)
    expect(screen.getByRole("region", { name: /Polecane dla Ciebie/ })).toBeInTheDocument();
    // Categories grid
    expect(screen.getByRole("region", { name: /Odkryj społeczności/ })).toBeInTheDocument();
    expect(screen.getByText("Technologia")).toBeInTheDocument();
  });

  test("Utwórz społeczność CTA navigates to /communities/new", async () => {
    renderShell();
    fireEvent.click(await screen.findByRole("button", { name: /Utwórz społeczność/ }));
    await screen.findByText("NEW_ROUTE");
  });

  test("typing in search filters communities + shows empty state on no match", async () => {
    renderShell();
    await screen.findByRole("heading", { name: "Społeczności" });
    fireEvent.click(screen.getByRole("button", { name: /Wyszukaj społeczność/ }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzzzzzzz" } });
    await waitFor(() => expect(screen.getByText("Brak wyników")).toBeInTheDocument(), { timeout: 1500 });
  });

  test("clicking a category chip activates it (filters search)", async () => {
    renderShell();
    await screen.findByRole("heading", { name: "Społeczności" });
    const techChip = screen.getByRole("button", { name: /Technologia/, pressed: false });
    fireEvent.click(techChip);
    // Tylko społeczności z categorySlug=technologia ujawniają się; pozostałe nie.
    await waitFor(() => expect(screen.getByText("Product Builders")).toBeInTheDocument());
  });

  test("shows adapter error state", async () => {
    communitiesMockAdapter.__setFailureForTests("mock adapter down");
    renderShell();
    expect(await screen.findByRole("alert")).toHaveTextContent("mock adapter down");
  });
});
