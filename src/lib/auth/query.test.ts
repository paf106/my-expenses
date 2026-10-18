import { describe, expect, it } from "vitest";
import { normalizeAuthQuery } from "./query";

describe("normalizeAuthQuery", () => {
  it("keeps scalar query values and discards repeated or missing parameters", () => {
    expect(normalizeAuthQuery({ next: "/transactions", code: ["first", "second"], token_hash: undefined })).toEqual({ next: "/transactions" });
  });
});
