// TEST_FIXTURE: testing-library helpers (getAllByRole) used to enumerate
// rendered DOM — not a runtime list query (see scripts/check-pagination.mjs).
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { OnboardingFlow } from "../OnboardingFlow";

function renderFlow() {
  return render(
    <MemoryRouter initialEntries={["/onboarding"]}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingFlow />} />
        <Route path="/" element={<div>HOME_ROUTE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function typeInto(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

function clickNext() {
  fireEvent.click(screen.getByRole("button", { name: /dalej|zakończ/i }));
}

function clickBack() {
  fireEvent.click(screen.getByRole("button", { name: /wstecz/i }));
}

const SECRET_PHONE = "+48 600 999 111";
const SECRET_BIRTH = "15/03/1990";

function walkToStep(target: 1 | 2 | 3 | 4 | 5) {
  if (target >= 2) {
    typeInto(screen.getByRole("textbox", { name: /^imię/i }), "Anna");
    typeInto(screen.getByRole("textbox", { name: /^nazwisko/i }), "Kowalska");
    clickNext();
  }
  if (target >= 3) {
    typeInto(screen.getByRole("textbox", { name: /data urodzenia/i }), SECRET_BIRTH);
    clickNext();
  }
  if (target >= 4) {
    typeInto(screen.getByRole("textbox", { name: /^numer telefonu/i }), SECRET_PHONE);
    fireEvent.click(screen.getByRole("checkbox"));
    clickNext();
  }
  if (target >= 5) {
    clickNext();
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

  test("blocks advancing without first name + last name", () => {
    renderFlow();
    clickNext();
    expect(screen.getAllByText(/podaj imię|podaj nazwisko/i).length).toBeGreaterThan(0);
  });

  test("step 2 rejects malformed date", () => {
    renderFlow();
    walkToStep(2);
    typeInto(screen.getByRole("textbox", { name: /data urodzenia/i }), "32/13/1800");
    clickNext();
    expect(
      screen.getByText(/format: dzień\/miesiąc\/rok|niepoprawn/i),
    ).toBeDefined();
  });

  test("step 3 requires phone + checkbox confirmation", () => {
    renderFlow();
    walkToStep(3);
    clickNext();
    expect(screen.getByText(/podaj numer telefonu/i)).toBeDefined();
    expect(
      screen.getByText(/potwierdź, że numer należy do ciebie/i),
    ).toBeDefined();
  });

  test("step 2 surfaces explicit privacy hint", () => {
    renderFlow();
    walkToStep(2);
    expect(screen.getByText(/dane prywatne/i)).toBeDefined();
  });

  test("step 3 surfaces explicit privacy hint", () => {
    renderFlow();
    walkToStep(3);
    expect(screen.getByText(/dane prywatne/i)).toBeDefined();
  });

  test("step 4 offers a 'Pomiń ten krok' skip link", () => {
    renderFlow();
    walkToStep(4);
    expect(
      screen.getByRole("button", { name: /pomiń ten krok/i }),
    ).toBeDefined();
  });

  test("back button returns to previous step without losing data", () => {
    renderFlow();
    typeInto(screen.getByRole("textbox", { name: /^imię/i }), "Anna");
    typeInto(screen.getByRole("textbox", { name: /^nazwisko/i }), "Kowalska");
    clickNext();
    clickBack();
    expect((screen.getByRole("textbox", { name: /^imię/i }) as HTMLInputElement).value).toBe(
      "Anna",
    );
  });

  test("completes flow and shows finished view without leaking PII", () => {
    renderFlow();
    walkToStep(5);
    // pick profile
    fireEvent.click(screen.getByRole("radio", { name: /profil osobisty/i }));
    clickNext();
    // finished view
    expect(
      screen.getByRole("heading", { level: 1, name: /wszystko gotowe/i }),
    ).toBeDefined();
    const summary = screen.getByRole("heading", { level: 1 }).parentElement as HTMLElement;
    // PII must not appear anywhere in the finished view
    expect(within(summary).queryByText(SECRET_PHONE)).toBeNull();
    expect(within(summary).queryByText(SECRET_BIRTH)).toBeNull();
    // and the page-wide check
    expect(screen.queryByText(SECRET_PHONE)).toBeNull();
    expect(screen.queryByText(SECRET_BIRTH)).toBeNull();
  });
});
