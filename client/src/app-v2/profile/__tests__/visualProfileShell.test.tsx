/**
 * Anonymous shell honesty (visualProfileShell).
 *
 * Verifies that the loading/anonymous render uses the dedicated
 * `visualProfileShell` — `isOwner: false` — so owner edit affordances cannot
 * accidentally activate before the data state resolves, while keeping the
 * visual layout identical.
 */
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { ProfilePage } from "../ProfilePage";
import { anonymousDataDeps } from "./testProfileDataDeps";
import { ownerPersonalProfile, visualProfileShell } from "../fixtures";

async function renderAnonymous() {
  let utils!: ReturnType<typeof render>;
  await act(async () => {
    utils = render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route
            path="/profile"
            element={<ProfilePage dataDeps={anonymousDataDeps()} />}
          />
        </Routes>
      </MemoryRouter>,
    );
    await Promise.resolve();
  });
  return utils;
}

describe("visualProfileShell", () => {
  test("is NOT marked as owner — anonymous shell carries no privilege", () => {
    expect(visualProfileShell.isOwner).toBe(false);
  });

  test("preserves the owner fixture's visual look (display name, location, social)", () => {
    expect(visualProfileShell.displayName).toBe(ownerPersonalProfile.displayName);
    expect(visualProfileShell.avatarInitial).toBe(ownerPersonalProfile.avatarInitial);
    expect(visualProfileShell.location).toBe(ownerPersonalProfile.location);
    expect(visualProfileShell.bio).toBe(ownerPersonalProfile.bio);
    expect(visualProfileShell.socialLinks).toEqual(ownerPersonalProfile.socialLinks);
  });

  test("ProfilePage renders the visual shell when anonymous (no owner controls)", async () => {
    await renderAnonymous();
    // Visual data still renders.
    expect(
      screen.getByRole("heading", { level: 1, name: /anna kowalska/i }),
    ).toBeDefined();
    // Owner-only controls do NOT render.
    expect(screen.queryByRole("button", { name: /podgląd profilu/i })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /zmień zdjęcie profilowe/i }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /^zmień baner$/i })).toBeNull();
  });
});
