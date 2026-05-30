import { describe, it, expect } from "vitest";
import {
  canConfirmUpload,
  canCreateUploadIntent,
  canDeleteMediaAsset,
  canReadMediaAsset,
} from "../public-api";

describe("media policy — actions", () => {
  it("only the owner may create an upload intent", () => {
    expect(canCreateUploadIntent("owner")).toBe(true);
    expect(canCreateUploadIntent("stranger")).toBe(false);
    expect(canCreateUploadIntent("admin")).toBe(false);
  });

  it("only the owner may confirm an upload", () => {
    expect(canConfirmUpload("owner")).toBe(true);
    expect(canConfirmUpload("stranger")).toBe(false);
  });

  it("only the owner may soft-delete a media asset", () => {
    expect(canDeleteMediaAsset("owner")).toBe(true);
    expect(canDeleteMediaAsset("stranger")).toBe(false);
    expect(canDeleteMediaAsset("admin")).toBe(false);
  });
});

describe("media policy — visibility-aware reads", () => {
  it("public ready assets are readable by strangers", () => {
    expect(
      canReadMediaAsset({ role: "stranger", status: "ready", visibility: "public" }),
    ).toBe(true);
  });

  it("non-ready assets are owner/admin only", () => {
    expect(
      canReadMediaAsset({
        role: "stranger",
        status: "processing",
        visibility: "public",
      }),
    ).toBe(false);
    expect(
      canReadMediaAsset({ role: "stranger", status: "failed", visibility: "public" }),
    ).toBe(false);
    expect(
      canReadMediaAsset({
        role: "owner",
        status: "processing",
        visibility: "public",
      }),
    ).toBe(true);
    expect(
      canReadMediaAsset({
        role: "admin",
        status: "processing",
        visibility: "public",
      }),
    ).toBe(true);
  });

  it("friends-only assets need viewerIsFriend", () => {
    expect(
      canReadMediaAsset({
        role: "stranger",
        status: "ready",
        visibility: "friends_only",
      }),
    ).toBe(false);
    expect(
      canReadMediaAsset({
        role: "stranger",
        status: "ready",
        visibility: "friends_only",
        viewerIsFriend: true,
      }),
    ).toBe(true);
  });

  it("members-only assets need viewerIsMember", () => {
    expect(
      canReadMediaAsset({
        role: "stranger",
        status: "ready",
        visibility: "members_only",
      }),
    ).toBe(false);
    expect(
      canReadMediaAsset({
        role: "stranger",
        status: "ready",
        visibility: "members_only",
        viewerIsMember: true,
      }),
    ).toBe(true);
  });

  it("owner-only assets are never readable by strangers, even when ready", () => {
    expect(
      canReadMediaAsset({
        role: "stranger",
        status: "ready",
        visibility: "owner_only",
        viewerIsFriend: true,
      }),
    ).toBe(false);
    expect(
      canReadMediaAsset({
        role: "owner",
        status: "ready",
        visibility: "owner_only",
      }),
    ).toBe(true);
  });
});
