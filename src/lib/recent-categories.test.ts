import { describe, expect, it } from "vitest";
import { moveRecentCategoryToFront, normalizeRecentCategoryIds } from "./recent-categories";

describe("recent category ordering", () => {
  it("moves a selected category to the front and keeps only three unique ids", () => {
    expect(moveRecentCategoryToFront(["food", "home", "transport"], "home")).toEqual(["home", "food", "transport"]);
    expect(moveRecentCategoryToFront(["food", "home", "transport"], "health")).toEqual(["health", "food", "home"]);
  });

  it("normalizes untrusted storage values", () => {
    expect(normalizeRecentCategoryIds(["food", 12, "food", "home", "", "health", "other"])).toEqual(["food", "home", "health"]);
    expect(normalizeRecentCategoryIds(null)).toEqual([]);
  });
});
