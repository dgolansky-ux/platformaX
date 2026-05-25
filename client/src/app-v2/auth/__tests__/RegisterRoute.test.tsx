// TEST_FIXTURE: testing-library helpers (getAllByRole) used to enumerate
// rendered DOM — not a runtime list query (see scripts/check-pagination.mjs).
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { RegisterRoute } from "../RegisterRoute";

function renderRegister(initial = "/register") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/register" element={<RegisterRoute />} />
        <Route path="/check-email" element={<div>CHECK_EMAIL_ROUTE</div>} />
        <Route path="/login" element={<div>LOGIN_ROUTE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function typeInto(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

describe("RegisterRoute", () => {
  test("renders heading + 3 required fields + terms checkbox", () => {
    renderRegister();
    expect(
      screen.getByRole("heading", { level: 1, name: /załóż konto/i }),
    ).toBeDefined();
    expect(screen.getByLabelText(/^e-mail/i)).toBeDefined();
    expect(screen.getByLabelText(/^hasło/i)).toBeDefined();
    expect(screen.getByLabelText(/powtórz hasło/i)).toBeDefined();
    expect(screen.getByRole("checkbox")).toBeDefined();
  });

  test("shows validation errors when submitting empty form", () => {
    renderRegister();
    fireEvent.click(screen.getByRole("button", { name: /załóż konto/i }));
    expect(screen.getByText(/podaj adres e-mail/i)).toBeDefined();
    expect(screen.getByText(/podaj hasło/i)).toBeDefined();
    expect(screen.getByText(/powtórz hasło, aby je potwierdzić/i)).toBeDefined();
    expect(screen.getByText(/musisz zaakceptować regulamin/i)).toBeDefined();
  });

  test("shows error when passwords mismatch", () => {
    renderRegister();
    typeInto(screen.getByLabelText(/^e-mail/i), "anna@example.org");
    typeInto(screen.getByLabelText(/^hasło/i), "haslo1234");
    typeInto(screen.getByLabelText(/powtórz hasło/i), "INNE12345");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /załóż konto/i }));
    expect(screen.getByText(/hasła nie są identyczne/i)).toBeDefined();
  });

  test("navigates to /check-email on valid submit (no real backend)", () => {
    renderRegister();
    typeInto(screen.getByLabelText(/^e-mail/i), "anna@example.org");
    typeInto(screen.getByLabelText(/^hasło/i), "haslo1234");
    typeInto(screen.getByLabelText(/powtórz hasło/i), "haslo1234");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /załóż konto/i }));
    expect(screen.getByText("CHECK_EMAIL_ROUTE")).toBeDefined();
  });
});
