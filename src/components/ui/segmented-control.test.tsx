// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./segmented-control";

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
const cssEscape = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
if (!window.CSS) Object.defineProperty(window, "CSS", { configurable: true, value: { escape: cssEscape } });
else if (!window.CSS.escape) Object.defineProperty(window.CSS, "escape", { configurable: true, value: cssEscape });
afterEach(cleanup);

function Harness() {
  const [value, setValue] = useState("expense");
  return <SegmentedControl label="Tipo de movimiento" value={value} onChange={setValue} options={[{ id: "expense", label: "Gasto" }, { id: "income", label: "Ingreso" }]} />;
}

describe("SegmentedControl", () => {
  it("exposes its group name and selected state", () => {
    render(<Harness />);
    expect(screen.getByRole("group", { name: "Tipo de movimiento" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Gasto" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Ingreso" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("supports selecting options with arrow keys", () => {
    render(<Harness />);
    const expense = screen.getByRole("button", { name: "Gasto" });
    fireEvent.keyDown(expense, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "Ingreso" }).getAttribute("aria-pressed")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ingreso" }));
  });
});
