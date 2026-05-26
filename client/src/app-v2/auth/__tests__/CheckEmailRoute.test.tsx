import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { CheckEmailRoute } from "../CheckEmailRoute";
import type { IdentityAuthAdapter } from "../../../features-v2/identity";

function fakeAuth(configured: boolean): IdentityAuthAdapter {
  return {
    isConfigured: () => configured,
    signUp: async () => ({ ok: true, user: null }),
    signIn: async () => ({ ok: true, user: null }),
    signOut: async () => ({ ok: true, user: null }),
    resetPassword: async () => ({ ok: true, user: null }),
    getCurrentUser: async () => null,
    onAuthStateChange: () => () => {},
  };
}

function renderCheck(path: string, configured = false) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CheckEmailRoute authAdapter={fakeAuth(configured)} />
    </MemoryRouter>,
  );
}

describe("CheckEmailRoute", () => {
  test("not-configured: shows the honest UI-shell notice", () => {
    renderCheck("/check-email", false);
    expect(
      screen.getByRole("heading", { level: 1, name: /sprawdź swoją skrzynkę/i }),
    ).toBeDefined();
    expect(
      screen.getByText(/backend nie jest skonfigurowany/i),
    ).toBeDefined();
    expect(
      screen.getByText(/VITE_SUPABASE_URL/i),
    ).toBeDefined();
  });

  test("configured: confirms the activation link was sent", () => {
    renderCheck("/check-email", true);
    expect(
      screen.getByText(/link aktywacyjny wysłany/i),
    ).toBeDefined();
    expect(
      screen.getByText(/link aktywacyjny od Supabase Auth/i),
    ).toBeDefined();
  });

  test("never renders a concrete e-mail from the URL (any mode)", () => {
    renderCheck("/check-email?email=anna%40example.org", false);
    expect(screen.queryByText(/anna@example\.org/i)).toBeNull();
  });

  test("offers a link to onboarding (any mode)", () => {
    renderCheck("/check-email", false);
    const link = screen.getByRole("link", { name: /onboardingu/i });
    expect(link.getAttribute("href")).toBe("/onboarding");
  });
});
