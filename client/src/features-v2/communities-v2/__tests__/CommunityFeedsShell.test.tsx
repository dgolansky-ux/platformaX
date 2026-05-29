import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";
import { CommunityFeedsShell } from "../feeds/CommunityFeedsShell";
import { communityFeedsMockAdapter } from "../feeds/community-feeds-mock-adapter";

function renderFeeds(slug: string) {
  return render(
    <MemoryRouter>
      <CommunityFeedsShell slug={slug} />
    </MemoryRouter>,
  );
}

describe("CommunityFeedsShell — MOCK_LOCAL_ONLY feeds screen", () => {
  beforeEach(() => {
    communityFeedsMockAdapter.__resetForTests();
  });

  test("founder sees all three feed tabs (demo has relational enabled)", async () => {
    renderFeeds("product-builders");
    expect(await screen.findByRole("tab", { name: /Główny/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Relacyjny/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Kadra/ })).toBeInTheDocument();
  });

  test("relational tab hides when feed settings disable it", async () => {
    await communityFeedsMockAdapter.updateFeedSettings({ communitySlug: "product-builders", relationalEnabled: false });
    renderFeeds("product-builders");
    expect(await screen.findByRole("tab", { name: /Główny/ })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Relacyjny/ })).not.toBeInTheDocument();
  });

  test("a plain member does not see the Kadra (staff) tab", async () => {
    renderFeeds("zdrowie-ruch");
    expect(await screen.findByRole("tab", { name: /Główny/ })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Kadra/ })).not.toBeInTheDocument();
  });

  test("composer publishes a real post to the main feed (no fake save)", async () => {
    renderFeeds("product-builders");
    await screen.findByRole("tab", { name: /Główny/ });
    const textarea = await screen.findByLabelText("Treść posta");
    fireEvent.change(textarea, { target: { value: "Nowy post testowy" } });
    fireEvent.click(screen.getByRole("button", { name: /Opublikuj/ }));
    await waitFor(() => expect(screen.getByText("Nowy post testowy")).toBeInTheDocument());
  });

  test("scope selector is shown for staff and reveals the descendant picker", async () => {
    renderFeeds("product-builders");
    await screen.findByRole("tab", { name: /Główny/ });
    expect(screen.getByText("Zasięg publikacji")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Wybrane podspołeczności" }));
    await waitFor(() => expect(screen.getByText("Frontend Guild")).toBeInTheDocument());
    expect(screen.getByText("Backend Guild")).toBeInTheDocument();
  });

  test("relational tab shows the monthly quota badge", async () => {
    await communityFeedsMockAdapter.updateFeedSettings({ communitySlug: "product-builders", relationalEnabled: true });
    renderFeeds("product-builders");
    const relTab = await screen.findByRole("tab", { name: /Relacyjny/ });
    fireEvent.click(relTab);
    await waitFor(() => expect(screen.getByText(/Limit miesięczny: 0\/3/)).toBeInTheDocument());
  });

  test("distributed posts carry a distribution trace badge in the child feed", async () => {
    const pub = await communityFeedsMockAdapter.publishPost({
      communitySlug: "product-builders", feedType: "community_all", body: "Ogłoszenie z góry", scope: "direct_children",
    });
    expect(pub.ok).toBe(true);
    renderFeeds("pb-frontend-guild");
    expect(await screen.findByText("Ogłoszenie z góry")).toBeInTheDocument();
    expect(screen.getByText(/Opublikowano z: Product Builders/)).toBeInTheDocument();
  });

  test("relational feed never offers descendant scope", async () => {
    await communityFeedsMockAdapter.updateFeedSettings({ communitySlug: "product-builders", relationalEnabled: true });
    renderFeeds("product-builders");
    fireEvent.click(await screen.findByRole("tab", { name: /Relacyjny/ }));
    await waitFor(() => expect(screen.getByText(/Limit miesięczny/)).toBeInTheDocument());
    expect(screen.queryByText("Zasięg publikacji")).not.toBeInTheDocument();
  });

  test("feeds UI does not import @server/* (frontend boundary)", () => {
    const dir = resolve(__dirname, "../feeds");
    const importRe = /from\s+["']@server\//;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".ts") || x.endsWith(".tsx"))) {
      expect(readFileSync(resolve(dir, f), "utf-8")).not.toMatch(importRe);
    }
  });
});
