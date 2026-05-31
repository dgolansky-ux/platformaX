import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";
import { CommunityModulesManage } from "../CommunityModulesManage";
import { communitiesMockAdapter } from "../mock-adapter";

function renderModules(slug: string) {
  return render(
    <MemoryRouter>
      <CommunityModulesManage slug={slug} />
    </MemoryRouter>,
  );
}

describe("CommunityModulesManage — MOCK_LOCAL_ONLY modules screen", () => {
  beforeEach(() => {
    communitiesMockAdapter.__resetForTests();
  });

  test("founder can toggle a module on/off", async () => {
    renderModules("product-builders");
    expect(await screen.findByRole("heading", { name: /Moduły społeczności/ })).toBeInTheDocument();
    const integrationsRow = (await screen.findByText("Integracje")).closest("li");
    expect(integrationsRow).not.toBeNull();
    const toggleBtn = integrationsRow!.querySelector("button");
    expect(toggleBtn).not.toBeNull();
    expect(toggleBtn!.textContent).toMatch(/Włącz/);
    fireEvent.click(toggleBtn!);
    await waitFor(() => expect(toggleBtn!.textContent).toMatch(/Wyłącz/));
  });

  test("non-manager sees only the read-only notice — no toggle buttons", async () => {
    renderModules("zdrowie-ruch");
    expect(await screen.findByText(/Tryb tylko do odczytu/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Włącz/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Wyłącz/ })).toBeNull();
  });
});
