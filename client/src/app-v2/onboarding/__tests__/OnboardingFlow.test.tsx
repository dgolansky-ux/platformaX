// TEST_FIXTURE: testing-library helpers (getAllByRole) used to enumerate
// rendered DOM — not a runtime list query (see scripts/check-pagination.mjs).
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import { OnboardingFlow } from "../OnboardingFlow";
import type {
  IdentityAuthAdapter,
  OnboardingProfileAdapter,
  CompleteOnboardingResult,
} from "../../../features-v2/identity";

function buildAuthAdapter(): IdentityAuthAdapter {
  return {
    isConfigured: () => true,
    signUp: vi.fn(async () => ({ ok: true as const, user: null })),
    signIn: vi.fn(async () => ({ ok: true as const, user: null })),
    signOut: vi.fn(async () => ({ ok: true as const, user: null })),
    resetPassword: vi.fn(async () => ({ ok: true as const, user: null })),
    getCurrentUser: vi.fn(async () => ({ id: "user-test", email: null })),
    onAuthStateChange: vi.fn(() => () => {}),
  };
}

function buildProfileAdapter(
  overrides: Partial<OnboardingProfileAdapter> = {},
): OnboardingProfileAdapter {
  const successResult: CompleteOnboardingResult = {
    ok: true,
    value: {
      userId: "user-test",
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
      avatarMediaRef: null,
      bannerMediaRef: null,
      bio: null,
      visibility: "public",
      onboardingCompleted: true,
      createdAt: "2026-05-25T12:00:00.000Z",
      updatedAt: "2026-05-25T12:00:00.000Z",
    },
  };
  return {
    isPersistent: () => false,
    completeOnboarding: vi.fn(async () => successResult),
    getMyProfile: vi.fn(async () => ({
      ok: false as const,
      error: { code: "NOT_FOUND" as const, message: "n/a" },
    })),
    getPublicProfile: vi.fn(async () => ({
      ok: false as const,
      error: { code: "NOT_FOUND" as const, message: "n/a" },
    })),
    ...overrides,
  };
}

function renderFlow(
  overrides: { profileAdapter?: OnboardingProfileAdapter; authAdapter?: IdentityAuthAdapter } = {},
) {
  const profileAdapter = overrides.profileAdapter ?? buildProfileAdapter();
  const authAdapter = overrides.authAdapter ?? buildAuthAdapter();
  const utils = render(
    <MemoryRouter initialEntries={["/onboarding"]}>
      <Routes>
        <Route
          path="/onboarding"
          element={
            <OnboardingFlow
              profileAdapter={profileAdapter}
              authAdapter={authAdapter}
            />
          }
        />
        <Route path="/profile" element={<div>PROFILE_ROUTE</div>} />
        <Route path="/" element={<div>HOME_ROUTE</div>} />
      </Routes>
    </MemoryRouter>,
  );
  return { ...utils, profileAdapter, authAdapter };
}

