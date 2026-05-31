// UI_ONLY: exercises the publishing composer through React Testing Library.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { FriendFeedComposer } from "../composers/FriendFeedComposer";
import { ChannelComposer } from "../composers/ChannelComposer";
import { WorkplaceComposer } from "../composers/WorkplaceComposer";
import { ImportantEventComposer } from "../composers/ImportantEventComposer";
import { ProfilePresentationComposer } from "../composers/ProfilePresentationComposer";
import { CommunityFeedComposer, StaffFeedComposer, RelationalFeedComposer } from "../composers/CommunityFeedComposer";
import { createPublishingMockAdapter } from "../mock-adapter";
import type { PublishingAdapter, PublishingTargetDefinitionUi } from "../types";

const VIEWER = "u-viewer";

function targets(): readonly PublishingTargetDefinitionUi[] {
  return [
    {
      targetType: "friend_feed",
      targetId: VIEWER,
      label: "Twój feed znajomych",
      description: "",
      allowedContentTypes: ["text_post"],
      allowedMediaTypes: ["image"],
      visibilityOptions: ["friends_only", "public", "private"],
      defaultVisibility: "friends_only",
      maxBodyLength: 4000,
      maxMediaCount: 4,
      permissionsRequired: [],
      status: "available",
      routeTarget: "/friends-feed",
    },
    {
      targetType: "channel",
      targetId: "ch-1",
      label: "Kanał: Główny",
      description: "",
      allowedContentTypes: ["channel_post"],
      allowedMediaTypes: ["image"],
      visibilityOptions: ["channel_followers"],
      defaultVisibility: "channel_followers",
      maxBodyLength: 8000,
      maxMediaCount: 8,
      permissionsRequired: ["publish_channel_content"],
      status: "available",
      routeTarget: "/channels/ch-1",
    },
    {
      targetType: "workplace",
      targetId: "wp-1",
      label: "Miejsce pracy: Studio",
      description: "",
      allowedContentTypes: ["workplace_update"],
      allowedMediaTypes: ["image"],
      visibilityOptions: ["workplace_public", "workplace_friends_only", "workplace_private"],
      defaultVisibility: "workplace_public",
      maxBodyLength: 6000,
      maxMediaCount: 6,
      permissionsRequired: ["workplace_owner"],
      status: "available",
      routeTarget: "/workplace/wp-1",
    },
    {
      targetType: "important_event",
      targetId: VIEWER,
      label: "Ważne wydarzenie",
      description: "",
      allowedContentTypes: ["important_event"],
      allowedMediaTypes: ["image"],
      visibilityOptions: ["public", "friends_only", "private"],
      defaultVisibility: "public",
      maxBodyLength: 4000,
      maxMediaCount: 4,
      permissionsRequired: ["profile_owner"],
      status: "partial",
      blockedReason: "backend_not_ready_v2",
      routeTarget: "/profile/me/important-events",
    },
    {
      targetType: "profile_presentation",
      targetId: VIEWER,
      label: "Prezentacja profilu",
      description: "",
      allowedContentTypes: ["profile_presentation_item"],
      allowedMediaTypes: ["image"],
      visibilityOptions: ["public", "friends_only", "private"],
      defaultVisibility: "public",
      maxBodyLength: 6000,
      maxMediaCount: 6,
      permissionsRequired: ["profile_owner"],
      status: "partial",
      blockedReason: "backend_not_ready_v2",
      routeTarget: "/profile/me/presentation",
    },
    {
      targetType: "community_feed",
      targetId: "co-1",
      label: "Społeczność · Feed",
      description: "",
      allowedContentTypes: ["community_post"],
      allowedMediaTypes: ["image"],
      visibilityOptions: ["community_all"],
      defaultVisibility: "community_all",
      maxBodyLength: 6000,
      maxMediaCount: 6,
      permissionsRequired: [],
      status: "available",
      routeTarget: "/communities/co-1/feed",
    },
    {
      targetType: "community_staff_feed",
      targetId: "co-1",
      label: "Społeczność · Kadra",
      description: "",
      allowedContentTypes: ["community_post"],
      allowedMediaTypes: ["image"],
      visibilityOptions: ["community_staff"],
      defaultVisibility: "community_staff",
      maxBodyLength: 6000,
      maxMediaCount: 6,
      permissionsRequired: ["community_staff"],
      status: "available",
      routeTarget: "/communities/co-1/staff-feed",
    },
    {
      targetType: "community_relational_feed",
      targetId: "co-1",
      label: "Społeczność · Relacyjny",
      description: "",
      allowedContentTypes: ["community_post"],
      allowedMediaTypes: ["image"],
      visibilityOptions: ["community_relational"],
      defaultVisibility: "community_relational",
      maxBodyLength: 6000,
      maxMediaCount: 6,
      permissionsRequired: [],
      status: "available",
      routeTarget: "/communities/co-1/relational-feed",
    },
  ];
}

let adapter: PublishingAdapter;
const allTargets = targets();

beforeEach(() => {
  adapter = createPublishingMockAdapter({ targets: allTargets });
});

