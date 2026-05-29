import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ContactPersonDetailsPanel } from "../ContactPersonDetailsPanel";
import { ProfileContactCard } from "../ProfileContactCard";
import type {
  ContactPersonSummary,
  ContactProfileRelationshipDTO,
} from "@shared/contracts/contacts";
import { toUserId } from "@shared/contracts/branded-ids";

const SUMMARY: ContactPersonSummary = {
  userId: toUserId("u-bob"),
  displayName: "Bartek Nowak",
  handle: "bartek",
  avatarInitial: "B",
  professionName: "Fizjoterapeuta",
};

function rel(
  over: Partial<ContactProfileRelationshipDTO> = {},
): ContactProfileRelationshipDTO {
  return {
    ownerId: toUserId("u-bob"),
    viewerId: toUserId("u-alice"),
    isMutualFriend: false,
    isAddressBookContact: false,
    isSpecialist: false,
    friendCircle: "none",
    contactRequestStatus: "none",
    friendRequestStatus: "none",
    visibleContactFields: {},
    availableActions: ["REQUEST_CONTACT", "ADD_TO_CONTACTS", "ADD_AS_SPECIALIST"],
    ...over,
  };
}

describe("ContactPersonDetailsPanel — availableActions drive buttons", () => {
  test("renders one button per availableAction and dispatches the action", () => {
    const onAction = vi.fn();
    render(<ContactPersonDetailsPanel summary={SUMMARY} relationship={rel()} onAction={onAction} />);
    expect(screen.getByText("Bartek Nowak")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Poproś o kontakt" }));
    expect(onAction).toHaveBeenCalledWith("REQUEST_CONTACT");
    expect(screen.getByRole("button", { name: "Dodaj do kontaktów" })).toBeInTheDocument();
    // an action NOT in the set must not render a button
    expect(screen.queryByRole("button", { name: "Usuń znajomego" })).not.toBeInTheDocument();
  });

  test("no granted fields → explicit no-access message, zero PII", () => {
    render(<ContactPersonDetailsPanel summary={SUMMARY} relationship={rel()} onAction={vi.fn()} />);
    expect(
      screen.getByText(/wymagana zaakceptowana prośba o kontakt/),
    ).toBeInTheDocument();
  });

  test("granted fields render only what the policy allowed", () => {
    const r = rel({
      visibleContactFields: { phone: "+48 111 222 333" },
      availableActions: ["REMOVE_FROM_CONTACTS"],
    });
    render(<ProfileContactCard relationship={r} onAction={vi.fn()} />);
    expect(screen.getByText("Telefon")).toBeInTheDocument();
    expect(screen.getByText("+48 111 222 333")).toBeInTheDocument();
    expect(screen.getByText("Masz dostęp do kontaktu")).toBeInTheDocument();
  });
});
