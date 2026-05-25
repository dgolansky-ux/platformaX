import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { RegisterRoute } from "../RegisterRoute";
import { makeFakeAuthAdapter } from "./auth-test-helpers";
import type { AuthResult, IdentityAuthAdapter } from "../../../features-v2/identity";

function CheckEmailProbe() {
  const location = useLocation();
  return <div>CHECK_EMAIL_ROUTE[search:{location.search}]</div>;
}

function renderRegister(adapter: IdentityAuthAdapter = makeFakeAuthAdapter()) {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<RegisterRoute authAdapter={adapter} />} />
        <Route path="/check-email" element={<CheckEmailProbe />} />
        <Route path="/login" element={<div>LOGIN_ROUTE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function typeInto(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

function fillValidForm() {
  typeInto(screen.getByLabelText(/^e-mail/i), "anna@example.org");
  typeInto(screen.getByLabelText(/^hasło/i), "haslo1234");
  typeInto(screen.getByLabelText(/powtórz hasło/i), "haslo1234");
  fireEvent.click(screen.getByRole("checkbox"));
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

  test("shows validation errors when submitting empty form (adapter not called)", () => {
    const adapter = makeFakeAuthAdapter();
    renderRegister(adapter);
    fireEvent.click(screen.getByRole("button", { name: /załóż konto/i }));
    expect(screen.getByText(/podaj adres e-mail/i)).toBeDefined();
    expect(screen.getByText(/podaj hasło/i)).toBeDefined();
    expect(screen.getByText(/powtórz hasło, aby je potwierdzić/i)).toBeDefined();
    expect(screen.getByText(/musisz zaakceptować regulamin/i)).toBeDefined();
    expect(adapter.signUp).not.toHaveBeenCalled();
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

  test("valid submit calls adapter.signUp and navigates to /check-email without leaking e-mail in the URL", async () => {
    const adapter = makeFakeAuthAdapter();
    renderRegister(adapter);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /załóż konto/i }));

    expect(await screen.findByText(/CHECK_EMAIL_ROUTE\[search:\]/)).toBeDefined();
    expect(adapter.signUp).toHaveBeenCalledWith("anna@example.org", "haslo1234");
    expect(screen.queryByText(/anna@example\.org/i)).toBeNull();
  });

  test("renders a safe error from the adapter and does not navigate", async () => {
    const adapter = makeFakeAuthAdapter({
      signUp: async (): Promise<AuthResult> => ({
        ok: false,
        error: { code: "EMAIL_IN_USE", message: "Ten adres e-mail jest już zarejestrowany." },
      }),
    });
    renderRegister(adapter);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /załóż konto/i }));

    expect(await screen.findByText(/już zarejestrowany/i)).toBeDefined();
    expect(screen.queryByText(/CHECK_EMAIL_ROUTE/)).toBeNull();
  });
});
