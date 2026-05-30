/* TEST_FIXTURE — pagination guard safe marker: queryAll calls below are
   @testing-library DOM queries, not runtime list fetches. */
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { ProfilePage } from "../ProfilePage";
import { ownerPersonalProfile, publicPersonalProfile } from "../fixtures";
import type { PersonalProfileView } from "../types";

const ROOT = process.cwd();
const PROFILE_DIR = join(ROOT, "client/src/app-v2/profile");

// The shell tests exercise the OWNER experience, so they pass the owner fixture
// explicitly instead of relying on the runtime fallback (which is intentionally
// a non-owner public view — see the owner-controls tests at the bottom).
function renderProfile(profile: PersonalProfileView = ownerPersonalProfile) {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route path="/profile" element={<ProfilePage profile={profile} />} />
        <Route path="/" element={<div>LANDING</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

// Renders without an explicit profile, so the page uses the live runtime state
// (which starts in "loading" → the non-owner public fallback).
function renderProfileRuntime() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/" element={<div>LANDING</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function profileSourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "__tests__") continue; // scan shell source, not the tests
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
    }
  };
  walk(PROFILE_DIR);
  return out;
}

describe("ProfilePage — personal profile mobile shell", () => {
  test("renders the personal profile at /profile", () => {
    renderProfile();
    expect(
      screen.getByRole("heading", { level: 1, name: /anna kowalska/i }),
    ).toBeDefined();
  });

  test("mobile-critical sections are present", () => {
    renderProfile();
    expect(screen.getByText(/^O mnie$/)).toBeDefined();
    expect(screen.getByRole("tab", { name: /osobisty/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /zawodowy/i })).toBeDefined();
    expect(screen.getByText(/przesuń w lewo\/prawo/i)).toBeDefined();
    expect(screen.queryAllByText(/^Społeczności$/).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryAllByText(/^Kanały$/).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryAllByText(/^Feed znajomych$/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: /^Kontakty$/ })).toBeDefined();
    expect(screen.getByText(/Ostatnie posty/)).toBeDefined();
    expect(screen.getByRole("heading", { name: /Prezentacja profilu/ })).toBeDefined();
    expect(screen.getByRole("heading", { name: /Ważne wydarzenia/ })).toBeDefined();
  });

  test("empty content states render for posts and milestones", () => {
    renderProfile();
    expect(screen.getByText(/Brak postów/)).toBeDefined();
    expect(screen.getByText(/Brak ważnych wydarzeń/)).toBeDefined();
  });

  test("desktop adaptation: personal content sections share one responsive grid wrapper", () => {
    renderProfile();
    const presentation = screen.getByRole("region", { name: /Prezentacja profilu/ });
    const milestones = screen.getByRole("region", { name: /Ważne wydarzenia/ });
    // both sections live under the same wrapper div (desktop turns it into a grid;
    // on mobile the wrapper is display:contents, so the mobile flow is unchanged)
    expect(presentation.parentElement).not.toBeNull();
    expect(presentation.parentElement).toBe(milestones.parentElement);
    expect(presentation.parentElement?.tagName).toBe("DIV");
  });

  test("desktop-critical regions and the mobile header order both remain present", () => {
    renderProfile();
    // same content the desktop layout re-flows — must keep existing on all widths
    expect(screen.getByRole("heading", { level: 1, name: /anna kowalska/i })).toBeDefined();
    expect(screen.getByRole("region", { name: /Kontakty/ })).toBeDefined();
    expect(screen.queryAllByText(/^Społeczności$/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("region", { name: /Prezentacja profilu/ })).toBeDefined();
    expect(screen.getByRole("region", { name: /Ważne wydarzenia/ })).toBeDefined();
  });

  test("preview eye CTA toggles local preview state (not a no-op)", () => {
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /podgląd profilu/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /widok znajomego/i }));
    expect(screen.getByText(/widok znajomego/i)).toBeDefined();
    expect(screen.getByText(/Znajomi widzą Twój feed/i)).toBeDefined();
  });

  test("quick feed CTA expands via local state", () => {
    renderProfile();
    const toggle = screen.getByRole("button", { name: /ostatnie posty/i });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  test("quick feed tile click opens a local post-detail sheet (visual shell)", async () => {
    renderProfile();
    const toggle = screen.getByRole("button", { name: /ostatnie posty/i });
    fireEvent.click(toggle);
    // skeleton runs for ~350ms on first open; tile accessible name = author + body,
    // so we match on the body text to disambiguate from contacts-carousel buttons.
    const tile = await screen.findByRole(
      "button",
      { name: /marek dodał/i },
      { timeout: 2000 },
    );
    fireEvent.click(tile);
    const dialog = await screen.findByRole("dialog", { name: /podgląd posta/i });
    expect(dialog).toBeDefined();
    // visual shell — reactions/comments are honest disabled placeholders
    expect(screen.getByText(/podgląd posta jest wizualnym szkieletem/i)).toBeDefined();
  });

  test("no undefined classname leaks through the split CSS modules", () => {
    const { container } = renderProfile();
    // switching to the professional tab activates the second module set
    fireEvent.click(screen.getByRole("tab", { name: /^Zawodowy$/ }));
    // any `class="undefined"` or "_undefined_" means a section is importing a
    // class from a module that does not export it (cross-module bug)
    expect(container.querySelectorAll('[class*="undefined"]').length).toBe(0);
    expect(container.querySelectorAll('[class*="_undefined_"]').length).toBe(0);
  });

  test("specialists toggle (visibility switch) flips local state", () => {
    renderProfile();
    fireEvent.click(screen.getByRole("tab", { name: /^Zawodowy$/ }));
    const toggle = screen.getByRole("button", { name: /ukryj sekcję specjalistów/i });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(toggle);
    expect(
      screen.getByRole("button", { name: /pokaż sekcję specjalistów/i }).getAttribute("aria-pressed"),
    ).toBe("false");
  });

  test("professional Klasyczny tab renders 'Moja praca' disabled anchor + 'Moduł w budowie'", () => {
    renderProfile();
    fireEvent.click(screen.getByRole("tab", { name: /^Zawodowy$/ }));
    const mojaPraca = screen.getByRole("button", { name: /moja praca/i });
    expect((mojaPraca as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/moduł w budowie/i)).toBeDefined();
    expect(screen.getByText(/sekcja miejsce pracy jest w przygotowaniu/i)).toBeDefined();
  });

  test("floating navigation is mounted on /profile with profil as active", () => {
    renderProfile();
    const profil = screen.getByRole("button", { name: /^profil$/i });
    expect(profil.getAttribute("aria-current")).toBe("page");
  });

  test("contacts tabs filter the carousel via local state", () => {
    renderProfile();
    expect(screen.getByText(/Wójcik/)).toBeDefined(); // family_extended visible under "Wszyscy"
    fireEvent.click(screen.getByRole("tab", { name: /^Bliscy/ }));
    expect(screen.queryByText(/Wójcik/)).toBeNull(); // filtered out of "Bliscy"
  });

  test("CTAs that need a backend are disabled-policy, never silent no-ops", () => {
    renderProfile();
    const matchedCommunities = screen.queryAllByText(/^Społeczności$/);
    const portalBtn = matchedCommunities.map((el) => el.closest("button")).find((b) => b?.disabled);
    expect(portalBtn?.disabled).toBe(true);
  });

  test("professional layer is a MODE of the same profile (workplaces feature is a UI shell, not a separate domain)", () => {
    renderProfile();
    // default mode is personal: professional content is not shown
    expect(screen.queryByText(/Specjaliści/)).toBeNull();
    // switching to the professional tab reveals the professional layer in place
    fireEvent.click(screen.getByRole("tab", { name: /^Zawodowy$/ }));
    expect(screen.getByRole("heading", { name: /Specjaliści/ })).toBeDefined();
    expect(screen.getByText(/Dodaj zawód/)).toBeDefined();
    // personal-only sections are hidden in professional mode
    expect(screen.queryByRole("region", { name: /^Kontakty$/ })).toBeNull();
    // Slice 12 introduces the `professional-profile` feature for workplaces UI
    // (UI_SHELL_ONLY + MOCK_LOCAL_ONLY). It is a UI feature folder, NOT a
    // separate backend domain — backend workplaces live under
    // `server/domains-v2/identity/workplaces/*` (still part of identity).
    expect(existsSync(join(ROOT, "client/src/features-v2/professional-profile"))).toBe(true);
    expect(existsSync(join(ROOT, "server/domains-v2/professional-profile"))).toBe(false);
    expect(existsSync(join(ROOT, "server/domains-v2/identity/workplaces"))).toBe(true);
  });

  test("can switch back to personal after professional (mode is local view state)", () => {
    renderProfile();
    fireEvent.click(screen.getByRole("tab", { name: /^Zawodowy$/ }));
    expect(screen.getByRole("region", { name: /Zawód/ })).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: /^Osobisty$/ }));
    expect(screen.getByRole("region", { name: /^Kontakty$/ })).toBeDefined();
    expect(screen.queryByRole("heading", { name: /Specjaliści/ })).toBeNull();
  });

  test("professional layer renders its sections and CTAs are not no-ops", () => {
    renderProfile();
    fireEvent.click(screen.getByRole("tab", { name: /^Zawodowy$/ }));
    expect(screen.getByRole("region", { name: /^Zawód$/ })).toBeDefined();
    expect(screen.getByRole("region", { name: /Specjaliści/ })).toBeDefined();
    expect(screen.getByRole("region", { name: /Działania zawodowe/ })).toBeDefined();
    // Klasyczny/Sieć tabs switch via local state
    fireEvent.click(screen.getByRole("tab", { name: /^Sieć$/ }));
    expect(screen.getByText(/Dodaj działania aby zobaczyć widok sieci/)).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: /^Klasyczny$/ }));
    // "add activity" opens a local sheet (real CTA, not a no-op)
    fireEvent.click(screen.getByRole("button", { name: /Dodaj działanie zawodowe/ }));
    expect(screen.getByRole("dialog", { name: /Co chcesz dodać/ })).toBeDefined();
  });

  test("desktop adaptation: professional sections share one responsive grid wrapper", () => {
    renderProfile();
    fireEvent.click(screen.getByRole("tab", { name: /^Zawodowy$/ }));
    const zawod = screen.getByRole("region", { name: /^Zawód$/ });
    const specialists = screen.getByRole("region", { name: /Specjaliści/ });
    const activities = screen.getByRole("region", { name: /Działania zawodowe/ });
    // all professional sections live under one wrapper div (desktop = grid;
    // mobile wrapper is display:contents, so the mobile flow is unchanged)
    expect(zawod.parentElement).toBe(specialists.parentElement);
    expect(specialists.parentElement).toBe(activities.parentElement);
    expect(zawod.parentElement?.tagName).toBe("DIV");
  });

  test("public render contains no private PII (phone / dateOfBirth / private email)", () => {
    const { container } = renderProfile();
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/\+?\d[\d\s().-]{6,}\d/); // phone-like
    expect(text.toLowerCase()).not.toContain("dateofbirth");
    expect(text).not.toContain("data urodzenia");
    expect(container.querySelector('input[type="tel"]')).toBeNull();
    // no e-mail address rendered as visible text
    expect(text).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  });

  test("desktop sidebar is rendered", () => {
    renderProfile();
    expect(screen.getByRole("complementary", { name: /menu boczne/i })).toBeDefined();
  });

  test("portal cards render in fixed order: Społeczności, Kanały, Feed znajomych", () => {
    const { container } = renderProfile();
    const portalBtns = Array.from(container.querySelectorAll("button[title]"));
    const texts = portalBtns.map((b) => b.textContent ?? "");
    const commIdx = texts.findIndex((t) => t.includes("Społeczności"));
    const chanIdx = texts.findIndex((t) => t.includes("Kanały"));
    const feedIdx = texts.findIndex((t) => t.includes("Feed znajomych"));
    expect(commIdx).toBeGreaterThanOrEqual(0);
    expect(chanIdx).toBeGreaterThan(commIdx);
    expect(feedIdx).toBeGreaterThan(chanIdx);
  });

  test("profile source files contain no href='#'", () => {
    for (const file of profileSourceFiles()) {
      const content = readFileSync(file, "utf-8");
      expect(content).not.toMatch(/href\s*=\s*["']#["']/);
    }
  });

  test("profile CSS files contain no transition: all", () => {
    const cssDir = join(PROFILE_DIR, "styles");
    if (existsSync(cssDir)) {
      for (const entry of readdirSync(cssDir)) {
        if (!entry.endsWith(".css")) continue;
        const content = readFileSync(join(cssDir, entry), "utf-8");
        expect(content).not.toMatch(/transition\s*:\s*all\b/);
      }
    }
  });

  test("profile source files contain no window.alert or window.confirm", () => {
    for (const file of profileSourceFiles()) {
      const content = readFileSync(file, "utf-8");
      expect(content).not.toMatch(/window\s*\.\s*alert\s*\(/);
      expect(content).not.toMatch(/window\s*\.\s*confirm\s*\(/);
    }
  });

  test("profile source imports no legacy runtime, Supabase, upload, or localStorage", () => {
    // Needles are assembled from parts so the forbidden literals never appear
    // contiguously in this file (governance guards also scan this tree).
    const sdk = "@" + "supabase/supabase-js";
    const legacyDirs = ["fea" + "tures", "pa" + "ges", "compo" + "nents"];
    const legacyImport = new RegExp(`from\\s+["'][^"']*/(${legacyDirs.join("|")})/`);
    const uploadNeedles = [
      "readAs" + "DataURL",
      "data" + "Url",
      "base" + "64",
      "File" + "Reader",
    ];
    for (const file of profileSourceFiles()) {
      const content = readFileSync(file, "utf-8");
      expect(content).not.toContain(sdk);
      expect(content).not.toMatch(legacyImport);
      // usage (not mere mention in a comment) of forbidden web storage
      expect(content).not.toMatch(/\blocalStorage\s*[.[]/);
      expect(content).not.toMatch(/\bsessionStorage\s*[.[]/);
      for (const needle of uploadNeedles) {
        expect(content.toLowerCase()).not.toContain(needle.toLowerCase());
      }
    }
  });

  test("explicit non-owner (public) profile activates no owner-only controls", () => {
    renderProfile(publicPersonalProfile);
    // avatar edit + preview eye are owner-only affordances
    expect(
      screen.queryByRole("button", { name: /zmień zdjęcie profilowe/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /podgląd profilu/i }),
    ).toBeNull();
  });

  test("non-ready runtime (loading/anonymous) falls back to a non-owner view", () => {
    // No explicit profile → live runtime state, which starts "loading".
    renderProfileRuntime();
    // The fallback is the public profile ("Profil"), never the owner mock.
    expect(
      screen.getByRole("heading", { level: 1, name: /profil/i }),
    ).toBeDefined();
    // Owner-only controls must not be active before ownership is confirmed.
    expect(
      screen.queryByRole("button", { name: /zmień zdjęcie profilowe/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /podgląd profilu/i }),
    ).toBeNull();
  });

  test("owner fixture without ready runtime still hides avatar/banner edit (editEnabled gate)", () => {
    // Even though the explicit profile fixture has isOwner=true, the runtime
    // useProfileData hook starts in "loading" (no real auth wired in jsdom).
    // editEnabled = ownerUserId !== null AND profile.isOwner — so owner-only
    // mutate controls MUST stay hidden until the runtime actually confirms
    // ownership. This regression-test pins that we never route an explicit
    // owner profile straight through to mutate CTAs.
    renderProfile(ownerPersonalProfile);
    expect(
      screen.queryByRole("button", { name: /zmień zdjęcie profilowe/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /^zmień baner$/i }),
    ).toBeNull();
  });
});
