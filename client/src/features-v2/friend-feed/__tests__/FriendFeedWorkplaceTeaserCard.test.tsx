import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { FriendFeedWorkplaceTeaserCard } from "../../friend-feed/FriendFeedWorkplaceTeaserCard";
import type { FriendFeedWorkplaceTeaserItemUi } from "../../friend-feed/types";

const ITEM: FriendFeedWorkplaceTeaserItemUi = {
  teaser: {
    id: "wt-1",
    sourcePostId: "wpost-1",
    workplaceId: "wp-1",
    workplaceName: "Coach Dawid",
    workplaceSlug: "coach-dawid",
    ownerUserId: "u-viewer",
    previewText: "Krótka zajawka pierwszego wpisu w miejscu pracy.",
    previewMediaRef: null,
    visibility: "public",
    createdAt: "2026-05-26T09:00:00Z",
    targetRoute: "/profile/workplaces/coach-dawid/posts/wpost-1",
  },
  owner: { userId: "u-viewer", displayName: "Dawid", handle: "dawid", avatarRef: null },
};

describe("FriendFeedWorkplaceTeaserCard", () => {
  test("renders preview text, workplace label, owner and CTA — but NOT a full post body", () => {
    const onOpen = vi.fn();
    render(<FriendFeedWorkplaceTeaserCard item={ITEM} onOpen={onOpen} />);
    expect(screen.getByText(/Krótka zajawka pierwszego wpisu/)).toBeInTheDocument();
    expect(screen.getByText(/Z miejsca pracy/)).toBeInTheDocument();
    expect(screen.getByText("Dawid")).toBeInTheDocument();
    expect(screen.getByText("Coach Dawid")).toBeInTheDocument();
    // CTA routes to the full workplace post through the shared display kit link.
    expect(screen.getByRole("link", { name: /Otwórz/ })).toHaveAttribute(
      "href",
      "/profile/workplaces/coach-dawid/posts/wpost-1",
    );
    expect(onOpen).not.toHaveBeenCalled();
  });

  test("teaser carries no contact data fields and is marked as the workplace variant", () => {
    render(<FriendFeedWorkplaceTeaserCard item={ITEM} />);
    const card = screen.getByTestId("friend-feed-workplace-teaser");
    // No email / phone leaks in DOM
    expect(card.textContent).not.toMatch(/@example/);
    expect(card.textContent).not.toMatch(/\+48/);
  });
});
