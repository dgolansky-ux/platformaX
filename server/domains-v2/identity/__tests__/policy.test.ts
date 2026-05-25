import { describe, expect, it } from "vitest";
import {
  canCompleteOnboarding,
  canReadPrivateProfile,
  canReadPublicProfile,
  canUpdatePrivateProfile,
} from "../policy";

describe("identity policy", () => {
  it("only owner can read private profile", () => {
    expect(canReadPrivateProfile("owner")).toBe(true);
    expect(canReadPrivateProfile("friend")).toBe(false);
    expect(canReadPrivateProfile("stranger")).toBe(false);
    expect(canReadPrivateProfile("admin")).toBe(false);
  });

  it("only owner can update private profile", () => {
    expect(canUpdatePrivateProfile("owner")).toBe(true);
    expect(canUpdatePrivateProfile("friend")).toBe(false);
    expect(canUpdatePrivateProfile("stranger")).toBe(false);
  });

  it("only owner can complete onboarding", () => {
    expect(canCompleteOnboarding("owner")).toBe(true);
    expect(canCompleteOnboarding("stranger")).toBe(false);
    expect(canCompleteOnboarding("friend")).toBe(false);
  });

  it("public visibility is readable by anyone except blocked viewers", () => {
    expect(canReadPublicProfile("owner", "public")).toBe(true);
    expect(canReadPublicProfile("friend", "public")).toBe(true);
    expect(canReadPublicProfile("stranger", "public")).toBe(true);
  });

  it("friends visibility hides the profile from strangers", () => {
    expect(canReadPublicProfile("owner", "friends")).toBe(true);
    expect(canReadPublicProfile("friend", "friends")).toBe(true);
    expect(canReadPublicProfile("stranger", "friends")).toBe(false);
  });

  it("private visibility shows only to owner", () => {
    expect(canReadPublicProfile("owner", "private")).toBe(true);
    expect(canReadPublicProfile("friend", "private")).toBe(false);
    expect(canReadPublicProfile("stranger", "private")).toBe(false);
  });
});
