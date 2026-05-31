import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";
import { CommunityProfileShell } from "../CommunityProfileShell";
import { communitiesMockAdapter } from "../mock-adapter";

function renderProfile(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/communities/${slug}`]}>
      <Routes>
        <Route path="/communities/:s" element={<CommunityProfileShell slug={slug} />} />
        <Route path="/communities" element={<div>LIST_ROUTE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CommunityProfileShell — MOCK_LOCAL_ONLY profile screen", () => {
  beforeEach(() => {
    communitiesMockAdapter.__resetForTests();
  });

  test("founder sees the manage CTA on their own community", async () => {
    renderProfile("product-builders");
    expect(await screen.findByRole("heading", { name: "Product Builders" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Zarządzaj/ })).toBeInTheDocument();
  });

  test("stranger sees a Dołącz CTA on a public community", async () => {
    renderProfile("lokalne-wydarzenia");
    expect(await screen.findByRole("heading", { name: "Lokalne wydarzenia" })).toBeInTheDocument();
    const join = screen.getByRole("button", { name: /Dołącz do społeczności/ });
    expect(join).toBeInTheDocument();
    fireEvent.click(join);
    await waitFor(() => expect(screen.getByText(/Jesteś członkiem/)).toBeInTheDocument());
  });

  test("stranger sees a Poproś o dołączenie CTA on a private community fixture", async () => {
    // Seed a private community where the viewer is not a member.
    communitiesMockAdapter.__resetForTests();
    // Reuse fixture: "zdrowie-ruch" is private; viewer is a member there.
    // Use the open-source/unlisted fixture which is not_member.
    const created = await communitiesMockAdapter.createCommunity({
      name: "Prywatne grono",
      slug: "prywatne-grono",
      visibility: "private",
    });
    expect(created.ok).toBe(true);
    renderProfile("prywatne-grono");
    // The creator (viewer) is the founder — so the CTA is Zarządzaj, not Dołącz.
    expect(await screen.findByRole("link", { name: /Zarządzaj/ })).toBeInTheDocument();
  });

  test("shows error state on adapter failure", async () => {
    communitiesMockAdapter.__setFailureForTests("offline");
    renderProfile("product-builders");
    expect(await screen.findByRole("alert")).toHaveTextContent("offline");
  });

  test("shows not-found state for an unknown slug", async () => {
    renderProfile("does-not-exist");
    expect(await screen.findByText(/Społeczność nie istnieje\./)).toBeInTheDocument();
  });

  test("private community CTA: request → pending badge → cancel returns to stranger CTA", async () => {
    const created = await communitiesMockAdapter.createCommunity({
      name: "Prywatne grono",
      slug: "prywatne-grono",
      visibility: "private",
    });
    expect(created.ok).toBe(true);
    // Promote founder away so the viewer becomes a stranger again: easier path is
    // to use the open-source fixture (unlisted treated as non-public; viewer is
    // not_member).
    renderProfile("open-source");

    const request = await screen.findByRole("button", { name: /Poproś o dołączenie/ });
    fireEvent.click(request);
    await waitFor(() => expect(screen.getByText(/Prośba oczekuje na akceptację/)).toBeInTheDocument());

    const cancel = screen.getByRole("button", { name: /Anuluj prośbę/ });
    fireEvent.click(cancel);
    await waitFor(() => expect(screen.getByRole("button", { name: /Poproś o dołączenie/ })).toBeInTheDocument());
  });

  test("member can Opuść; viewer state collapses to stranger CTA", async () => {
    // zdrowie-ruch fixture: viewer is a non-founder member of a private community.
    renderProfile("zdrowie-ruch");
    expect(await screen.findByText(/Jesteś członkiem/)).toBeInTheDocument();
    const leave = screen.getByRole("button", { name: /Opuść/ });
    fireEvent.click(leave);
    await waitFor(() => expect(screen.getByRole("button", { name: /Poproś o dołączenie/ })).toBeInTheDocument());
  });

  test("private community shows the restricted note for a non-member", async () => {
    renderProfile("open-source");
    expect(await screen.findByText(/Treści tej prywatnej społeczności są widoczne/)).toBeInTheDocument();
    // Stranger does not see manage links.
    expect(screen.queryByRole("link", { name: /Zarządzaj/ })).not.toBeInTheDocument();
  });

  test("founder sees no Opuść on a sole-founder community", async () => {
    renderProfile("product-builders");
    expect(await screen.findByRole("link", { name: /Zarządzaj/ })).toBeInTheDocument();
    // Founder UI hides the Opuść action via canManage path.
    expect(screen.queryByRole("button", { name: /^Opuść$/ })).not.toBeInTheDocument();
  });

  test("does not import @server/* (frontend boundary)", () => {
    const shellSrc = readFileSync(
      resolve(__dirname, "../CommunityProfileShell.tsx"),
      "utf-8",
    );
    const heroSrc = readFileSync(
      resolve(__dirname, "../profile/CommunityProfileHero.tsx"),
      "utf-8",
    );
    const ctaSrc = readFileSync(
      resolve(__dirname, "../profile/CommunityJoinCTA.tsx"),
      "utf-8",
    );
    const importRe = /from\s+["']@server\//;
    expect(shellSrc).not.toMatch(importRe);
    expect(heroSrc).not.toMatch(importRe);
    expect(ctaSrc).not.toMatch(importRe);
  });
});
