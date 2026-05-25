import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { ResetPasswordRoute } from "../ResetPasswordRoute";
import { makeFakeAuthAdapter } from "./auth-test-helpers";
import type { AuthResult, IdentityAuthAdapter } from "../../../features-v2/identity";

function renderReset(adapter: IdentityAuthAdapter = makeFakeAuthAdapter()) {
  return render(
    <MemoryRouter initialEntries={["/reset-password"]}>
      <ResetPasswordRoute authAdapter={adapter} />
    </MemoryRouter>,
  );
}

function typeInto(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

describe("ResetPasswordRoute", () => {
  test("renders heading + email field + submit + return to login", () => {
    renderReset();
    expect(
      screen.getByRole("heading", { level: 1, name: /reset hasła/i }),
    ).toBeDefined();
    expect(screen.getByLabelText(/^e-mail/i)).toBeDefined();
    expect(
      screen.getByRole("button", { name: /wyślij link resetujący/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: /wróć do logowania/i }),
    ).toBeDefined();
  });

  test("empty submit shows validation error (adapter not called)", () => {
    const adapter = makeFakeAuthAdapter();
    renderReset(adapter);
    fireEvent.click(
      screen.getByRole("button", { name: /wyślij link resetujący/i }),
    );
    expect(screen.getByText(/podaj adres e-mail/i)).toBeDefined();
    expect(adapter.resetPassword).not.toHaveBeenCalled();
  });

  test("valid submit calls adapter.resetPassword and shows a generic confirmation without echoing the e-mail", async () => {
    const adapter = makeFakeAuthAdapter();
    renderReset(adapter);
    typeInto(screen.getByLabelText(/^e-mail/i), "anna@example.org");
    fireEvent.click(
      screen.getByRole("button", { name: /wyślij link resetujący/i }),
    );

    expect(await screen.findByText(/wiadomość przygotowana/i)).toBeDefined();
    expect(adapter.resetPassword).toHaveBeenCalledWith("anna@example.org");
    expect(screen.queryByText(/anna@example\.org/i)).toBeNull();
    expect(
      screen.queryByRole("button", { name: /wyślij link resetujący/i }),
    ).toBeNull();
  });

  test("renders a safe error from the adapter and keeps the form", async () => {
    const adapter = makeFakeAuthAdapter({
      resetPassword: async (): Promise<AuthResult> => ({
        ok: false,
        error: { code: "RATE_LIMITED", message: "Zbyt wiele prób. Spróbuj ponownie za chwilę." },
      }),
    });
    renderReset(adapter);
    typeInto(screen.getByLabelText(/^e-mail/i), "anna@example.org");
    fireEvent.click(
      screen.getByRole("button", { name: /wyślij link resetujący/i }),
    );

    expect(await screen.findByText(/zbyt wiele prób/i)).toBeDefined();
    expect(
      screen.getByRole("button", { name: /wyślij link resetujący/i }),
    ).toBeDefined();
  });
});
