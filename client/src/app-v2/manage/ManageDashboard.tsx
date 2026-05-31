/**
 * app-v2/manage/ManageDashboard — root of "Zarządzaj" (/manage), Slice 21.
 *
 * Thin route shell that mounts the unified features-v2/manage
 * `ManageDashboardPage` inside the shared AppShell. The dashboard is the
 * central account/profile management surface described in the Slice 21 brief.
 *
 * IMPORTANT: this is NOT a single-feature screen — it is the dashboard root.
 */
import { useNavigate } from "react-router-dom";
import type { ReactElement } from "react";
import { ManageDashboardPage, manageMockAdapter } from "@client/features-v2/manage";
import { AppShell } from "../navigation/AppShell";

const DEMO_VIEWER_ID = "u-viewer";

export function ManageDashboard(): ReactElement {
  const navigate = useNavigate();
  return (
    <AppShell active="zarzadzaj" viewerUserId={DEMO_VIEWER_ID}>
      <ManageDashboardPage
        viewerUserId={DEMO_VIEWER_ID}
        ownerUserId={DEMO_VIEWER_ID}
        adapter={manageMockAdapter}
        onNavigate={(route) => navigate(route)}
      />
    </AppShell>
  );
}
