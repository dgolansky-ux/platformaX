import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { ResetPasswordRoute } from "../ResetPasswordRoute";

function renderReset() {
  return render(
    <MemoryRouter initialEntries={["/reset-password"]}>
      <ResetPasswordRoute />
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

  test("empty submit shows validation error", () => {
    renderReset();
    fireEvent.click(
      screen.getByRole("button", { name: /wyślij link resetujący/i }),
    );
    expect(screen.getByText(/podaj adres e-mail/i)).toBeDefined();
  });

  test("valid submit shows honest UI-shell sent state with the e-mail", () => {
    renderReset();
    typeInto(screen.getByLabelText(/^e-mail/i), "anna@example.org");
    fireEvent.click(
      screen.getByRole("button", { name: /wyślij link resetujący/i }),
    );
    expect(screen.getByText(/wiadomość przygotowana/i)).toBeDefined();
    expect(screen.getByText(/anna@example\.org/i)).toBeDefined();
    expect(
      screen.queryByRole("button", { name: /wyślij link resetujący/i }),
    ).toBeNull();
  });
});
