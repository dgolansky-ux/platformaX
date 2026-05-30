/* TEST_FIXTURE — pagination guard safe marker: getAll* below are
   @testing-library DOM queries, not runtime list fetches. */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { ManageDashboard } from "../ManageDashboard";
import { ProfessionalSectionRoute } from "../ProfessionalSectionRoute";
import { ManagePrivacyRoute } from "../ManageSectionRoute";

function renderManage(initialPath = "/manage") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/manage" element={<ManageDashboard />} />
        <Route path="/manage/sekcja-zawodowa" element={<ProfessionalSectionRoute />} />
        <Route path="/manage/privacy" element={<ManagePrivacyRoute />} />
        <Route path="/profile" element={<div>PROFILE SCREEN</div>} />
        <Route path="/contacts" element={<div>CONTACTS SCREEN</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Manage dashboard (Slice 21) — central account management hub", () => {
  test("root /manage renders the 13-section management dashboard", async () => {
    renderManage();
    expect(screen.getByRole("heading", { name: "Zarządzaj", level: 1 })).toBeInTheDocument();
    // Wait for adapter promise to resolve
    expect(await screen.findByRole("heading", { name: "Konto", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Profil osobisty", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Prywatność", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Kontakt i zgody kontaktowe", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Znajomi i blokady", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Powiadomienia", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Media", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Warstwa zawodowa", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Miejsca pracy", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Moduły profilu/, level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Kanały", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Społeczności zarządzane", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bezpieczeństwo i sesje", level: 2 })).toBeInTheDocument();
  });

  test("root /manage does NOT render the professions category grid (it's a hub, not a feature screen)", async () => {
    renderManage();
    await screen.findByRole("heading", { name: "Konto", level: 2 });
    expect(screen.queryByRole("listbox", { name: "Kategorie zawodowe" })).not.toBeInTheDocument();
    expect(screen.queryByText("Technologia i IT")).not.toBeInTheDocument();
  });

  test("security section primary action is disabled with truthful reason (no fake clickable button)", async () => {
    renderManage();
    const securityCard = await screen.findByRole("article", { name: /Bezpieczeństwo i sesje/i });
    const primary = within(securityCard).getByRole("button", { name: /Otwórz bezpieczeństwo/ });
    expect(primary).toBeDisabled();
  });

  test("clicking professional 'Otwórz sekcję zawodową' navigates to /manage/sekcja-zawodowa with 30 categories", async () => {
    renderManage();
    const profCard = await screen.findByRole("article", { name: /Warstwa zawodowa/i });
    fireEvent.click(within(profCard).getByRole("button", { name: /Otwórz sekcję zawodową/ }));
    expect(
      await screen.findByRole("heading", { name: "Sekcja zawodowa" }),
    ).toBeInTheDocument();
    const grid = await screen.findByRole("listbox", { name: "Kategorie zawodowe" });
    expect(within(grid).getAllByRole("option")).toHaveLength(30);
  });

  test("'Zmień widoczność' in privacy section navigates to /manage/privacy shell", async () => {
    renderManage();
    const privacyCard = await screen.findByRole("article", { name: /Prywatność/i });
    fireEvent.click(within(privacyCard).getByRole("button", { name: /Zmień widoczność/ }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Prywatność", level: 1 })).toBeInTheDocument();
    });
  });

  test("runtime badge ('Tryb demo') is shown when adapter returns runtimeBackend=mock", async () => {
    renderManage();
    await screen.findByRole("heading", { name: "Konto", level: 2 });
    expect(screen.getByRole("note")).toHaveTextContent(/Tryb demo/);
  });
});