function typeInto(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

function clickNext() {
  fireEvent.click(screen.getByRole("button", { name: /dalej|zakończ|zapisywanie/i }));
}

function clickBack() {
  fireEvent.click(screen.getByRole("button", { name: /wstecz/i }));
}

const SECRET_PHONE = "+48 600 999 111";
const SECRET_BIRTH = "15/03/1990";

async function walkToStep(target: 1 | 2 | 3 | 4 | 5) {
  if (target >= 2) {
    typeInto(screen.getByRole("textbox", { name: /^imię/i }), "Anna");
    typeInto(screen.getByRole("textbox", { name: /^nazwisko/i }), "Kowalska");
    await act(async () => clickNext());
  }
  if (target >= 3) {
    typeInto(screen.getByRole("textbox", { name: /data urodzenia/i }), SECRET_BIRTH);
    await act(async () => clickNext());
  }
  if (target >= 4) {
    typeInto(screen.getByRole("textbox", { name: /^numer telefonu/i }), SECRET_PHONE);
    fireEvent.click(screen.getByRole("checkbox"));
    await act(async () => clickNext());
  }
  if (target >= 5) {
    await act(async () => clickNext());
  }
}

describe("OnboardingFlow", () => {
  test("starts at step 1 and renders progress + brand", () => {
    renderFlow();
    expect(screen.getByRole("link", { name: /platformax/i })).toBeDefined();
    expect(
      screen.getByRole("progressbar", { name: /postęp onboardingu/i }),
    ).toBeDefined();
    expect(screen.getByText(/jak masz na imię/i)).toBeDefined();
    expect(
      (screen.getByRole("button", { name: /wstecz/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  test("blocks advancing without first name + last name", async () => {
    renderFlow();
    await act(async () => clickNext());
    expect(screen.getAllByText(/podaj imię|podaj nazwisko/i).length).toBeGreaterThan(0);
  });

  test("step 2 rejects malformed date", async () => {
    renderFlow();
    await walkToStep(2);
    typeInto(screen.getByRole("textbox", { name: /data urodzenia/i }), "32/13/1800");
    await act(async () => clickNext());
    expect(
      screen.getByText(/format: dzień\/miesiąc\/rok|niepoprawn/i),
    ).toBeDefined();
  });

  test("step 3 requires phone + checkbox confirmation", async () => {
    renderFlow();
    await walkToStep(3);
    await act(async () => clickNext());
    expect(screen.getByText(/podaj numer telefonu/i)).toBeDefined();
    expect(
      screen.getByText(/potwierdź, że numer należy do ciebie/i),
    ).toBeDefined();
  });

  test("step 2 surfaces explicit privacy hint", async () => {
    renderFlow();
    await walkToStep(2);
    expect(screen.getByText(/dane prywatne/i)).toBeDefined();
  });

  test("step 3 surfaces explicit privacy hint", async () => {
    renderFlow();
    await walkToStep(3);
    expect(screen.getByText(/dane prywatne/i)).toBeDefined();
  });

  test("step 4 offers a 'Pomiń ten krok' skip link", async () => {
    renderFlow();
    await walkToStep(4);
    expect(
      screen.getByRole("button", { name: /pomiń ten krok/i }),
    ).toBeDefined();
  });

  test("back button returns to previous step without losing data", async () => {
    renderFlow();
    typeInto(screen.getByRole("textbox", { name: /^imię/i }), "Anna");
    typeInto(screen.getByRole("textbox", { name: /^nazwisko/i }), "Kowalska");
    await act(async () => clickNext());
    await act(async () => clickBack());
    expect((screen.getByRole("textbox", { name: /^imię/i }) as HTMLInputElement).value).toBe(
      "Anna",
    );
  });

  test("completing onboarding calls the profile adapter with backend-shaped input", async () => {
    const profileAdapter = buildProfileAdapter();
    renderFlow({ profileAdapter });
    await walkToStep(5);
    fireEvent.click(screen.getByRole("radio", { name: /profil osobisty/i }));
    await act(async () => clickNext());
    await waitFor(() => {
      expect(profileAdapter.completeOnboarding).toHaveBeenCalled();
    });
    const [userId, input] = (profileAdapter.completeOnboarding as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(userId).toBe("user-test");
    expect(input.firstName).toBe("Anna");
    expect(input.lastName).toBe("Kowalska");
    expect(input.dateOfBirth).toBe("1990-03-15");
    expect(input.phone).toBe(SECRET_PHONE);
  });

  test("displays runtime error from the profile adapter without leaking PII", async () => {
    const profileAdapter = buildProfileAdapter({
      completeOnboarding: vi.fn(async () => ({
        ok: false as const,
        error: {
          code: "INVALID_INPUT" as const,
          message: "Niepoprawne dane wejściowe",
        },
      })),
    });
    renderFlow({ profileAdapter });
    await walkToStep(5);
    fireEvent.click(screen.getByRole("radio", { name: /profil osobisty/i }));
    await act(async () => clickNext());
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/niepoprawne dane/i);
    expect(alert.textContent).not.toContain(SECRET_PHONE);
  });

  test("blocks submission and surfaces a message when no user is authenticated", async () => {
    const authAdapter = buildAuthAdapter();
    (authAdapter.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const profileAdapter = buildProfileAdapter();
    renderFlow({ authAdapter, profileAdapter });
    await walkToStep(5);
    fireEvent.click(screen.getByRole("radio", { name: /profil osobisty/i }));
    await act(async () => clickNext());
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/musisz być zalogowany/i);
    expect(profileAdapter.completeOnboarding).not.toHaveBeenCalled();
  });

  test("completes flow and shows finished view without leaking PII", async () => {
    renderFlow();
    await walkToStep(5);
    fireEvent.click(screen.getByRole("radio", { name: /profil osobisty/i }));
    await act(async () => clickNext());
    await screen.findByRole("heading", { level: 1, name: /wszystko gotowe/i });
    const summary = screen.getByRole("heading", { level: 1 }).parentElement as HTMLElement;
    expect(within(summary).queryByText(SECRET_PHONE)).toBeNull();
    expect(within(summary).queryByText(SECRET_BIRTH)).toBeNull();
    expect(screen.queryByText(SECRET_PHONE)).toBeNull();
    expect(screen.queryByText(SECRET_BIRTH)).toBeNull();
  });

  test("finishing routes to /profile", async () => {
    renderFlow();
    await walkToStep(5);
    fireEvent.click(screen.getByRole("radio", { name: /profil osobisty/i }));
    await act(async () => clickNext());
    const finishBtn = await screen.findByRole("button", { name: /przejdź do profilu/i });
    await act(async () => fireEvent.click(finishBtn));
    expect(screen.getByText("PROFILE_ROUTE")).toBeDefined();
  });
});
