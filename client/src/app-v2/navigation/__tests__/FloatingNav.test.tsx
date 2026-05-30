/* TEST_FIXTURE — pagination guard safe marker: getAll* below are
   @testing-library DOM queries, not runtime list fetches. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import { FloatingNav, type NavTab } from "../FloatingNav";

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

function renderNavAt(path: string, active: NavTab = "profil") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <FloatingNav active={active} />
    </MemoryRouter>,
  );
}

describe("FloatingNav — V2 mobile bottom nav (Slice 22A route-aware FAB)", () => {
  test("renders 5 primary tabs (Centrum, Feed, FAB, Alerty, Profil)", () => {
    renderNavAt("/");
    expect(screen.getByRole("button", { name: /^centrum$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^feed$/i })).toBeDefined();
    expect(screen.getAllByRole("button").find((b) => /opublikuj wpis|aby opublikować/i.test(b.getAttribute("aria-label") ?? ""))).toBeDefined();
    expect(screen.getByRole("button", { name: /^alerty/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^profil$/i })).toBeDefined();
  });

  test("active tab carries aria-current='page'", () => {
    renderNavAt("/profile", "profil");
    const profil = screen.getByRole("button", { name: /^profil$/i });
    expect(profil.getAttribute("aria-current")).toBe("page");
    const centrum = screen.getByRole("button", { name: /^centrum$/i });
    expect(centrum.getAttribute("aria-current")).toBeNull();
  });

  test("on /friends-feed the FAB is enabled and dispatches platformax:open-composer with friend_feed surface", () => {
    const spy = vi.fn();
    window.addEventListener("platformax:open-composer", spy);
    try {
      renderNavAt("/friends-feed", "feed");
      const fab = screen.getByRole("button", { name: /opublikuj wpis/i });
      expect((fab as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(fab);
      expect(spy).toHaveBeenCalledTimes(1);
      const ev = spy.mock.calls[0]![0] as CustomEvent<{ surface: string }>;
      expect(ev.detail.surface).toBe("friend_feed");
    } finally {
      window.removeEventListener("platformax:open-composer", spy);
    }
  });

  test("on a community feed route the FAB dispatches community_feed surface", () => {
    const spy = vi.fn();
    window.addEventListener("platformax:open-composer", spy);
    try {
      renderNavAt("/communities/product-builders/feed", "communities");
      const fab = screen.getByRole("button", { name: /opublikuj wpis/i });
      expect((fab as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(fab);
      const ev = spy.mock.calls[0]![0] as CustomEvent<{ surface: string }>;
      expect(ev.detail.surface).toBe("community_feed");
    } finally {
      window.removeEventListener("platformax:open-composer", spy);
    }
  });

  test("on a channel route the FAB dispatches channel surface", () => {
    const spy = vi.fn();
    window.addEventListener("platformax:open-composer", spy);
    try {
      renderNavAt("/channels/news", "home");
      const fab = screen.getByRole("button", { name: /opublikuj wpis/i });
      expect((fab as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(fab);
      const ev = spy.mock.calls[0]![0] as CustomEvent<{ surface: string }>;
      expect(ev.detail.surface).toBe("channel");
    } finally {
      window.removeEventListener("platformax:open-composer", spy);
    }
  });

  test("on routes without a composer surface the FAB is disabled with an honest aria-label (no 'Wkrótce' modal)", () => {
    renderNavAt("/notifications", "alerts");
    const fab = screen.getByRole("button", { name: /aby opublikować/i });
    expect((fab as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(fab);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("no 'Wkrótce' placeholder modal is ever rendered", () => {
    renderNavAt("/notifications", "alerts");
    expect(screen.queryByText(/Wkrótce/i)).toBeNull();
  });

  test("Alerty is an enabled button that routes to /notifications (Slice 14)", () => {
    renderNavAt("/");
    const alerts = screen.getByRole("button", { name: /^alerty/i });
    expect((alerts as HTMLButtonElement).disabled).toBe(false);
  });

  test("Feed is an enabled button after /friends-feed route wiring", () => {
    renderNavAt("/");
    const feed = screen.getByRole("button", { name: /^feed$/i });
    expect((feed as HTMLButtonElement).disabled).toBe(false);
  });

  test("no href='#' or no-op buttons in the rendered DOM", () => {
    const { container } = renderNavAt("/");
    expect(container.querySelector('a[href="#"]')).toBeNull();
    const buttons = Array.from(container.querySelectorAll("button"));
    for (const b of buttons) {
      if (b.disabled) continue;
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
