import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { LoginRoute } from "../LoginRoute";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <LoginRoute />
    </MemoryRouter>,
  );
}

function typeInto(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

describe("LoginRoute", () => {
  test("renders heading + email + password + submit + reset link", () => {
    renderLogin();
    expect(
      screen.getByRole("heading", { level: 1, name: /zaloguj się/i }),
    ).toBeDefined();
    expect(screen.getByLabelText(/^e-mail/i)).toBeDefined();
    expect(screen.getByLabelText(/^hasło/i)).toBeDefined();
    expect(
      screen.getByRole("link", { name: /nie pamiętasz hasła/i }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /zaloguj się/i })).toBeDefined();
  });

  test("submitting with empty fields shows validation errors", () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /zaloguj się/i }));
    expect(screen.getByText(/podaj adres e-mail/i)).toBeDefined();
    expect(screen.getByText(/podaj hasło/i)).toBeDefined();
  });

  test("valid submit shows honest UI-shell notice (no fake session)", () => {
    renderLogin();
    typeInto(screen.getByLabelText(/^e-mail/i), "anna@example.org");
    typeInto(screen.getByLabelText(/^hasło/i), "haslo1234");
    fireEvent.click(screen.getByRole("button", { name: /zaloguj się/i }));
    expect(
      screen.getByText(/logowanie nie jest jeszcze dostępne/i),
    ).toBeDefined();
  });
});
