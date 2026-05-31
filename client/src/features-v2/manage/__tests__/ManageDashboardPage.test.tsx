/* TEST_FIXTURE — pagination guard safe marker: getAll* below are
   @testing-library DOM queries. */
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ManageDashboardPage } from "../ManageDashboardPage";
import { manageMockAdapter, createManageMockAdapter } from "../mock-adapter";

const OWNER = "u-viewer";
const OTHER = "u-other";

describe("ManageDashboardPage — owner-only", () => {
  test("renders 13 section cards for the owner", async () => {
    render(
      <ManageDashboardPage
        viewerUserId={OWNER}
        ownerUserId={OWNER}
        adapter={manageMockAdapter}
        onNavigate={() => undefined}
      />,
    );
    await screen.findByRole("list", { name: "Sekcje zarządzania" });
    // Each ManageSectionCard renders as <article>. Count those, not <li>s
    // (cards also contain inner <ul><li> for summary items).
    await waitFor(() => {
      expect(screen.getAllByRole("article").length).toBe(13);
    });
  });

  test("shows access-denied alert when viewer != owner (OWNER_MISMATCH)", async () => {
    const adapter = createManageMockAdapter();
    render(
      <ManageDashboardPage
        viewerUserId={OTHER}
        ownerUserId={OWNER}
        adapter={adapter}
        onNavigate={() => undefined}
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(/tylko dla właściciela/i);
  });

  test("shows unauthenticated alert when viewer empty", async () => {
    const adapter = createManageMockAdapter();
    render(
      <ManageDashboardPage
        viewerUserId=""
        ownerUserId={OWNER}
        adapter={adapter}
        onNavigate={() => undefined}
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(/Zaloguj się/);
  });

  test("never renders raw e-mail address in the DOM (PII safety)", async () => {
    render(
      <ManageDashboardPage
        viewerUserId={OWNER}
        ownerUserId={OWNER}
        adapter={manageMockAdapter}
        onNavigate={() => undefined}
      />,
    );
    await waitFor(() => screen.getAllByRole("listitem"));
    expect(document.body.textContent).not.toMatch(/demo@example\.com/);
  });

  test("security primary action is disabled (future_ready)", async () => {
    render(
      <ManageDashboardPage
        viewerUserId={OWNER}
        ownerUserId={OWNER}
        adapter={manageMockAdapter}
        onNavigate={() => undefined}
      />,
    );
    const secBtn = await screen.findByRole("button", { name: /Otwórz bezpieczeństwo/ });
    expect(secBtn).toBeDisabled();
  });
});

describe("manageMockAdapter — adapter contract", () => {
  test("returns OWNER_MISMATCH for different viewer/owner", async () => {
    const res = await manageMockAdapter.getManageDashboardView(OTHER, OWNER);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("OWNER_MISMATCH");
  });

  test("returns UNAUTHENTICATED for empty viewer", async () => {
    const res = await manageMockAdapter.getManageDashboardView("", OWNER);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("UNAUTHENTICATED");
  });

  test("returns 13 sections with non-empty title and description", async () => {
    const res = await manageMockAdapter.getManageDashboardView(OWNER, OWNER);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.sections.length).toBe(13);
    for (const s of res.value.sections) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
      expect(s.primaryAction.label.length).toBeGreaterThan(0);
      expect(s.routeTarget.startsWith("/")).toBe(true);
    }
  });

  test("runtimeBackend is 'mock' in the demo adapter", async () => {
    const res = await manageMockAdapter.getManageDashboardView(OWNER, OWNER);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.header.runtimeBackend).toBe("mock");
  });
});
