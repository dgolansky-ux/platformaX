// TEST_FIXTURE: this file uses testing-library `getAllByRole` to enumerate
// rendered links/CTAs for assertion. It is not a runtime list query —
// the pagination guard's safe-marker escape (see scripts/check-pagination.mjs)
// applies here.
import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { LandingPage } from "../LandingPage";

describe("LandingPage", () => {
  test("renders sticky header brand and account links", () => {
    render(<LandingPage />);
    const header = screen.getByRole("banner");
    const nav = within(header).getByRole("navigation", { name: /nawigacja konta/i });
    expect(within(nav).getByRole("link", { name: "Zaloguj się" })).toBeDefined();
    expect(within(nav).getByRole("link", { name: "Załóż konto" })).toBeDefined();
  });

  test("renders the hero with primary headline and CTAs", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /relacji, społeczności i działania/i,
      }),
    ).toBeDefined();
    const hero = screen
      .getByRole("heading", { level: 1 })
      .closest("section") as HTMLElement;
    expect(within(hero).getAllByRole("link", { name: /załóż konto/i }).length).toBeGreaterThan(0);
    expect(within(hero).getAllByRole("link", { name: /zaloguj się/i }).length).toBeGreaterThan(0);
  });

  test("renders all four value cards", () => {
    render(<LandingPage />);
    const valuesHeading = screen.getByRole("heading", {
      level: 2,
      name: /zbudowana z myślą o ludziach/i,
    });
    const section = valuesHeading.closest("section") as HTMLElement;
    for (const title of [
      "Bez reklam",
      "Prywatność na serio",
      "Mniej hałasu",
      "Więcej sprawczości",
    ]) {
      expect(within(section).getByRole("heading", { level: 3, name: title })).toBeDefined();
    }
  });

  test("does not render the Features section", () => {
    render(<LandingPage />);
    expect(
      screen.queryByRole("heading", {
        name: /wszystko, czego potrzebujesz do działania/i,
      }),
    ).toBeNull();
    for (const title of [
      "Twórz profil",
      "Buduj sieć kontaktów",
      "Twórz społeczności",
      "Publikuj treści",
      "Rozwijaj aktywność",
    ]) {
      expect(
        screen.queryByRole("heading", { level: 3, name: title }),
      ).toBeNull();
    }
  });

  test("does not render the Zapisy section", () => {
    render(<LandingPage />);
    expect(
      screen.queryByRole("heading", { name: /zapisy na wydarzenia/i }),
    ).toBeNull();
    expect(screen.queryByText(/eksport do csv/i)).toBeNull();
    expect(
      screen.queryByRole("link", { name: /przejdź do zapisów/i }),
    ).toBeNull();
  });

  test("renders final CTA section", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { level: 2, name: /dołącz do platformax/i }),
    ).toBeDefined();
  });

  test("renders footer with copyright", () => {
    render(<LandingPage />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText(/© 2026 platformax/i)).toBeDefined();
    expect(
      within(footer).getByText(
        /spokojniejsza przestrzeń do relacji, społeczności i działania/i,
      ),
    ).toBeDefined();
  });

  test("placeholder CTAs use href='#' (auth not implemented yet)", () => {
    render(<LandingPage />);
    const placeholders = screen
      .getAllByRole("link")
      .filter((a) => /załóż konto|zaloguj się/i.test(a.textContent ?? ""));
    expect(placeholders.length).toBeGreaterThan(0);
    for (const a of placeholders) {
      expect(a.getAttribute("href")).toBe("#");
    }
  });
});
