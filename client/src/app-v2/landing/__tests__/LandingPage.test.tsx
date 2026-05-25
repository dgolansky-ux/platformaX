// TEST_FIXTURE: this file uses testing-library `getAllByRole` to enumerate
// rendered links/CTAs for assertion. It is not a runtime list query —
// the pagination guard's safe-marker escape (see scripts/check-pagination.mjs)
// applies here.
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { LandingPage } from "../LandingPage";

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe("LandingPage", () => {
  test("renders sticky header brand and account links", () => {
    renderLanding();
    const header = screen.getByRole("banner");
    const nav = within(header).getByRole("navigation", { name: /nawigacja konta/i });
    expect(within(nav).getByRole("link", { name: "Zaloguj się" })).toBeDefined();
    expect(within(nav).getByRole("link", { name: "Załóż konto" })).toBeDefined();
  });

  test("renders the hero with primary headline and CTAs", () => {
    renderLanding();
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
    renderLanding();
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
    renderLanding();
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
    renderLanding();
    expect(
      screen.queryByRole("heading", { name: /zapisy na wydarzenia/i }),
    ).toBeNull();
    expect(screen.queryByText(/eksport do csv/i)).toBeNull();
    expect(
      screen.queryByRole("link", { name: /przejdź do zapisów/i }),
    ).toBeNull();
  });

  test("renders final CTA section", () => {
    renderLanding();
    expect(
      screen.getByRole("heading", { level: 2, name: /dołącz do platformax/i }),
    ).toBeDefined();
  });

  test("renders footer with copyright", () => {
    renderLanding();
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText(/© 2026 platformax/i)).toBeDefined();
    expect(
      within(footer).getByText(
        /spokojniejsza przestrzeń do relacji, społeczności i działania/i,
      ),
    ).toBeDefined();
  });

  test("auth CTAs link to /login and /register (no placeholder #)", () => {
    renderLanding();
    const registerLinks = screen.getAllByRole("link", { name: /załóż konto/i });
    const loginLinks = screen.getAllByRole("link", { name: /zaloguj się/i });
    expect(registerLinks.length).toBeGreaterThanOrEqual(2);
    expect(loginLinks.length).toBeGreaterThanOrEqual(2);
    for (const a of registerLinks) {
      expect(a.getAttribute("href")).toBe("/register");
    }
    for (const a of loginLinks) {
      expect(a.getAttribute("href")).toBe("/login");
    }
  });
});
