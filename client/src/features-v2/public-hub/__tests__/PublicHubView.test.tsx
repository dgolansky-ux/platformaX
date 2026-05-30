// UI_ONLY: uses React Testing Library helpers (getAllByRole) — no runtime
// list APIs are exercised here.
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { PublicHubView } from "../PublicHubView";
import { modulesMockAdapter } from "../../modules";

describe("PublicHubView — profile", () => {
  beforeEach(() => {
    modulesMockAdapter.__resetForTests();
  });

  test("renders profile hero with handle", async () => {
    render(<PublicHubView ownerType="profile" ownerId="u-demo-ada" />);
    expect(await screen.findByRole("heading", { name: /Ada Demo/ })).toBeInTheDocument();
    expect(screen.getByText("@ada")).toBeInTheDocument();
    expect(screen.getByText(/Profil osobisty · Public Hub/)).toBeInTheDocument();
  });

  test("empty state shown when no modules are enabled", async () => {
    render(<PublicHubView ownerType="profile" ownerId="u-demo-ada" />);
    expect(await screen.findByRole("status")).toHaveTextContent(/nie ma jeszcze włączonych modułów/);
  });

  test("enabling topics shows TopicsSlot with seeded data", async () => {
    await modulesMockAdapter.getOwnerContext("profile", "u-demo-ada");
    await modulesMockAdapter.toggleModule({
      ownerType: "profile",
      ownerId: "u-demo-ada",
      moduleKey: "topics",
      enabled: true,
    });
    render(<PublicHubView ownerType="profile" ownerId="u-demo-ada" />);
    await waitFor(() => expect(screen.getByRole("region", { name: "Tematy" })).toBeInTheDocument());
    expect(screen.getByText(/#wellness/)).toBeInTheDocument();
  });

  test("enabling newsletter_chat shows broadcast label", async () => {
    await modulesMockAdapter.getOwnerContext("profile", "u-demo-ada");
    await modulesMockAdapter.toggleModule({
      ownerType: "profile",
      ownerId: "u-demo-ada",
      moduleKey: "newsletter_chat",
      enabled: true,
    });
    render(<PublicHubView ownerType="profile" ownerId="u-demo-ada" />);
    await waitFor(() => expect(screen.getByRole("region", { name: "Newsletter chatowy" })).toBeInTheDocument());
    expect(screen.getByText(/Newsletter \(broadcast\)/)).toBeInTheDocument();
    expect(screen.getByText(/248 subskrybentów/)).toBeInTheDocument();
  });
});

describe("PublicHubView — community", () => {
  beforeEach(() => {
    modulesMockAdapter.__resetForTests();
  });

  test("renders community hero", async () => {
    render(<PublicHubView ownerType="community" ownerId="community-product-builders" />);
    expect(await screen.findByRole("heading", { name: /Product Builders/ })).toBeInTheDocument();
    expect(screen.getByText(/Społeczność · Public Hub/)).toBeInTheDocument();
  });

  test("events slot shows date badge and location label", async () => {
    await modulesMockAdapter.getOwnerContext("community", "community-product-builders");
    await modulesMockAdapter.toggleModule({
      ownerType: "community",
      ownerId: "community-product-builders",
      moduleKey: "events",
      enabled: true,
    });
    render(<PublicHubView ownerType="community" ownerId="community-product-builders" />);
    await waitFor(() => expect(screen.getByRole("region", { name: "Wydarzenia" })).toBeInTheDocument());
    expect(screen.getByText(/Hybrydowo/)).toBeInTheDocument();
  });

  test("integrations slot renders only safe URLs from fixtures", async () => {
    await modulesMockAdapter.getOwnerContext("community", "community-product-builders");
    await modulesMockAdapter.toggleModule({
      ownerType: "community",
      ownerId: "community-product-builders",
      moduleKey: "integrations",
      enabled: true,
    });
    render(<PublicHubView ownerType="community" ownerId="community-product-builders" />);
    await waitFor(() => expect(screen.getByRole("region", { name: "Integracje" })).toBeInTheDocument());
    const links = screen.getAllByRole("link");
    for (const a of links) {
      const href = a.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).not.toMatch(/^javascript:/i);
      expect(href).not.toMatch(/^data:/i);
    }
  });

  test("unknown community shows error", async () => {
    render(<PublicHubView ownerType="community" ownerId="missing" />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/not found/i);
  });
});
