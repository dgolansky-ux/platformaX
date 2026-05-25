import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { ProfilePage } from "../ProfilePage";

// jsdom does not implement object URLs — stub them so the local preview path works.
beforeAll(() => {
  (URL as unknown as { createObjectURL: () => string }).createObjectURL = vi.fn(
    () => "blob:preview",
  );
  (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = vi.fn();
});

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/" element={<div>LANDING</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function pngFile() {
  return new File(["x"], "avatar.png", { type: "image/png" });
}

describe("profile media upload sheet (avatar/banner)", () => {
  test("avatar edit button opens a local upload sheet (real CTA, not a no-op)", () => {
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /zmień zdjęcie profilowe/i }));
    expect(screen.getByRole("dialog", { name: /zmień zdjęcie profilowe/i })).toBeDefined();
  });

  test("banner edit button opens its own upload sheet", () => {
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /^zmień baner$/i }));
    expect(screen.getByRole("dialog", { name: /zmień baner/i })).toBeDefined();
  });

  test("an unsupported file type shows a validation error and no preview", async () => {
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /zmień zdjęcie profilowe/i }));
    const input = screen.getByLabelText(/wybierz plik graficzny/i);
    fireEvent.change(input, {
      target: { files: [new File(["x"], "logo.svg", { type: "image/svg+xml" })] },
    });
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/JPG, PNG, WEBP/i);
    expect(screen.queryByAltText(/podgląd wybranego pliku/i)).toBeNull();
  });

  test("a valid image shows a local preview and an honest storage-not-connected notice", async () => {
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /zmień zdjęcie profilowe/i }));
    const input = screen.getByLabelText(/wybierz plik graficzny/i);
    fireEvent.change(input, { target: { files: [pngFile()] } });
    expect(await screen.findByAltText(/podgląd wybranego pliku/i)).toBeDefined();
    expect(screen.getByText(/po podłączeniu\s+przechowywania plików/i)).toBeDefined();
  });

  test("save is an explicit disabled-policy state, never a fake success", () => {
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /zmień zdjęcie profilowe/i }));
    const save = screen.getByRole("button", { name: /zapisz — wkrótce/i });
    expect((save as HTMLButtonElement).disabled).toBe(true);
  });
});
