import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";
import { CommunityManageShell } from "../CommunityManageShell";
import { communitiesMockAdapter } from "../mock-adapter";

function renderManage(slug: string) {
  return render(
    <MemoryRouter>
      <CommunityManageShell slug={slug} />
    </MemoryRouter>,
  );
}

describe("CommunityManageShell — MOCK_LOCAL_ONLY manage screen", () => {
  beforeEach(() => {
    communitiesMockAdapter.__resetForTests();
  });

  test("founder sees the settings/members/requests panels and tile links", async () => {
    renderManage("product-builders");
    expect(await screen.findByRole("heading", { name: "Product Builders" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Ustawienia podstawowe/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Prośby o dołączenie/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Członkowie/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Moduły/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kanały/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Public Hub/ })).toBeInTheDocument();
  });

  test("non-founder sees a forbidden notice", async () => {
    renderManage("zdrowie-ruch");
    expect(await screen.findByRole("heading", { name: /Brak uprawnień/ })).toBeInTheDocument();
  });

  test("accept join request moves the requester into members", async () => {
    renderManage("product-builders");
    expect(await screen.findByText("Kasia Design")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Akceptuj/ }));
    await waitFor(() => expect(screen.queryByText("Kasia Design")).toBeInTheDocument()); // appears now as a member
    await waitFor(() => expect(screen.getByText(/Członkowie \(4\)/)).toBeInTheDocument());
  });

  test("settings update changes the displayed community name", async () => {
    renderManage("product-builders");
    const nameInput = await screen.findByDisplayValue("Product Builders");
    fireEvent.change(nameInput, { target: { value: "Product Builders v2" } });
    fireEvent.click(screen.getByRole("button", { name: /Zapisz zmiany/ }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Product Builders v2" })).toBeInTheDocument());
  });
});
