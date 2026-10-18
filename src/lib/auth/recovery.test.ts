import { describe, expect, it } from "vitest";
import { getSafeNextPath, getSafeRecoveryPath } from "./recovery";

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

describe("getSafeNextPath", () => {
  it("allows known internal app routes and preserves their query", () => {
    expect(getSafeNextPath("/transactions?month=2026-10&type=income")).toBe("/transactions?month=2026-10&type=income");
    expect(getSafeNextPath("/settings/categories")).toBe("/settings/categories");
  });

  it.each(["https://example.com", "//example.com", "/\\example.com", "/login", null, "javascript:alert(1)"]) (
    "falls back to dashboard for unsafe or unknown destination %s",
    (value) => expect(getSafeNextPath(value)).toBe("/dashboard"),
  );
});
