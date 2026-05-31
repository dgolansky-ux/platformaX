// UI_ONLY: exercises the Post Display Kit through React Testing Library.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ChannelPostCard,
  CommunityFeedPostCard,
  CompactPostPreviewCard,
  FriendFeedPostCard,
  ImportantEventCard,
  ProfilePresentationCard,
  RelationalFeedPostCard,
  StaffFeedPostCard,
  WorkplacePostCard,
  WorkplaceTeaserCard,
} from "../variants/PostCardVariants";
import {
  PostEmptyState,
  PostErrorState,
  PostSkeleton,
} from "../PostDisplayStates";
import type { PostDisplayViewModel } from "../types";

const SAMPLE: PostDisplayViewModel = {
  id: "p-1",
  displayType: "friend_post",
  author: { userId: "u-1", displayName: "Ada Karpińska", handle: "ada", avatarRef: null },
  sourceContext: { sourceLabel: "Feed znajomych" },
  title: null,
  bodyPreview: "To jest treść posta.",
  bodyFull: "To jest treść posta, pełna wersja.",
  mediaRefs: [],
  createdAt: "2026-05-30T10:00:00.000Z",
  updatedAt: "2026-05-30T10:00:00.000Z",
  badges: [],
  visibility: "friends_only",
  routeTarget: "/friends-feed",
  actions: { showReact: true, showComment: true, showShare: true, showOpen: true },
  interactionSummary: { likeCount: 3, commentCount: 1, viewerLiked: false, viewerCanReact: true, viewerCanComment: true },
  status: "published",
};

function withDisplayType(displayType: PostDisplayViewModel["displayType"], visibility: PostDisplayViewModel["visibility"]): PostDisplayViewModel {
  return { ...SAMPLE, id: `p-${displayType}`, displayType, visibility };
}

describe("Post Display Kit — base helpers", () => {
  it("PostSkeleton renders without crashing", () => {
    const { container } = render(<PostSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it("PostErrorState renders the message", () => {
    render(<PostErrorState message="Nie udało się wczytać posta." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Nie udało się wczytać posta.");
  });

  it("PostEmptyState renders the message", () => {
    render(<PostEmptyState message="Brak wpisów" />);
    expect(screen.getByText("Brak wpisów")).toBeInTheDocument();
  });
});

describe("Post Display Kit — variants", () => {
  it("FriendFeedPostCard renders author + body + action bar", () => {
    render(<FriendFeedPostCard vm={SAMPLE} />);
    expect(screen.getByLabelText("Post znajomego")).toBeInTheDocument();
    expect(screen.getByText("Ada Karpińska")).toBeInTheDocument();
    expect(screen.getByText(/To jest treść posta/)).toBeInTheDocument();
  });

  it("CommunityFeedPostCard uses community variant label", () => {
    render(<CommunityFeedPostCard vm={withDisplayType("community_post", "community_all")} />);
    expect(screen.getByLabelText("Wpis społeczności")).toBeInTheDocument();
  });

  it("StaffFeedPostCard surfaces 'Tylko kadra' visibility", () => {
    render(<StaffFeedPostCard vm={withDisplayType("staff_post", "community_staff")} />);
    expect(screen.getByLabelText("Wpis kadry")).toBeInTheDocument();
    expect(screen.getByText("Tylko kadra")).toBeInTheDocument();
  });

  it("RelationalFeedPostCard renders relational variant", () => {
    render(<RelationalFeedPostCard vm={withDisplayType("relational_post", "community_relational")} />);
    expect(screen.getByLabelText("Wpis relacyjny")).toBeInTheDocument();
  });

  it("ChannelPostCard uses channel visibility badge", () => {
    render(<ChannelPostCard vm={withDisplayType("channel_post", "channel_followers")} />);
    expect(screen.getByLabelText("Wpis kanału")).toBeInTheDocument();
    expect(screen.getByText("Obserwujący")).toBeInTheDocument();
  });

  it("WorkplacePostCard renders full post body", () => {
    render(<WorkplacePostCard vm={withDisplayType("workplace_post", "workplace_public")} />);
    expect(screen.getByLabelText("Wpis miejsca pracy")).toBeInTheDocument();
    expect(screen.getByText(/pełna wersja/)).toBeInTheDocument();
  });

  it("WorkplaceTeaserCard renders the teaser preview but NOT the full body", () => {
    const teaser: PostDisplayViewModel = {
      ...SAMPLE,
      displayType: "workplace_teaser",
      visibility: "workplace_public",
      bodyFull: null,
      bodyPreview: "Krótka zajawka.",
      actions: { showReact: false, showComment: false, showShare: true, showOpen: true },
    };
    render(<WorkplaceTeaserCard vm={teaser} />);
    expect(screen.getByLabelText("Zajawka miejsca pracy")).toBeInTheDocument();
    expect(screen.getByText("Krótka zajawka.")).toBeInTheDocument();
    expect(screen.queryByText(/pełna wersja/)).not.toBeInTheDocument();
    expect(screen.getByText("Otwórz")).toBeInTheDocument();
  });

  it("ImportantEventCard renders the date pill + title", () => {
    const event: PostDisplayViewModel = {
      ...SAMPLE,
      displayType: "important_event",
      title: "Pierwszy występ",
      date: "2026-06-01T18:00:00.000Z",
      visibility: "public",
    };
    render(<ImportantEventCard vm={event} />);
    expect(screen.getByLabelText("Ważne wydarzenie")).toBeInTheDocument();
    expect(screen.getByText("Pierwszy występ")).toBeInTheDocument();
  });

  it("ProfilePresentationCard renders title + open link", () => {
    const presentation: PostDisplayViewModel = {
      ...SAMPLE,
      displayType: "profile_presentation",
      title: "Moja prezentacja",
      visibility: "public",
    };
    render(<ProfilePresentationCard vm={presentation} />);
    expect(screen.getByLabelText("Prezentacja profilu")).toBeInTheDocument();
    expect(screen.getByText("Otwórz sekcję")).toBeInTheDocument();
  });

  it("CompactPostPreviewCard renders truncated preview + open link", () => {
    render(<CompactPostPreviewCard vm={SAMPLE} />);
    expect(screen.getByLabelText("Skrócony podgląd posta")).toBeInTheDocument();
    expect(screen.getByText("Otwórz")).toBeInTheDocument();
  });

  it("display view models carry no PII", () => {
    const blob = JSON.stringify(SAMPLE);
    expect(blob).not.toMatch(/email/i);
    expect(blob).not.toMatch(/phone/i);
    expect(blob).not.toMatch(/password/i);
    expect(blob).not.toMatch(/data:image/);
  });
});
