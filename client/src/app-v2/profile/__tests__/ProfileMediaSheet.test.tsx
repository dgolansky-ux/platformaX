import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { ownerPersonalProfile } from "../fixtures";

// Avatar/banner edit are owner-only affordances and gated by `editEnabled`,
// which requires BOTH an isOwner profile AND a "ready" runtime state with a
// real ownerUserId. The shell intentionally hides the edit buttons until the
// runtime confirms ownership — so test rendering must inject a ready runtime,
// not just the owner fixture.
vi.mock("../data/useProfileData", () => ({
  useProfileData: () => ({
    state: { kind: "ready", userId: "owner-test-user", view: ownerPersonalProfile },
    reload: vi.fn(),
  }),
}));

// Imported after the mock so ProfilePage picks up the mocked hook.
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
        <Route path="/profile" element={<ProfilePage profile={ownerPersonalProfile} />} />
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
    const input = screen.getByLabelText(/wybierz nowe zdjęcie/i);
    fireEvent.change(input, {
      target: { files: [new File(["x"], "logo.svg", { type: "image/svg+xml" })] },
    });
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/niedozwolony typ pliku/i);
  });

  test("a valid image shows a local preview and an honest storage-not-connected notice", async () => {
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /zmień zdjęcie profilowe/i }));
    const input = screen.getByLabelText(/wybierz nowe zdjęcie/i);
    fireEvent.change(input, { target: { files: [pngFile()] } });
    expect(await screen.findByAltText(/avatar/i)).toBeDefined();
    expect(
      screen.getByText(/przechowywanie plików nie jest jeszcze podłączone/i),
    ).toBeDefined();
  });

  test("no fake save action while storage is offline", () => {
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /zmień zdjęcie profilowe/i }));
    expect(screen.queryByRole("button", { name: /zapisz/i })).toBeNull();
    const dialog = screen.getByRole("dialog", { name: /zmień zdjęcie profilowe/i });
    expect(dialog.querySelector("button[aria-label='Zamknij']")).toBeTruthy();
  });
});
