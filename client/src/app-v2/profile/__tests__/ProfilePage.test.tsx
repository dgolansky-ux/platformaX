import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { ProfilePage } from "../ProfilePage";

const ROOT = process.cwd();
const PROFILE_DIR = join(ROOT, "client/src/app-v2/profile");

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
    expect(screen.getByText(/^Społeczności$/)).toBeDefined();
    expect(screen.getByText(/^Kanały$/)).toBeDefined();
    expect(screen.getByText(/^Feed znajomych$/)).toBeDefined();
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
    expect(screen.getByText(/^Społeczności$/)).toBeDefined();
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

  test("contacts tabs filter the carousel via local state", () => {
    renderProfile();
    expect(screen.getByText(/Wójcik/)).toBeDefined(); // family_extended visible under "Wszyscy"
    fireEvent.click(screen.getByRole("tab", { name: /^Bliscy/ }));
    expect(screen.queryByText(/Wójcik/)).toBeNull(); // filtered out of "Bliscy"
  });

  test("CTAs that need a backend are disabled-policy, never silent no-ops", () => {
    renderProfile();
    const communities = screen.getByText(/^Społeczności$/).closest("button");
    expect(communities?.disabled).toBe(true);
  });

  test("professional layer is a MODE of the same profile, not a separate domain/route", () => {
    renderProfile();
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
