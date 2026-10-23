import { describe, expect, it } from "vitest";
import { isStaleBuildError } from "./stale-build";

describe("isStaleBuildError", () => {
  it("recognises Next 16's missing server action after a deploy", () => {
    const error = new Error('Server Action "60600ff35faabad6c2e29271d064139fa7c572ab23" was not found on the server. Read more: https://nextjs.org/docs/messages/failed-to-find-server-action');
    error.name = "UnrecognizedActionError";
    expect(isStaleBuildError(error)).toBe(true);
  });

  it("still recognises the older wording and missing chunks", () => {
    expect(isStaleBuildError(new Error("Failed to find Server Action \"abc\". This request might be from an older or newer deployment."))).toBe(true);
    expect(isStaleBuildError(Object.assign(new Error("Loading chunk 12 failed."), { name: "ChunkLoadError" }))).toBe(true);
  });

  it("leaves real errors alone", () => {
    expect(isStaleBuildError(new Error("permission denied for table meetings"))).toBe(false);
    expect(isStaleBuildError(null)).toBe(false);
    expect(isStaleBuildError("Server Action was not found")).toBe(false);
  });
});
