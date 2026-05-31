import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";
import { CommunityStructureShell } from "../structure/CommunityStructureShell";
import { communityStructureMockAdapter } from "../structure/structure-mock-adapter";

function renderStructure(slug: string) {
  return render(
    <MemoryRouter>
      <CommunityStructureShell slug={slug} />
    </MemoryRouter>,
  );
}

describe("CommunityStructureShell — MOCK_LOCAL_ONLY structure screen", () => {
  beforeEach(() => {
    communityStructureMockAdapter.__resetForTests();
  });

  test("founder sees the tree, breadcrumb and create CTA", async () => {
    renderStructure("product-builders");
    expect(await screen.findByRole("heading", { name: "Product Builders" })).toBeInTheDocument();
    expect(screen.getByText("Frontend Guild")).toBeInTheDocument();
    expect(screen.getByText("Backend Guild")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+ Utwórz podspołeczność/ })).toBeInTheDocument();
  });

  test("toggles between Drzewo and Lista views", async () => {
    renderStructure("product-builders");
    await screen.findByRole("heading", { name: "Product Builders" });
    fireEvent.click(screen.getByRole("tab", { name: "Lista" }));
    expect(screen.getByText("React Squad")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Drzewo" }));
    expect(screen.getByText("Frontend Guild")).toBeInTheDocument();
  });

  test("non-manager (member) gets a read-only view, no create CTA", async () => {
    renderStructure("zdrowie-ruch");
    expect(await screen.findByRole("heading", { name: "Zdrowie i Ruch" })).toBeInTheDocument();
    expect(screen.getByText(/Masz podgląd struktury/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\+ Utwórz podspołeczność/ })).not.toBeInTheDocument();
  });

  test("error state when the adapter fails", async () => {
    communityStructureMockAdapter.__setFailureForTests("Boom");
    renderStructure("product-builders");
    expect(await screen.findByRole("alert")).toHaveTextContent("Boom");
    communityStructureMockAdapter.__setFailureForTests(null);
  });

  test("selecting a node reveals policy-gated actions", async () => {
    renderStructure("product-builders");
    await screen.findByRole("heading", { name: "Product Builders" });
    fireEvent.click(screen.getByText("Backend Guild"));
    const card = screen.getByTestId("subcommunity-card-pb-backend-guild");
    expect(within(card).getByRole("link", { name: "Otwórz" })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Edytuj" })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Przenieś" })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Dezaktywuj" })).toBeInTheDocument();
  });

  test("move dialog opens for a subcommunity", async () => {
    renderStructure("product-builders");
    await screen.findByRole("heading", { name: "Product Builders" });
    fireEvent.click(screen.getByText("Backend Guild"));
    const card = screen.getByTestId("subcommunity-card-pb-backend-guild");
    fireEvent.click(within(card).getByRole("button", { name: "Przenieś" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent(/Przenieś „Backend Guild”/);
  });

  test("deactivate dialog opens and confirming removes the node from the active tree", async () => {
    renderStructure("product-builders");
    await screen.findByRole("heading", { name: "Product Builders" });
    fireEvent.click(screen.getByText("Backend Guild"));
    const card = screen.getByTestId("subcommunity-card-pb-backend-guild");
    fireEvent.click(within(card).getByRole("button", { name: "Dezaktywuj" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Dezaktywuj" }));
    await waitFor(() => {
      const updated = screen.getByTestId("subcommunity-card-pb-backend-guild");
      expect(within(updated).getByText("Wyłączona")).toBeInTheDocument();
    });
  });

  test("create wizard validates step 1 and creates a real subcommunity (no fake save)", async () => {
    renderStructure("product-builders");
    await screen.findByRole("heading", { name: "Product Builders" });
    fireEvent.click(screen.getByRole("button", { name: /\+ Utwórz podspołeczność/ }));

    expect(await screen.findByRole("heading", { name: "Nowa podspołeczność" })).toBeInTheDocument();
    // Dalej disabled before a valid name
    expect(screen.getByRole("button", { name: "Dalej" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Nazwa podspołeczności/), { target: { value: "QA Guild" } });
    expect(screen.getByRole("button", { name: "Dalej" })).toBeEnabled();

    // advance to summary
    fireEvent.click(screen.getByRole("button", { name: "Dalej" })); // -> Kategoria
    fireEvent.click(screen.getByRole("button", { name: "Dalej" })); // -> Lokalizacja
    fireEvent.click(screen.getByRole("button", { name: "Dalej" })); // -> Przynależność
    fireEvent.click(screen.getByRole("button", { name: "Dalej" })); // -> Utwórz
    fireEvent.click(screen.getByRole("button", { name: /^Utwórz podspołeczność$/ }));

    await waitFor(() => expect(screen.getByText("QA Guild")).toBeInTheDocument());
  });

  test("structure UI does not import @server/* (frontend boundary)", () => {
    const dir = resolve(__dirname, "../structure");
    const files = readdirSync(dir).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
    const importRe = /from\s+["']@server\//;
    for (const f of files) {
      expect(readFileSync(resolve(dir, f), "utf-8")).not.toMatch(importRe);
    }
  });
});
