import { afterEach, describe, expect, it, vi } from "vitest";
import { currentMonth, euro, filterTransactions, formatDateEs, fromCents, monthBounds, normalizeSearch, pageGreeting, parseAmountEs, parseDateEs, parseMonth, toCents } from "@/lib/utils";
import { quoteCsvCell } from "@/lib/csv";

describe("finance utilities", () => {
  afterEach(() => vi.useRealTimers());
  it("normalizes accented, case-insensitive searches", () => {
    expect(normalizeSearch("  ALIMENTACIÓN ")).toBe("alimentacion");
  });

  it("calculates month boundaries including leap years", () => {
    expect(monthBounds("2024-02")).toEqual({ start: "2024-02-01", end: "2024-02-29" });
    expect(monthBounds("2026-13")).toEqual(monthBounds(currentMonth()));
  });

  it("validates YYYY-MM values without accepting impossible months", () => {
    expect(parseMonth("2026-02")).toBe("2026-02");
    expect(parseMonth("2026-00")).toBeNull();
    expect(parseMonth("2026-13")).toBeNull();
    expect(parseMonth("0000-01")).toBeNull();
    expect(parseMonth("abc")).toBeNull();
  });

  it("parses Spanish currency input and rejects ambiguous precision", () => {
    expect(parseAmountEs("1.234,56")).toBe(1234.56);
    expect(parseAmountEs("1.000")).toBe(1000);
    expect(parseAmountEs("12,34")).toBe(12.34);
    expect(parseAmountEs("12,345")).toBeNull();
    expect(parseAmountEs("1.23,45")).toBeNull();
  });

  it("sums money in integer cents", () => {
    expect(toCents(0.1) + toCents(0.2)).toBe(30);
    expect(fromCents(toCents(0.3) - toCents(0.1) - toCents(0.2))).toBe(0);
  });

  it("quotes CSV cells and neutralizes spreadsheet formulas", () => {
    expect(quoteCsvCell('=HYPERLINK("https://example.com")')).toBe('"\'=HYPERLINK(""https://example.com"")"');
    expect(quoteCsvCell("  =1+1")).toBe('"\'  =1+1"');
    expect(quoteCsvCell(-125)).toBe('"-125"');
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

  it("uses the Madrid calendar month at UTC month boundaries", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-31T23:30:00.000Z"));
    expect(currentMonth()).toBe("2026-02");
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
