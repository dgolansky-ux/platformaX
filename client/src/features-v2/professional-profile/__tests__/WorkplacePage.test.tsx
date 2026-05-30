import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { WorkplacePage } from "../WorkplacePage";
import { professionalProfileMockAdapter } from "../mock-adapter";

describe("WorkplacePage", () => {
  beforeEach(() => {
    professionalProfileMockAdapter.__resetForTests();
  });

  test("owner sees hero + composer + own contact data + owner actions", async () => {
    render(
      <WorkplacePage
        viewerUserId="u-viewer"
        ownerUserId="u-viewer"
        workplaceSlug="coach-dawid"
      />,
    );
    expect(await screen.findByRole("heading", { name: /^Coach Dawid$/ })).toBeInTheDocument();
    // Owner sees private contact data
    expect(await screen.findByText("kontakt@example.com")).toBeInTheDocument();
    expect(screen.getByText("+48 600 000 000")).toBeInTheDocument();
    // Owner actions block
    expect(screen.getByRole("heading", { name: /Akcje właściciela/ })).toBeInTheDocument();
    // Micro-feed composer
    expect(screen.getByLabelText(/Treść wpisu w mikro-feedzie/)).toBeInTheDocument();
  });

  test("stranger sees workplace but no contact data and no composer", async () => {
    render(
      <WorkplacePage
        viewerUserId="u-stranger"
        ownerUserId="u-viewer"
        workplaceSlug="coach-dawid"
      />,
    );
    expect(await screen.findByRole("heading", { name: /^Coach Dawid$/ })).toBeInTheDocument();
    // Stranger never sees private contact (contactVisibility=friends)
    expect(screen.queryByText("kontakt@example.com")).toBeNull();
    expect(screen.queryByText("+48 600 000 000")).toBeNull();
    expect(screen.queryByRole("heading", { name: /Akcje właściciela/ })).toBeNull();
    expect(screen.queryByLabelText(/Treść wpisu w mikro-feedzie/)).toBeNull();
  });

  test("owner can publish to the micro-feed and it appears in the list", async () => {
    render(
      <WorkplacePage
        viewerUserId="u-viewer"
        ownerUserId="u-viewer"
        workplaceSlug="coach-dawid"
      />,
    );
    const textarea = await screen.findByLabelText(/Treść wpisu w mikro-feedzie/);
    fireEvent.change(textarea, { target: { value: "Świeża aktualizacja w mikro-feedzie." } });
    fireEvent.click(screen.getByRole("button", { name: /Opublikuj/ }));
    await waitFor(() =>
      expect(screen.getByText("Świeża aktualizacja w mikro-feedzie.")).toBeInTheDocument(),
    );
  });
});
