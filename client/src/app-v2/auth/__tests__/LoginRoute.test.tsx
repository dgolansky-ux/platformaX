import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { LoginRoute } from "../LoginRoute";
import { makeFakeAuthAdapter } from "./auth-test-helpers";
import type { AuthResult, IdentityAuthAdapter } from "../../../features-v2/identity";

function renderLogin(adapter: IdentityAuthAdapter = makeFakeAuthAdapter()) {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginRoute authAdapter={adapter} />} />
        <Route path="/onboarding" element={<div>ONBOARDING_ROUTE</div>} />
        <Route path="/register" element={<div>REGISTER_ROUTE</div>} />
        <Route path="/reset-password" element={<div>RESET_ROUTE</div>} />
      </Routes>
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

  test("submitting with empty fields shows validation errors (adapter not called)", () => {
    const adapter = makeFakeAuthAdapter();
    renderLogin(adapter);
    fireEvent.click(screen.getByRole("button", { name: /zaloguj się/i }));
    expect(screen.getByText(/podaj adres e-mail/i)).toBeDefined();
    expect(screen.getByText(/podaj hasło/i)).toBeDefined();
    expect(adapter.signIn).not.toHaveBeenCalled();
  });

  test("valid submit calls adapter.signIn and navigates to onboarding on success", async () => {
    const adapter = makeFakeAuthAdapter();
    renderLogin(adapter);
    typeInto(screen.getByLabelText(/^e-mail/i), "anna@example.org");
    typeInto(screen.getByLabelText(/^hasło/i), "haslo1234");
    fireEvent.click(screen.getByRole("button", { name: /zaloguj się/i }));

    expect(await screen.findByText("ONBOARDING_ROUTE")).toBeDefined();
    expect(adapter.signIn).toHaveBeenCalledWith("anna@example.org", "haslo1234");
  });

  test("renders a safe error from the adapter and stays on the login screen", async () => {
    const adapter = makeFakeAuthAdapter({
      signIn: async (): Promise<AuthResult> => ({
        ok: false,
        error: { code: "INVALID_CREDENTIALS", message: "Nieprawidłowy e-mail lub hasło." },
      }),
    });
    renderLogin(adapter);
    typeInto(screen.getByLabelText(/^e-mail/i), "anna@example.org");
    typeInto(screen.getByLabelText(/^hasło/i), "zlehaslo1");
    fireEvent.click(screen.getByRole("button", { name: /zaloguj się/i }));

    expect(await screen.findByText(/nieprawidłowy e-mail lub hasło/i)).toBeDefined();
    expect(screen.queryByText("ONBOARDING_ROUTE")).toBeNull();
  });
});
