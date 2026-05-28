import { readFileSync } from "fs";
import { join } from "path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { ProfilePage } from "../ProfilePage";
import { anonymousDataDeps, readyOwnerDataDeps } from "./testProfileDataDeps";

// jsdom does not implement object URLs — stub them so the local preview path works.
beforeAll(() => {
  (URL as unknown as { createObjectURL: () => string }).createObjectURL = vi.fn(
    () => "blob:preview",
  );
  (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = vi.fn();
});


function renderProfileReady() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route
          path="/profile"
          element={<ProfilePage dataDeps={readyOwnerDataDeps("owner-1")} />}
        />
        <Route path="/" element={<div>LANDING</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderProfileAnonymous() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route
          path="/profile"
          element={<ProfilePage dataDeps={anonymousDataDeps()} />}
        />
        <Route path="/" element={<div>LANDING</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function clickEditAvatar() {
  const btn = await screen.findByRole("button", { name: /zmień zdjęcie profilowe/i });
  fireEvent.click(btn);
  return btn;
}

function pngFile() {
  return new File(["x"], "avatar.png", { type: "image/png" });
}

describe("profile media upload sheet (avatar/banner) — ready owner", () => {
  test("avatar edit button opens a local upload sheet (real CTA, not a no-op)", async () => {
    renderProfileReady();
    await clickEditAvatar();
    expect(screen.getByRole("dialog", { name: /zmień zdjęcie profilowe/i })).toBeDefined();
  });

  test("banner edit button opens its own upload sheet", async () => {
    renderProfileReady();
    const btn = await screen.findByRole("button", { name: /^zmień baner$/i });
    fireEvent.click(btn);
    expect(screen.getByRole("dialog", { name: /zmień baner/i })).toBeDefined();
  });

  test("an unsupported file type shows a validation error and no preview", async () => {
    renderProfileReady();
    await clickEditAvatar();
    const input = screen.getByLabelText(/wybierz plik graficzny/i);
    fireEvent.change(input, {
      target: { files: [new File(["x"], "logo.svg", { type: "image/svg+xml" })] },
    });
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/JPG, PNG, WEBP/i);
    expect(screen.queryByAltText(/podgląd wybranego pliku/i)).toBeNull();
  });

  test("a valid image shows a local preview and an honest storage-not-connected notice", async () => {
    renderProfileReady();
    await clickEditAvatar();
    const input = screen.getByLabelText(/wybierz plik graficzny/i);
    fireEvent.change(input, { target: { files: [pngFile()] } });
    expect(await screen.findByAltText(/podgląd wybranego pliku/i)).toBeDefined();
    expect(screen.getByText(/po podłączeniu\s+przechowywania plików/i)).toBeDefined();
  });

  test("save is an explicit disabled-policy state, never a fake success", async () => {
    renderProfileReady();
    await clickEditAvatar();
    const save = screen.getByRole("button", { name: /zapisz — wkrótce/i });
    expect((save as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("profile media upload sheet — anonymous / not-ready", () => {
  test("avatar edit button is NOT rendered when there is no authenticated owner", async () => {
    renderProfileAnonymous();
    // Wait for the state machine to settle on "anonymous".
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /zmień zdjęcie profilowe/i })).toBeNull();
    });
    // No media sheet can open without an owner.
    expect(screen.queryByRole("dialog", { name: /zmień zdjęcie profilowe/i })).toBeNull();
  });

  test("banner edit button is NOT rendered when there is no authenticated owner", async () => {
    renderProfileAnonymous();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /^zmień baner$/i })).toBeNull();
    });
    expect(screen.queryByRole("dialog", { name: /zmień baner/i })).toBeNull();
  });

  test('media attach path never uses fake userId "me"', () => {
    // Source-level invariant: ProfilePage must not synthesize a fallback id.
    // We assert the bug-shape literally cannot appear in the shell.
    const source = readFileSync(
      join(process.cwd(), "client/src/app-v2/profile/ProfilePage.tsx"),
      "utf-8",
    );
    expect(source).not.toMatch(/userId\s*=\s*ownerUserId\s*\?\?\s*["']me["']/);
    expect(source).not.toMatch(/mediaUserId\s*=/);
  });
});
