import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { WorkplaceWizard } from "../WorkplaceWizard";
import { professionalProfileMockAdapter } from "../mock-adapter";

describe("WorkplaceWizard", () => {
  beforeEach(() => {
    professionalProfileMockAdapter.__resetForTests();
  });

  test("walks through all 5 steps and calls onCreated with the new card", async () => {
    const onCreated = vi.fn();
    render(<WorkplaceWizard viewerUserId="u-viewer" onCreated={onCreated} />);

    // Step 0 — Basics
    expect(await screen.findByRole("heading", { name: /Podstawy/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Nazwa miejsca pracy/), { target: { value: "Moja Praca" } });
    fireEvent.change(screen.getByLabelText(/Adres URL/), { target: { value: "moja-praca" } });
    fireEvent.click(screen.getByRole("button", { name: "Dalej" }));

    // Step 1 — Profession (DATA_PENDING)
    expect(await screen.findByRole("heading", { name: /Zawód i obszar/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dalej" }));

    // Step 2 — Contact
    expect(await screen.findByRole("heading", { name: /Kontakt i linki/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Strona www"), { target: { value: "https://example.org" } });
    fireEvent.click(screen.getByRole("button", { name: "Dalej" }));

    // Step 3 — Presentation
    expect(await screen.findByRole("heading", { name: /Prezentacja/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dalej" }));

    // Step 4 — Summary
    expect(await screen.findByRole("heading", { name: /Podsumowanie/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Utwórz miejsce pracy/ }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    const card = onCreated.mock.calls[0][0];
    expect(card.slug).toBe("moja-praca");
    expect(card.name).toBe("Moja Praca");
  });

  test("blocks step 1 without name + slug", async () => {
    const onCreated = vi.fn();
    render(<WorkplaceWizard viewerUserId="u-viewer" onCreated={onCreated} />);
    fireEvent.click(await screen.findByRole("button", { name: "Dalej" }));
    expect(await screen.findByText(/Nazwa i adres URL są wymagane/)).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  test("rejects unsafe javascript: URL with truthful error", async () => {
    const onCreated = vi.fn();
    render(<WorkplaceWizard viewerUserId="u-viewer" onCreated={onCreated} />);
    fireEvent.change(screen.getByLabelText(/Nazwa miejsca pracy/), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText(/Adres URL/), { target: { value: "test-wp" } });
    fireEvent.click(screen.getByRole("button", { name: "Dalej" }));
    fireEvent.click(await screen.findByRole("button", { name: "Dalej" }));
    fireEvent.change(await screen.findByLabelText("Strona www"), {
      target: { value: "javascript:alert(1)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Dalej" }));
    fireEvent.click(await screen.findByRole("button", { name: "Dalej" }));
    fireEvent.click(await screen.findByRole("button", { name: /Utwórz miejsce pracy/ }));
    expect(await screen.findByText(/Adres strony www jest niebezpieczny/)).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });
});
