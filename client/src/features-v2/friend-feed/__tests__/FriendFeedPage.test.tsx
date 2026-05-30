// UI_ONLY: uses React Testing Library helpers; no runtime list APIs.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";
import { FriendFeedPage } from "../FriendFeedPage";
import { PersonalProfileFriendFeedPreview } from "../PersonalProfileFriendFeedPreview";
import { friendFeedMockAdapter } from "../mock-adapter";

function renderPage(viewerId: string) {
  return render(
    <MemoryRouter>
      <FriendFeedPage viewerUserId={viewerId} />
    </MemoryRouter>,
  );
}

describe("FriendFeedPage", () => {
  beforeEach(() => {
    friendFeedMockAdapter.__resetForTests();
  });

  async function openComposer() {
    const trigger = await screen.findByRole("button", { name: /Co chcesz udostępnić znajomym/ });
    fireEvent.click(trigger);
  }

  test("renders heading + composer trigger + fixture posts", async () => {
    renderPage("u-viewer");
    expect(await screen.findByRole("heading", { name: /Feed znajomych/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Co chcesz udostępnić znajomym/ })).toBeInTheDocument();
    expect(await screen.findByText(/Pierwszy wpis Ady/)).toBeInTheDocument();
    expect(screen.getByText(/Kuba wstał wcześnie/)).toBeInTheDocument();
  });

  test("composer trigger opens modal with textarea", async () => {
    renderPage("u-viewer");
    await screen.findByText(/Pierwszy wpis Ady/);
    await openComposer();
    expect(await screen.findByPlaceholderText("Co u Ciebie?")).toBeInTheDocument();
  });

  test("publish CTA disabled when textarea empty", async () => {
    renderPage("u-viewer");
    await screen.findByText(/Pierwszy wpis Ady/);
    await openComposer();
    const btn = await screen.findByRole("button", { name: /Opublikuj/ });
    expect(btn).toBeDisabled();
  });

  test("publishing a new post adds it to the list", async () => {
    renderPage("u-viewer");
    await screen.findByText(/Pierwszy wpis Ady/);
    await openComposer();
    const textarea = await screen.findByPlaceholderText("Co u Ciebie?");
    fireEvent.change(textarea, { target: { value: "Świeży wpis testowy" } });
    const btn = screen.getByRole("button", { name: /Opublikuj/ });
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText("Świeży wpis testowy")).toBeInTheDocument());
  });

  test("react toggles likeCount", async () => {
    renderPage("u-viewer");
    await screen.findByText(/Kuba wstał wcześnie/);
    const likeButtons = screen.getAllByRole("button", { name: /Lubię to|Lubisz to/ });
    const firstLike = likeButtons[0];
    const before = firstLike.textContent ?? "";
    fireEvent.click(firstLike);
    await waitFor(() => expect(firstLike.textContent).not.toBe(before));
  });

  test("composer shows 'no_friends' message when viewer has no friends", async () => {
    renderPage("u-stranger");
    expect(await screen.findByText(/Dodaj znajomych/)).toBeInTheDocument();
  });
});

describe("PersonalProfileFriendFeedPreview", () => {
  beforeEach(() => {
    friendFeedMockAdapter.__resetForTests();
  });

  function renderPreview(viewer: string, owner: string) {
    return render(
      <MemoryRouter>
        <PersonalProfileFriendFeedPreview viewerUserId={viewer} profileOwnerId={owner} />
      </MemoryRouter>,
    );
  }

  test("owner sees own posts and 'Zobacz więcej' CTA", async () => {
    renderPreview("u-viewer", "u-viewer");
    expect(await screen.findByText(/Twoje ostatnie wpisy/)).toBeInTheDocument();
    expect(screen.getByText(/Mój wpis: testuję feed znajomych/)).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /Zobacz więcej/ });
    expect(cta).toHaveAttribute("href", "/friends-feed");
  });

  test("friend sees owner's friends_only posts", async () => {
    renderPreview("u-kuba", "u-ada");
    expect(await screen.findByText(/Ostatnie wpisy znajomego/)).toBeInTheDocument();
    expect(screen.getByText(/Pierwszy wpis Ady/)).toBeInTheDocument();
  });

  test("stranger gets restricted state with friendly copy", async () => {
    renderPreview("u-stranger", "u-ada");
    expect(await screen.findByText(/musisz być w gronie jej znajomych/)).toBeInTheDocument();
  });
});
