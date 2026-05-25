import { describe, it, expect } from "vitest";
import {
  canConfirmUpload,
  canCreateUploadIntent,
  canReadMediaAsset,
} from "../public-api";

describe("media policy", () => {
  it("only the owner may create an upload intent", () => {
    expect(canCreateUploadIntent("owner")).toBe(true);
    expect(canCreateUploadIntent("stranger")).toBe(false);
    expect(canCreateUploadIntent("admin")).toBe(false);
  });

  it("only the owner may confirm an upload", () => {
    expect(canConfirmUpload("owner")).toBe(true);
    expect(canConfirmUpload("stranger")).toBe(false);
  });

  it("ready assets are readable by strangers; pending/failed are owner/admin only", () => {
    expect(canReadMediaAsset("stranger", "ready")).toBe(true);
    expect(canReadMediaAsset("stranger", "pending")).toBe(false);
    expect(canReadMediaAsset("stranger", "failed")).toBe(false);
    expect(canReadMediaAsset("owner", "pending")).toBe(true);
    expect(canReadMediaAsset("admin", "pending")).toBe(true);
  });
});
