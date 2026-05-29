import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import type { CommunitiesShellData } from "@shared/contracts/communities";
import { toCommunityId } from "@shared/contracts/communities";
import { CommunitiesShell } from "../CommunitiesShell";
import { communitiesMockAdapter } from "../mock-adapter";

function renderShell() {
  return render(<CommunitiesShell />);
}

const EMPTY_DATA: CommunitiesShellData = {
  myCommunities: [],
  discoverCommunities: [],
};

describe("CommunitiesShell — MOCK_LOCAL_ONLY communities route UI", () => {
  beforeEach(() => {
    communitiesMockAdapter.__resetForTests();
  });

  test("renders loading state and seeded personal communities", async () => {
    renderShell();
    expect(screen.getByText("Ładowanie społeczności...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Społeczności" })).toBeInTheDocument();
    expect(await screen.findByText("Product Builders")).toBeInTheDocument();
    expect(screen.getByText("Prywatna")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Utwórz społeczność/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Otwórz Product Builders/ })).toBeDisabled();
  });

  test("switches to discover communities without backend transport", async () => {
    renderShell();
    fireEvent.click(await screen.findByRole("tab", { name: /Odkrywaj/ }));
    await waitFor(() => expect(screen.getByText("Lokalne wydarzenia")).toBeInTheDocument());
    expect(screen.getByText("Open Source PL")).toBeInTheDocument();
  });

  test("shows empty state for an empty local fixture", async () => {
    communitiesMockAdapter.__setDataForTests(EMPTY_DATA);
    renderShell();
    expect(await screen.findByText("Nie masz jeszcze społeczności")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Odkrywaj/ }));
    expect(await screen.findByText("Brak społeczności do odkrycia")).toBeInTheDocument();
  });

  test("shows adapter error state", async () => {
    communitiesMockAdapter.__setFailureForTests("mock adapter down");
    renderShell();
    expect(await screen.findByRole("alert")).toHaveTextContent("mock adapter down");
  });

  test("accepts typed fixture data without server imports", async () => {
    communitiesMockAdapter.__setDataForTests({
      myCommunities: [
        {
          id: toCommunityId("community-test"),
          slug: "test",
          name: "Testowa społeczność",
          description: "Minimalny typed fixture.",
          visibility: "public",
          memberCount: 1,
          viewerRole: "admin",
        },
      ],
      discoverCommunities: [],
    });
    renderShell();
    expect(await screen.findByText("Testowa społeczność")).toBeInTheDocument();
    expect(screen.getByText("Rola: admin")).toBeInTheDocument();
  });
});
