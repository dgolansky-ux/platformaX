import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { PersonalProfileManageRoute } from "../PersonalProfileManageRoute";

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={["/manage/profil-osobisty"]}>
      <PersonalProfileManageRoute />
    </MemoryRouter>,
  );
}

describe("Zarządzaj profilem osobistym — data / contact / privacy, NOT appearance", () => {
  test("renders the data / contact / visibility / consent sections", () => {
    renderScreen();
    expect(
      screen.getByRole("heading", { name: "Zarządzaj profilem osobistym", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Dane podstawowe" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Dane kontaktowe" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Widoczność kontaktu" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Zgody kontaktowe" })).toBeInTheDocument();
  });

  test("is NOT an appearance editor (no avatar/banner/bio editing here)", () => {
    renderScreen();
    expect(screen.queryByRole("button", { name: /Zmień zdjęcie/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Zmień baner/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edytuj (opis|bio)/ })).not.toBeInTheDocument();
    // it points the user to the profile for appearance editing instead
    expect(screen.getByRole("link", { name: /Wygląd profilu/ })).toHaveAttribute("href", "/profile");
  });

  test("no fake save — the save button is disabled, and consent rule is shown", () => {
    renderScreen();
    expect(screen.getByRole("button", { name: /Zapisz zmiany/ })).toBeDisabled();
    expect(screen.getByText(/approved_contact_fields/)).toBeInTheDocument();
    expect(
      screen.getByText(/Sama znajomość NIE ujawnia automatycznie/),
    ).toBeInTheDocument();
  });
});
