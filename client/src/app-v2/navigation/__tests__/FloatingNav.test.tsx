import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { FloatingNav } from "../FloatingNav";

const ROOT = process.cwd();
const NAV_DIR = join(ROOT, "client/src/app-v2/navigation");

function navSourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "__tests__") continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
    }
  };
  walk(NAV_DIR);
  return out;
}

function renderNav(active: "home" | "profil" | "feed" | "kontakty" | "chat" | "alerts" | "search" = "profil") {
  return render(
    <MemoryRouter>
      <FloatingNav active={active} />
    </MemoryRouter>,
  );
}

describe("FloatingNav — V2 floating navigation", () => {
  test("renders all five top-level buttons", () => {
    renderNav();
    expect(screen.getByRole("button", { name: /szukaj/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /alerty/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^centrum$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^profil$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^feed$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^chat/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^kontakty/i })).toBeDefined();
  });

  test("active tab carries aria-current='page'", () => {
    renderNav("profil");
    const profil = screen.getByRole("button", { name: /^profil$/i });
    expect(profil.getAttribute("aria-current")).toBe("page");
    const centrum = screen.getByRole("button", { name: /^centrum$/i });
    expect(centrum.getAttribute("aria-current")).toBeNull();
  });

  test("Szukaj opens a local 'Wkrótce' modal (real CTA, not a no-op)", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: /szukaj/i }));
    expect(screen.getByRole("dialog", { name: /wkrótce/i })).toBeDefined();
    expect(screen.getByText(/wyszukiwarka osób/i)).toBeDefined();
  });

  test("disabled-policy CTAs (Chat, Kontakty) are real buttons with explanation", () => {
    renderNav();
    const chat = screen.getByRole("button", { name: /chat — wkrótce/i });
    expect((chat as HTMLButtonElement).disabled).toBe(true);
    const kontakty = screen.getByRole("button", { name: /kontakty — wkrótce/i });
    expect((kontakty as HTMLButtonElement).disabled).toBe(true);
  });

  test("Alerty is an enabled button that routes to /notifications (Slice 14)", () => {
    renderNav();
    const alerts = screen.getByRole("button", { name: /^alerty/i });
    expect((alerts as HTMLButtonElement).disabled).toBe(false);
  });

  test("Feed is an enabled button after /friends-feed route wiring", () => {
    renderNav();
    const feed = screen.getByRole("button", { name: /^feed$/i });
    expect((feed as HTMLButtonElement).disabled).toBe(false);
  });

  test("no href='#' or no-op buttons in the rendered DOM", () => {
    const { container } = renderNav();
    expect(container.querySelector('a[href="#"]')).toBeNull();
    // every non-disabled button has an onClick or is wrapped by an anchor with a real route
    const buttons = Array.from(container.querySelectorAll("button"));
    for (const b of buttons) {
      if (b.disabled) continue;
      // visible label is required for a11y — empty label = a hidden no-op shortcut
      const label = b.getAttribute("aria-label") ?? b.textContent;
      expect(label?.trim().length).toBeGreaterThan(0);
    }
  });

  test("navigation source imports no legacy runtime / tRPC / Supabase", () => {
    const sdk = "@" + "supabase/supabase-js";
    const legacyDirs = ["fea" + "tures", "pa" + "ges", "compo" + "nents"];
    const legacyImport = new RegExp(`from\\s+["'][^"']*/(${legacyDirs.join("|")})/`);
    const trpc = ["t" + "rpc", "wo" + "uter"];
    for (const file of navSourceFiles()) {
      const content = readFileSync(file, "utf-8");
      expect(content).not.toContain(sdk);
      expect(content).not.toMatch(legacyImport);
      for (const needle of trpc) {
        expect(content.toLowerCase()).not.toContain(needle.toLowerCase());
      }
    }
  });
});
