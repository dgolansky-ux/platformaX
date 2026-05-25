import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { CheckEmailRoute } from "../CheckEmailRoute";

function renderCheck(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CheckEmailRoute />
    </MemoryRouter>,
  );
}

describe("CheckEmailRoute", () => {
  test("shows heading and explicit UI-shell notice without an email", () => {
    renderCheck("/check-email");
    expect(
      screen.getByRole("heading", { level: 1, name: /sprawdź swoją skrzynkę/i }),
    ).toBeDefined();
    expect(
      screen.getByText(/backend nie jest podłączony/i),
    ).toBeDefined();
  });

  test("renders provided e-mail from query string in subheading", () => {
    renderCheck("/check-email?email=anna%40example.org");
    expect(screen.getByText(/anna@example\.org/i)).toBeDefined();
  });

  test("offers a link to onboarding", () => {
    renderCheck("/check-email");
    const link = screen.getByRole("link", { name: /onboardingu/i });
    expect(link.getAttribute("href")).toBe("/onboarding");
  });
});
