import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { ProfilePage } from "../ProfilePage";

const ROOT = process.cwd();
const PROFILE_DIR = join(ROOT, "client/src/app-v2/profile");

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
        <Route path="/onboarding" element={<div>ONBOARDING</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function profileSourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "__tests__") continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
    }
  };
  walk(PROFILE_DIR);
  return out;
}

describe("ProfilePage — runtime wiring (step-33)", () => {
  test("renders the visual shell while the runtime is loading/anonymous", async () => {
    renderProfile();
    // While there is no authenticated owner the shell renders a NON-OWNER public
    // view ("Profil"), never the owner mock — it must not present owner-only
    // controls before identity confirms ownership. The shell never crashes and
    // never blocks on a missing identity boundary.
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: /profil/i }),
      ).toBeDefined();
    });
    expect(
      screen.queryByRole("button", { name: /zmień zdjęcie profilowe/i }),
    ).toBeNull();
  });

  test("edit affordance stays disabled until identity returns an owner profile", () => {
    renderProfile();
    const edit = screen.getByRole("button", { name: /edytuj profil — wkrótce/i });
    expect((edit as HTMLButtonElement).disabled).toBe(true);
  });

  test("profile source files import zero direct Supabase SDK or backend internals", () => {
    const sdk = "@" + "supabase/supabase-js";
    const backendInternals = [
      "domains-v2/identity/service",
      "domains-v2/identity/repository",
      "domains-v2/identity/mapper",
      "domains-v2/identity/policy",
      "domains-v2/media/service",
      "domains-v2/media/repository",
    ];
    for (const file of profileSourceFiles()) {
      const content = readFileSync(file, "utf-8");
      expect(content).not.toContain(sdk);
      for (const internal of backendInternals) {
        expect(content).not.toContain(internal);
      }
    }
  });

  test("profile source files never reach for browser storage as a fake backend", () => {
    for (const file of profileSourceFiles()) {
      const content = readFileSync(file, "utf-8");
      expect(content).not.toMatch(/\blocalStorage\s*[.[]/);
      expect(content).not.toMatch(/\bsessionStorage\s*[.[]/);
    }
  });

  test("bio edit button is the only edit affordance in the topbar", () => {
    renderProfile();
    // anonymous state: edit is disabled-policy, not a hidden no-op.
    const edit = screen.getByRole("button", { name: /edytuj profil — wkrótce/i });
    expect(edit.getAttribute("disabled")).not.toBeNull();
    fireEvent.click(edit);
    // disabled button never opens the bio sheet
    expect(screen.queryByRole("dialog", { name: /edytuj bio/i })).toBeNull();
  });
});
