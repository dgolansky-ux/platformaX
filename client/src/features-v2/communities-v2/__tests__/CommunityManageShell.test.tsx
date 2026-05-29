import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

async function gotoTab(label: RegExp | string) {
  const tab = await screen.findByRole("tab", { name: label });
  fireEvent.click(tab);
}

describe("CommunityManageShell — MOCK_LOCAL_ONLY manage screen", () => {
  beforeEach(() => {
    communitiesMockAdapter.__resetForTests();
  });

  test("founder sees hero + tabs + settings panel by default", async () => {
    renderManage("product-builders");
    expect(await screen.findByRole("heading", { name: "Product Builders" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Ustawienia/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Członkowie/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Prośby/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Zaproszenia/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Strefa niebezpieczna/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Ustawienia podstawowe/ })).toBeInTheDocument();
  });

  test("non-founder sees a forbidden notice", async () => {
    renderManage("zdrowie-ruch");
    expect(await screen.findByRole("heading", { name: /Brak uprawnień/ })).toBeInTheDocument();
  });

  test("accept join request moves the requester into members", async () => {
    renderManage("product-builders");
    await screen.findByRole("heading", { name: "Product Builders" });
    await gotoTab(/Prośby/);
    expect(await screen.findByText("Kasia Design")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Akceptuj/ }));
    await waitFor(() =>
      expect(screen.getByText(/Brak oczekujących zgłoszeń\./)).toBeInTheDocument(),
    );
    await gotoTab(/Członkowie/);
    await waitFor(() => expect(screen.getByRole("heading", { name: /Członkowie \(4\)/ })).toBeInTheDocument());
  });

  test("settings update changes the displayed community name", async () => {
    renderManage("product-builders");
    const nameInput = await screen.findByDisplayValue("Product Builders");
    fireEvent.change(nameInput, { target: { value: "Product Builders v2" } });
    fireEvent.click(screen.getByRole("button", { name: /Zapisz zmiany/ }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Product Builders v2" })).toBeInTheDocument());
  });

  test("member can be removed by the founder", async () => {
    renderManage("product-builders");
    await screen.findByRole("heading", { name: "Product Builders" });
    await gotoTab(/Członkowie/);
    expect(await screen.findByText("Marek Dev")).toBeInTheDocument();
    const removeBtn = await screen.findByRole("button", { name: /Usuń ze społeczności: Marek Dev/ });
    fireEvent.click(removeBtn);
    await waitFor(() => expect(screen.queryByText("Marek Dev")).not.toBeInTheDocument());
  });

  test("creating + cancelling an invite round-trips", async () => {
    renderManage("product-builders");
    await screen.findByRole("heading", { name: "Product Builders" });
    await gotoTab(/Zaproszenia/);
    const emailInput = screen.getByLabelText(/lub email/i);
    fireEvent.change(emailInput, { target: { value: "guest@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Wyślij zaproszenie/ }));
    await waitFor(() => expect(screen.getByText("guest@example.com")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /^Anuluj$/ }));
    await waitFor(() => expect(screen.getByText(/Anulowane/)).toBeInTheDocument());
  });

  test("danger zone shows a truthful disabled delete (no fake save)", async () => {
    renderManage("product-builders");
    await screen.findByRole("heading", { name: "Product Builders" });
    await gotoTab(/Strefa niebezpieczna/);
    fireEvent.click(screen.getByRole("button", { name: /Usuń społeczność na zawsze/ }));
    const finalBtn = await screen.findByRole("button", { name: /niedostępne/ });
    expect(finalBtn).toBeDisabled();
    expect(screen.getByText(/TRANSPORT_PARTIAL/)).toBeInTheDocument();
  });

  test("manage UI does not import @server/* (frontend boundary)", () => {
    const shellSrc = readFileSync(resolve(__dirname, "../CommunityManageShell.tsx"), "utf-8");
    const members = readFileSync(resolve(__dirname, "../manage/MembersPanel.tsx"), "utf-8");
    const invites = readFileSync(resolve(__dirname, "../manage/InvitesPanel.tsx"), "utf-8");
    const danger = readFileSync(resolve(__dirname, "../manage/DangerZone.tsx"), "utf-8");
    const importRe = /from\s+["']@server\//;
    expect(shellSrc).not.toMatch(importRe);
    expect(members).not.toMatch(importRe);
    expect(invites).not.toMatch(importRe);
    expect(danger).not.toMatch(importRe);
  });
});
