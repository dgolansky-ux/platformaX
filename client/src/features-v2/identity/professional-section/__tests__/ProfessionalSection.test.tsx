/* TEST_FIXTURE — pagination guard safe marker: the getAll* calls below are
   @testing-library DOM queries, not runtime list fetches. */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ProfessionalSection } from "../ProfessionalSection";

describe("ProfessionalSection — Zarządzaj → Sekcja zawodowa shell", () => {
  test("renders the section heading and lead copy", async () => {
    render(<ProfessionalSection />);
    expect(
      await screen.findByRole("heading", { name: "Sekcja zawodowa" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/zostanie dodana po imporcie bazy/i)).toBeInTheDocument();
  });

  test("renders exactly the 30 reference categories", async () => {
    render(<ProfessionalSection />);
    const grid = await screen.findByRole("listbox", { name: "Kategorie zawodowe" });
    expect(within(grid).getAllByRole("option")).toHaveLength(30);
    expect(within(grid).getByText("Technologia i IT")).toBeInTheDocument();
    expect(within(grid).getByText("Rzemiosło i usługi techniczne")).toBeInTheDocument();
  });

  test("selecting a category reveals a truthful DATA_PENDING state, never a fake list", async () => {
    render(<ProfessionalSection />);
    const grid = await screen.findByRole("listbox", { name: "Kategorie zawodowe" });
    fireEvent.click(within(grid).getByRole("option", { name: /Technologia i IT/ }));
    await waitFor(() =>
      expect(
        screen.getByText(/Nie pokazujemy tu tymczasowych ani zmyślonych danych/i),
      ).toBeInTheDocument(),
    );
    // step 2/3 are pending, not a list of professions
    expect(screen.getByText("Wybór zawodu")).toBeInTheDocument();
    expect(screen.getByText("Wybór specjalizacji")).toBeInTheDocument();
  });

  test("no fake save: My-professions save and proposal submit are disabled", async () => {
    render(<ProfessionalSection />);
    const grid = await screen.findByRole("listbox", { name: "Kategorie zawodowe" });
    fireEvent.click(within(grid).getByRole("option", { name: /Fotografia/ }));
    expect(
      await screen.findByRole("button", { name: /Zapisz zawody/ }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /Wyślij propozycję/ })).toBeDisabled();
  });
});
