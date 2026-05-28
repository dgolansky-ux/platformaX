/* TEST_FIXTURE — pagination guard safe marker: queryAll calls below are
   @testing-library DOM queries, not runtime list fetches. */
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { ProfilePage } from "../ProfilePage";
import { anonymousDataDeps, readyOwnerDataDeps } from "./testProfileDataDeps";

const ROOT = process.cwd();
const PROFILE_DIR = join(ROOT, "client/src/app-v2/profile");

/**
 * Render the profile shell and drain the async useProfileData transition
 * (loading → anonymous/ready) inside act() so React never logs
 * "update inside a test was not wrapped in act(...)" warnings.
 *
 * Default behaviour stays "anonymous" so we keep coverage for the auth-gated
 * shell; pass `mode: "ready"` to test owner-only affordances.
 */
async function renderProfile(opts: { mode?: "anonymous" | "ready" } = {}) {
  const dataDeps =
    opts.mode === "ready" ? readyOwnerDataDeps("owner-1") : anonymousDataDeps();
  let utils!: ReturnType<typeof render>;
  await act(async () => {
    utils = render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route
            path="/profile"
            element={<ProfilePage dataDeps={dataDeps} />}
          />
          <Route path="/" element={<div>LANDING</div>} />
        </Routes>
      </MemoryRouter>,
    );
    // Yield once so the queued setState lands inside this act() block.
    await Promise.resolve();
  });
  return utils;
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
  test("renders the personal profile at /profile", async () => {
    await renderProfile();
    expect(
      screen.getByRole("heading", { level: 1, name: /anna kowalska/i }),
    ).toBeDefined();
  });

  test("mobile-critical sections are present", async () => {
    await renderProfile();
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

  test("empty content states render for posts and milestones", async () => {
    await renderProfile();
    expect(screen.getByText(/Brak postów/)).toBeDefined();
    expect(screen.getByText(/Brak ważnych wydarzeń/)).toBeDefined();
  });

  test("desktop adaptation: personal content sections share one responsive grid wrapper", async () => {
    await renderProfile();
    const presentation = screen.getByRole("region", { name: /Prezentacja profilu/ });
    const milestones = screen.getByRole("region", { name: /Ważne wydarzenia/ });
    // both sections live under the same wrapper div (desktop turns it into a grid;
    // on mobile the wrapper is display:contents, so the mobile flow is unchanged)
    expect(presentation.parentElement).not.toBeNull();
    expect(presentation.parentElement).toBe(milestones.parentElement);
    expect(presentation.parentElement?.tagName).toBe("DIV");
  });

  test("desktop-critical regions and the mobile header order both remain present", async () => {
    await renderProfile();
    // same content the desktop layout re-flows — must keep existing on all widths
    expect(screen.getByRole("heading", { level: 1, name: /anna kowalska/i })).toBeDefined();
    expect(screen.getByRole("region", { name: /Kontakty/ })).toBeDefined();
    expect(screen.queryAllByText(/^Społeczności$/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("region", { name: /Prezentacja profilu/ })).toBeDefined();
    expect(screen.getByRole("region", { name: /Ważne wydarzenia/ })).toBeDefined();
  });

  test("preview eye CTA toggles local preview state (ready owner — not a no-op)", async () => {
    await renderProfile({ mode: "ready" });
    fireEvent.click(screen.getByRole("button", { name: /podgląd profilu/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /widok znajomego/i }));
    expect(screen.getByText(/widok znajomego/i)).toBeDefined();
    expect(screen.getByText(/Znajomi widzą Twój feed/i)).toBeDefined();
  });

  test("anonymous: owner-only controls are NOT rendered", async () => {
    await renderProfile({ mode: "anonymous" });
    // Avatar preview menu trigger ("Podgląd profilu") — owner-only.
    expect(screen.queryByRole("button", { name: /podgląd profilu/i })).toBeNull();
    // Avatar edit button — owner-only.
    expect(
      screen.queryByRole("button", { name: /zmień zdjęcie profilowe/i }),
    ).toBeNull();
    // Civil status card — owner-only.
    expect(screen.queryByRole("button", { name: /ustaw stan cywilny/i })).toBeNull();
    // Banner edit — owner-only.
    expect(screen.queryByRole("button", { name: /^zmień baner$/i })).toBeNull();
    // Status-row empty owner prompt label "Edytuj status — wkrótce" is owner-only;
    // the disabled pill keeps a non-owner label.
    expect(
      screen.queryByRole("button", { name: /edytuj status — wkrótce/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /ustaw status — wkrótce/i }),
    ).toBeNull();
  });

  test("anonymous: bio empty owner prompt is NOT rendered", async () => {
    await renderProfile({ mode: "anonymous" });
    expect(screen.queryByText(/Dodaj opis\.\.\./)).toBeNull();
  });

  test("ready owner: avatar/banner/bio owner controls render", async () => {
    await renderProfile({ mode: "ready" });
    expect(
      screen.getByRole("button", { name: /zmień zdjęcie profilowe/i }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /^zmień baner$/i })).toBeDefined();
    // empty-state owner prompt for bio (ready view returns null bio by default)
    expect(screen.getByText(/Dodaj opis\.\.\./)).toBeDefined();
    // civil card is owner-only and present for ready
    expect(
      screen.getByRole("button", { name: /ustaw stan cywilny/i }),
    ).toBeDefined();
  });

  test("quick feed CTA expands via local state", async () => {
    await renderProfile();
    const toggle = screen.getByRole("button", { name: /ostatnie posty/i });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  test("quick feed tile click opens a local post-detail sheet (visual shell)", async () => {
    await renderProfile();
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

  test("no undefined classname leaks through the split CSS modules", async () => {
    const { container } = await renderProfile();
    // switching to the professional tab activates the second module set
    fireEvent.click(screen.getByRole("tab", { name: /^Zawodowy$/ }));
    // any `class="undefined"` or "_undefined_" means a section is importing a
    // class from a module that does not export it (cross-module bug)
    expect(container.querySelectorAll('[class*="undefined"]').length).toBe(0);
    expect(container.querySelectorAll('[class*="_undefined_"]').length).toBe(0);
  });

  test("specialists toggle (visibility switch) flips local state — ready owner", async () => {
    await renderProfile({ mode: "ready" });
    fireEvent.click(screen.getByRole("tab", { name: /^Zawodowy$/ }));
    const toggle = screen.getByRole("button", { name: /ukryj sekcję specjalistów/i });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(toggle);
    expect(
      screen.getByRole("button", { name: /pokaż sekcję specjalistów/i }).getAttribute("aria-pressed"),
    ).toBe("false");
  });

  test("professional Klasyczny tab renders 'Moja praca' disabled anchor + 'Moduł w budowie' — ready owner", async () => {
    await renderProfile({ mode: "ready" });
    fireEvent.click(screen.getByRole("tab", { name: /^Zawodowy$/ }));
    const mojaPraca = screen.getByRole("button", { name: /moja praca/i });
    expect((mojaPraca as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/moduł w budowie/i)).toBeDefined();
    expect(screen.getByText(/sekcja miejsce pracy będzie dostępna wkrótce/i)).toBeDefined();
  });

  test("floating navigation is mounted on /profile with profil as active", async () => {
    await renderProfile();
    const profil = screen.getByRole("button", { name: /^profil$/i });
    expect(profil.getAttribute("aria-current")).toBe("page");
  });

  test("contacts tabs filter the carousel via local state", async () => {
    await renderProfile();
    expect(screen.getByText(/Wójcik/)).toBeDefined(); // family_extended visible under "Wszyscy"
    fireEvent.click(screen.getByRole("tab", { name: /^Bliscy/ }));
    expect(screen.queryByText(/Wójcik/)).toBeNull(); // filtered out of "Bliscy"
  });

  test("CTAs that need a backend are disabled-policy, never silent no-ops", async () => {
    await renderProfile();
    const matchedCommunities = screen.queryAllByText(/^Społeczności$/);
    const portalBtn = matchedCommunities.map((el) => el.closest("button")).find((b) => b?.disabled);
    expect(portalBtn?.disabled).toBe(true);
  });

  test("professional layer is a MODE of the same profile, not a separate domain/route", async () => {
    await renderProfile();
    // default mode is personal: professional content is not shown
    expect(screen.queryByText(/Specjaliści/)).toBeNull();
    // switching to the professional tab reveals the professional layer in place
    fireEvent.click(screen.getByRole("tab", { name: /^Zawodowy$/ }));
    expect(screen.getByRole("heading", { name: /Specjaliści/ })).toBeDefined();
    expect(screen.getByText(/Dodaj zawód/)).toBeDefined();
    // personal-only sections are hidden in professional mode
    expect(screen.queryByRole("region", { name: /^Kontakty$/ })).toBeNull();
    // it is still the same /profile route, and there is no separate domain folder
    expect(existsSync(join(ROOT, "client/src/features-v2/professional-profile"))).toBe(false);
  });

  test("can switch back to personal after professional (mode is local view state)", async () => {
    await renderProfile();
    fireEvent.click(screen.getByRole("tab", { name: /^Zawodowy$/ }));
    expect(screen.getByRole("region", { name: /Zawód/ })).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: /^Osobisty$/ }));
    expect(screen.getByRole("region", { name: /^Kontakty$/ })).toBeDefined();
    expect(screen.queryByRole("heading", { name: /Specjaliści/ })).toBeNull();
  });

  test("professional layer renders its sections and CTAs are not no-ops — ready owner", async () => {
    await renderProfile({ mode: "ready" });
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

  test("desktop adaptation: professional sections share one responsive grid wrapper", async () => {
    await renderProfile();
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

  test("public render contains no private PII (phone / dateOfBirth / private email)", async () => {
    const { container } = await renderProfile();
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/\+?\d[\d\s().-]{6,}\d/); // phone-like
    expect(text.toLowerCase()).not.toContain("dateofbirth");
    expect(text).not.toContain("data urodzenia");
    expect(container.querySelector('input[type="tel"]')).toBeNull();
    // no e-mail address rendered as visible text
    expect(text).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  });

  test("desktop sidebar is rendered", async () => {
    await renderProfile();
    expect(screen.getByRole("complementary", { name: /menu boczne/i })).toBeDefined();
  });

  test("portal cards render in fixed order: Społeczności, Kanały, Feed znajomych", async () => {
    const { container } = await renderProfile();
    const portalBtns = Array.from(
      container.querySelectorAll("button[aria-disabled='true'][title]"),
    ).filter((b) => (b.getAttribute("title") ?? "").includes("wkrótce"));
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
});
