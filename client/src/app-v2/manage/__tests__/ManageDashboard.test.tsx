/* TEST_FIXTURE — pagination guard safe marker: getAll* below are
   @testing-library DOM queries, not runtime list fetches. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { ManageDashboard } from "../ManageDashboard";
import { ProfessionalSectionRoute } from "../ProfessionalSectionRoute";

function renderManage() {
  return render(
    <MemoryRouter initialEntries={["/manage"]}>
      <Routes>
        <Route path="/manage" element={<ManageDashboard />} />
        <Route path="/manage/sekcja-zawodowa" element={<ProfessionalSectionRoute />} />
        <Route path="/profile" element={<div>PROFILE SCREEN</div>} />
        <Route path="/contacts" element={<div>CONTACTS SCREEN</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Manage dashboard — root is a hub, not the professions screen", () => {
  test("root /manage renders the management hub with tiles", () => {
    renderManage();
    expect(screen.getByRole("heading", { name: "Zarządzaj", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zarządzaj profilem osobistym/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zarządzaj zawodem/ })).toBeInTheDocument();
  });

  test("root /manage does NOT render the professions category grid", () => {
    renderManage();
    expect(screen.queryByRole("listbox", { name: "Kategorie zawodowe" })).not.toBeInTheDocument();
    expect(screen.queryByText("Technologia i IT")).not.toBeInTheDocument();
  });

  test("a future tile is disabled, not a no-op button", () => {
    renderManage();
    expect(screen.queryByRole("button", { name: /Prywatność i widoczność/ })).not.toBeInTheDocument();
    expect(screen.getByText("Prywatność i widoczność")).toBeInTheDocument();
  });

  test("'Zarządzaj zawodem' navigates to the professions section (30 categories, DATA_PENDING)", async () => {
    renderManage();
    fireEvent.click(screen.getByRole("button", { name: /Zarządzaj zawodem/ }));
    expect(
      await screen.findByRole("heading", { name: "Sekcja zawodowa" }),
    ).toBeInTheDocument();
    const grid = await screen.findByRole("listbox", { name: "Kategorie zawodowe" });
    expect(within(grid).getAllByRole("option")).toHaveLength(30);
  });
});
