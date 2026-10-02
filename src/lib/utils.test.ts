import { describe, expect, it } from "vitest";
import { currentMonth, euro, filterTransactions, formatDateEs, monthBounds, normalizeSearch, pageGreeting, parseDateEs } from "@/lib/utils";

describe("finance utilities", () => {
  it("normalizes accented, case-insensitive searches", () => {
    expect(normalizeSearch("  ALIMENTACIÓN ")).toBe("alimentacion");
  });

  it("calculates month boundaries including leap years", () => {
    expect(monthBounds("2024-02")).toEqual({ start: "2024-02-01", end: "2024-02-29" });
  });

  it("formats and validates Spanish day/month/year dates", () => {
    expect(formatDateEs("2026-02-10")).toBe("10/02/2026");
    expect(parseDateEs("10/02/2026")).toBe("2026-02-10");
    expect(parseDateEs("31/02/2026")).toBeNull();
  });

  it("formats euro values using Spanish locale", () => {
    expect(euro(1234.5)).toBe("1.234,50 €");
  });

  it("uses Madrid time for greetings and month", () => {
    expect(pageGreeting(11)).toBe("Buenos días");
    expect(pageGreeting(12)).toBe("Buenas tardes");
    expect(pageGreeting(20)).toBe("Buenas noches");
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/);
  });

  it("filters by type, category and accent-insensitive description/category text", () => {
    const transactions = [
      { id: "1", type: "expense", category_id: "food", description: "Compra semanal", recurring_id: null, amount: 20, date: "2026-09-01" },
      { id: "2", type: "income", category_id: "salary", description: "Nómina", recurring_id: null, amount: 1000, date: "2026-09-02" },
    ];
    const categories = [{ id: "food", name: "Alimentación" }, { id: "salary", name: "Nómina" }];
    expect(filterTransactions(transactions, categories, { type: "expense", category: "all", query: "alimentacion" }).map(({ id }) => id)).toEqual(["1"]);
    expect(filterTransactions(transactions, categories, { type: "income", category: "salary", query: "nomina" }).map(({ id }) => id)).toEqual(["2"]);
  });
});
