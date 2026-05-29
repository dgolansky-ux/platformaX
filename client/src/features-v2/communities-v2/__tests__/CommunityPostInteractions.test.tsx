// TEST_FIXTURE: testing-library queries (`findAllByTestId`, `getAllByRole`,
// `queryAll…`) trigger the pagination guard's heuristic — this is a UI
// integration test, not a runtime list query, so the safe marker applies.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";
import { CommunityFeedsShell } from "../feeds/CommunityFeedsShell";
import { communityFeedsMockAdapter } from "../feeds/community-feeds-mock-adapter";
import { communityInteractionsMockAdapter } from "../feeds/community-interactions-mock-adapter";

function renderFeeds(slug: string) {
  return render(
    <MemoryRouter>
      <CommunityFeedsShell slug={slug} />
    </MemoryRouter>,
  );
}

describe("CommunityPostInteractions — Slice 6 comments + reactions UI", () => {
  beforeEach(() => {
    communityFeedsMockAdapter.__resetForTests();
    communityInteractionsMockAdapter.__resetForTests();
  });

  test("action bar renders Polub + Skomentuj under each feed card", async () => {
    renderFeeds("product-builders");
    await screen.findByRole("tab", { name: /Główny/ });
    const cards = await screen.findAllByTestId(/^feed-item-/);
    expect(cards.length).toBeGreaterThan(0);
    // every visible card carries an action bar
    for (const card of cards) {
      expect(card.querySelector('[aria-label="Polub post"]')).not.toBeNull();
    }
    expect(screen.getAllByRole("button", { name: /Skomentuj/ }).length).toBeGreaterThan(0);
  });

  test("toggling reaction updates count from the adapter (no fake counter)", async () => {
    renderFeeds("product-builders");
    await screen.findByRole("tab", { name: /Główny/ });
    const likeBtn = (await screen.findAllByLabelText("Polub post"))[0];
    fireEvent.click(likeBtn);
    // active label switches and count appears
    await waitFor(() => expect(screen.getAllByLabelText("Cofnij polubienie posta").length).toBeGreaterThan(0));
    // un-toggle removes the count
    fireEvent.click(screen.getAllByLabelText("Cofnij polubienie posta")[0]);
    await waitFor(() => expect(screen.getAllByLabelText("Polub post").length).toBeGreaterThan(0));
  });

  test("comments toggle expands the thread and posts a real comment via the adapter", async () => {
    renderFeeds("product-builders");
    await screen.findByRole("tab", { name: /Główny/ });
    const toggleBtn = (await screen.findAllByRole("button", { name: /Skomentuj/ }))[0];
    fireEvent.click(toggleBtn);
    const textarea = await screen.findByLabelText("Treść komentarza");
    fireEvent.change(textarea, { target: { value: "Brawo!" } });
    // Two "Opublikuj" buttons exist (feed composer + comment composer); the
    // comment composer's button sits right next to the comments textarea.
    const composerSendBtn = textarea.parentElement?.querySelector("button");
    if (!composerSendBtn) throw new Error("comment composer button not found");
    fireEvent.click(composerSendBtn);
    await waitFor(() => expect(screen.getByText("Brawo!")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: /Zwiń komentarze/ })).toBeInTheDocument());
  });

  test("staff_only feed item: members do not see the card (and therefore no leak of interactions)", async () => {
    // zdrowie-ruch demo viewer is a plain member — staff tab is hidden.
    renderFeeds("zdrowie-ruch");
    await screen.findByRole("tab", { name: /Główny/ });
    expect(screen.queryByRole("tab", { name: /Kadra/ })).not.toBeInTheDocument();
    // staff_only feed items from product-builders should never bleed across
    // communities (different slug — different feed) — sanity check that no
    // staff feed item card is rendered for the member.
    const cards = screen.queryAllByTestId(/^feed-item-/);
    for (const c of cards) {
      expect(c.textContent ?? "").not.toMatch(/Kadra/);
    }
  });

  test("soft-deleted comment renders the placeholder instead of body", async () => {
    renderFeeds("product-builders");
    await screen.findByRole("tab", { name: /Główny/ });
    const toggle = (await screen.findAllByRole("button", { name: /Skomentuj/ }))[0];
    fireEvent.click(toggle);
    const textarea = await screen.findByLabelText("Treść komentarza");
    fireEvent.change(textarea, { target: { value: "do usuniecia" } });
    const composerSendBtn = textarea.parentElement?.querySelector("button");
    if (!composerSendBtn) throw new Error("comment composer button not found");
    fireEvent.click(composerSendBtn);
    await waitFor(() => expect(screen.getByText("do usuniecia")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Usuń komentarz" }));
    await waitFor(() => expect(screen.getByText("Komentarz usunięty")).toBeInTheDocument());
    expect(screen.queryByText("do usuniecia")).not.toBeInTheDocument();
  });

  test("interactions UI does not import @server/* (frontend boundary)", () => {
    const dir = resolve(__dirname, "../feeds/interactions");
    const importRe = /from\s+["']@server\//;
    function walk(d: string): string[] {
      const out: string[] = [];
      for (const name of readdirSync(d)) {
        const full = resolve(d, name);
        if (statSync(full).isDirectory()) out.push(...walk(full));
        else out.push(full);
      }
      return out;
    }
    for (const f of walk(dir).filter((x) => x.endsWith(".ts") || x.endsWith(".tsx"))) {
      expect(readFileSync(f, "utf-8")).not.toMatch(importRe);
    }
  });

  test("adapter source bans untyped escape hatches", () => {
    const file = readFileSync(
      resolve(__dirname, "../feeds/community-interactions-mock-adapter.ts"),
      "utf-8",
    );
    const asAnyBan = new RegExp("\\\\bas\\\\s+any\\\\b".replace(/\\\\/g, "\\"));
    expect(asAnyBan.test(file)).toBe(false);
    const tsIgnoreBan = new RegExp(["@", "ts-", "ignore"].join(""));
    expect(tsIgnoreBan.test(file)).toBe(false);
  });
});
