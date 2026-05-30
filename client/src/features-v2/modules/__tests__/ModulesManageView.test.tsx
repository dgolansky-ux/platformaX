import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { ModulesManageView } from "../ModulesManageView";
import { modulesMockAdapter } from "../mock-adapter";

describe("ModulesManageView — profile owner", () => {
  beforeEach(() => {
    modulesMockAdapter.__resetForTests();
  });

  test("renders modules with Profil/Społeczność badges", async () => {
    render(<ModulesManageView ownerType="profile" ownerId="u-demo-ada" />);
    expect(await screen.findByRole("heading", { name: /Moduły profilu/ })).toBeInTheDocument();
    expect(await screen.findByText("Tematy")).toBeInTheDocument();
    expect(screen.getByText("Wydarzenia")).toBeInTheDocument();
    expect(screen.getByText("Newsletter chatowy")).toBeInTheDocument();
  });

  test("channel_entry is shown but flagged as unavailable for profile", async () => {
    render(<ModulesManageView ownerType="profile" ownerId="u-demo-ada" />);
    const channelsRow = (await screen.findByText("Kanały")).closest("li");
    expect(channelsRow).not.toBeNull();
    expect(channelsRow!.textContent).toMatch(/Niedostępny/);
    expect(channelsRow!.querySelector("button")?.textContent).toMatch(/Niedostępny/);
  });

  test("owner can toggle topics on for their profile", async () => {
    render(<ModulesManageView ownerType="profile" ownerId="u-demo-ada" />);
    const topicsRow = (await screen.findByText("Tematy")).closest("li");
    expect(topicsRow).not.toBeNull();
    const btn = topicsRow!.querySelector("button");
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toMatch(/Włącz/);
    fireEvent.click(btn!);
    await waitFor(() => expect(btn!.textContent).toMatch(/Wyłącz/));
  });

  test("unknown owner shows error", async () => {
    render(<ModulesManageView ownerType="profile" ownerId="u-ghost" />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/Owner not found/);
  });
});

describe("ModulesManageView — community owner", () => {
  beforeEach(() => {
    modulesMockAdapter.__resetForTests();
  });

  test("manager renders heading + can toggle integrations", async () => {
    render(<ModulesManageView ownerType="community" ownerId="community-product-builders" />);
    expect(await screen.findByRole("heading", { name: /Moduły społeczności/ })).toBeInTheDocument();
    const row = (await screen.findByText("Integracje")).closest("li");
    expect(row).not.toBeNull();
    const btn = row!.querySelector("button");
    expect(btn).not.toBeNull();
    fireEvent.click(btn!);
    await waitFor(() => expect(btn!.textContent).toMatch(/Wyłącz/));
  });

  test("non-manager sees read-only notice — no toggle buttons", async () => {
    render(<ModulesManageView ownerType="community" ownerId="community-zdrowie-ruch" />);
    expect(await screen.findByText(/Tryb tylko do odczytu/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Włącz$/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Wyłącz$/ })).toBeNull();
  });
});
