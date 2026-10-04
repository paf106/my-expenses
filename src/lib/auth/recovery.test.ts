import { describe, expect, it } from "vitest";
import { getSafeRecoveryPath } from "./recovery";

describe("getSafeRecoveryPath", () => {
  it("allows only known internal recovery destinations", () => {
    expect(getSafeRecoveryPath("/reset-password")).toBe("/reset-password");
  });

  it("falls back to the reset form for external or unknown destinations", () => {
    expect(getSafeRecoveryPath("https://example.com")).toBe("/reset-password");
    expect(getSafeRecoveryPath("//example.com")).toBe("/reset-password");
    expect(getSafeRecoveryPath(null)).toBe("/reset-password");
  });
});