describe("PublishingComposerCore — variants", () => {
  it("FriendFeedComposer renders with target selector + visibility selector + submit", () => {
    render(
      <FriendFeedComposer
        viewerUserId={VIEWER}
        adapter={adapter}
        availableTargets={allTargets}
        friendFeedTarget={allTargets[0]}
      />,
    );
    expect(screen.getByRole("heading", { name: /Napisz do znajomych/ })).toBeInTheDocument();
    expect(screen.getByText(/Gdzie publikujesz\?/)).toBeInTheDocument();
    expect(screen.getByText(/Widoczność/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Opublikuj/i })).toBeDisabled();
  });

  it("ChannelComposer renders channel-flavoured submit label", () => {
    render(
      <ChannelComposer
        viewerUserId={VIEWER}
        adapter={adapter}
        availableTargets={allTargets}
        channelTarget={allTargets[1]}
      />,
    );
    expect(screen.getByRole("heading", { name: /Kanał: Główny/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Opublikuj wpis/ })).toBeDisabled();
  });

  it("WorkplaceComposer mentions friend-feed teaser in subtitle", () => {
    render(
      <WorkplaceComposer
        viewerUserId={VIEWER}
        adapter={adapter}
        availableTargets={allTargets}
        workplaceTarget={allTargets[2]}
      />,
    );
    expect(screen.getByText(/zajawka/i)).toBeInTheDocument();
  });

  it("ImportantEventComposer exposes title + date fields and shows partial badge", () => {
    render(
      <ImportantEventComposer
        viewerUserId={VIEWER}
        adapter={adapter}
        availableTargets={allTargets}
        importantEventTarget={allTargets[3]}
      />,
    );
    expect(screen.getByPlaceholderText("Tytuł")).toBeInTheDocument();
    expect(screen.getByText("w przygotowaniu")).toBeInTheDocument();
  });

  it("ProfilePresentationComposer shows partial badge — backend not ready in V2", () => {
    render(
      <ProfilePresentationComposer
        viewerUserId={VIEWER}
        adapter={adapter}
        availableTargets={allTargets}
        presentationTarget={allTargets[4]}
      />,
    );
    expect(screen.getByPlaceholderText("Tytuł")).toBeInTheDocument();
    expect(screen.getByText("w przygotowaniu")).toBeInTheDocument();
  });

  it("CommunityFeedComposer / StaffFeedComposer / RelationalFeedComposer all render with distinct titles", () => {
    const { rerender } = render(
      <CommunityFeedComposer
        viewerUserId={VIEWER}
        adapter={adapter}
        availableTargets={allTargets}
        communityTarget={allTargets[5]}
      />,
    );
    expect(screen.getByRole("heading", { name: /Wpis dla społeczności/ })).toBeInTheDocument();
    rerender(
      <StaffFeedComposer
        viewerUserId={VIEWER}
        adapter={adapter}
        availableTargets={allTargets}
        communityTarget={allTargets[6]}
      />,
    );
    expect(screen.getByRole("heading", { name: /Wpis dla kadry/ })).toBeInTheDocument();
    rerender(
      <RelationalFeedComposer
        viewerUserId={VIEWER}
        adapter={adapter}
        availableTargets={allTargets}
        communityTarget={allTargets[7]}
      />,
    );
    expect(screen.getByRole("heading", { name: /Wpis relacyjny/ })).toBeInTheDocument();
  });

  it("publishing a friend-feed post shows the success badge and clears the body", async () => {
    render(
      <FriendFeedComposer
        viewerUserId={VIEWER}
        adapter={adapter}
        availableTargets={allTargets}
        friendFeedTarget={allTargets[0]}
      />,
    );
    const textarea = screen.getByPlaceholderText("Co u Ciebie?") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Cześć!" } });
    const submit = screen.getByRole("button", { name: /Opublikuj/i });
    await waitFor(() => expect(submit).not.toBeDisabled());
    fireEvent.click(submit);
    await waitFor(() => expect(screen.getByText(/Opublikowano/)).toBeInTheDocument());
    expect(textarea.value).toBe("");
  });

  it("important_event composer keeps submit disabled for a partial target — partial badge surfaces the truth", () => {
    render(
      <ImportantEventComposer
        viewerUserId={VIEWER}
        adapter={adapter}
        availableTargets={allTargets}
        importantEventTarget={allTargets[3]}
      />,
    );
    expect(screen.getByText("w przygotowaniu")).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: /Zapisz wydarzenie/ });
    expect(submit).toBeDisabled();
  });

  it("partial target publish via adapter returns truthful PARTIAL envelope", async () => {
    const partialResult = await adapter.publish(VIEWER, {
      targetType: "important_event",
      targetId: VIEWER,
      contentType: "important_event",
      body: "Występ",
      title: "Pierwszy występ",
      date: "2026-06-01T18:00:00.000Z",
      visibility: "public",
      idempotencyKey: "test-ie-partial",
    });
    expect(partialResult.status).toBe("partial");
    expect(partialResult.errors[0]?.code).toBe("TARGET_PARTIAL");
    expect(partialResult.publishedEntity).toBeNull();
  });
});
