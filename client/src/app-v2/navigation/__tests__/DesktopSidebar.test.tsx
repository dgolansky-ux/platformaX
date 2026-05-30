import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";
import { DesktopSidebar } from "../DesktopSidebar";
import { __resetNotificationsMockAdapterForTests } from "@client/features-v2/notifications-v2/mock-adapter";

function renderSidebar() {
  return render(
    <MemoryRouter>
      <DesktopSidebar
        active="powiadomienia"
        displayName="Demo użytkownik"
        handle="demo"
        avatarInitial="D"
        viewerUserId="u-viewer"
      />
    </MemoryRouter>,
  );
}

describe("DesktopSidebar — notifications wiring (Slice 14)", () => {
  beforeEach(() => {
    __resetNotificationsMockAdapterForTests();
  });

  test("renders the Powiadomienia nav entry and is enabled", () => {
    renderSidebar();
    const item = screen.getByRole("button", { name: /Powiadomienia/i });
    expect((item as HTMLButtonElement).disabled).toBe(false);
  });

  test("Powiadomienia entry carries aria-current='page' when active", () => {
    renderSidebar();
    const item = screen.getByRole("button", { name: /Powiadomienia/i });
    expect(item.getAttribute("aria-current")).toBe("page");
  });

  test("unread badge renders a real count from the adapter (not a fake number)", async () => {
    renderSidebar();
    await waitFor(() => {
      const badge = screen.getByTestId("notifications-unread-badge");
      const value = Number(badge.textContent?.replace("+", "") ?? "");
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    });
  });

  test("Feed znajomych entry is enabled after friend-feed route wiring", () => {
    renderSidebar();
    const item = screen.getByRole("button", { name: /^Feed znajomych$/i });
    expect((item as HTMLButtonElement).disabled).toBe(false);
  });
});
