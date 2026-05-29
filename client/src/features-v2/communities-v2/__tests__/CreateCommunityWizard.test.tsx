import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { CommunityCategoryDTO } from "@shared/contracts/communities";
import { CreateCommunityWizard } from "../wizard/CreateCommunityWizard";
import { communitiesMockAdapter } from "../mock-adapter";

const CATEGORIES: readonly CommunityCategoryDTO[] = [
  { slug: "technologia", name: "Technologia", emoji: "💻", sortOrder: 1 },
  { slug: "sport",       name: "Sport i ruch", emoji: "🏃", sortOrder: 2 },
];

function renderWizard(onCreated = vi.fn(), onCancel = vi.fn()) {
  return {
    onCreated,
    onCancel,
    ...render(
      <MemoryRouter>
        <CreateCommunityWizard categories={CATEGORIES} onCreated={onCreated} onCancel={onCancel} />
      </MemoryRouter>,
    ),
  };
}

describe("CreateCommunityWizard — Slice 1 4-step flow", () => {
  beforeEach(() => {
    communitiesMockAdapter.__resetForTests();
  });

  test("step 1 disables Dalej until name has ≥3 chars", async () => {
    renderWizard();
    expect(screen.getByText(/Krok 1 z 4 — Podstawy/)).toBeInTheDocument();
    const next = screen.getByRole("button", { name: /Dalej/ });
    expect(next).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Nazwa społeczności/), { target: { value: "Ab" } });
    expect(next).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Nazwa społeczności/), { target: { value: "Nowa społeczność" } });
    await waitFor(() => expect(next).toBeEnabled());
  });

  test("complete 4-step flow creates community via adapter and reports profile", async () => {
    const { onCreated } = renderWizard();
    fireEvent.change(screen.getByLabelText(/Nazwa społeczności/), { target: { value: "DevsPL" } });
    await waitFor(() => expect(screen.getByRole("button", { name: /Dalej/ })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: /Dalej/ }));
    expect(screen.getByText(/Krok 2 z 4 — Kategoria/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Technologia/ }));
    fireEvent.click(screen.getByRole("button", { name: /Dalej/ }));
    expect(screen.getByText(/Krok 3 z 4 — Lokalizacja/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Online/ }));
    fireEvent.click(screen.getByRole("button", { name: /Dalej/ }));
    expect(screen.getByText(/Krok 4 z 4 — Utwórz/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "DevsPL" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Utwórz społeczność/ }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    const profile = onCreated.mock.calls[0][0];
    expect(profile.slug).toBe("devspl");
  });

  test("back button returns to previous step", async () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText(/Nazwa społeczności/), { target: { value: "DevsPL" } });
    await waitFor(() => expect(screen.getByRole("button", { name: /Dalej/ })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: /Dalej/ }));
    expect(screen.getByText(/Krok 2 z 4/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Wstecz" }));
    expect(screen.getByText(/Krok 1 z 4/)).toBeInTheDocument();
  });

  test("cancel button calls onCancel", async () => {
    const { onCancel } = renderWizard();
    fireEvent.click(screen.getByRole("button", { name: "Zamknij kreator" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
