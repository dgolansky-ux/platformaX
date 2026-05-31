import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ProfileProfessionalLayer } from "../ProfileProfessionalLayer";
import { professionalProfileMockAdapter } from "../mock-adapter";

describe("ProfileProfessionalLayer", () => {
  beforeEach(() => {
    professionalProfileMockAdapter.__resetForTests();
  });

  test("owner sees Add CTA and seeded workplace card", async () => {
    const onAdd = vi.fn();
    const onOpen = vi.fn();
    render(
      <ProfileProfessionalLayer
        viewerUserId="u-viewer"
        profileOwnerId="u-viewer"
        onAddWorkplace={onAdd}
        onOpenWorkplace={onOpen}
      />,
    );
    expect(await screen.findByRole("heading", { name: /Miejsca pracy/ })).toBeInTheDocument();
    const addBtn = screen.getByRole("button", { name: /Dodaj miejsce pracy/ });
    expect(addBtn).toBeEnabled();
    fireEvent.click(addBtn);
    expect(onAdd).toHaveBeenCalled();

    const card = await screen.findByText("Coach Dawid");
    fireEvent.click(card);
    expect(onOpen).toHaveBeenCalledWith("coach-dawid");
  });

  test("stranger sees no Add CTA and only public workplaces", async () => {
    render(
      <ProfileProfessionalLayer
        viewerUserId="u-stranger"
        profileOwnerId="u-viewer"
      />,
    );
    expect(await screen.findByRole("heading", { name: /Miejsca pracy/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Dodaj miejsce pracy/ })).toBeNull();
    // Seeded workplace is "public" — visible to strangers.
    expect(await screen.findByText("Coach Dawid")).toBeInTheDocument();
  });
});
