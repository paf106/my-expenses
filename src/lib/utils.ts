const euroFormatter = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2, useGrouping: "always" });
const monthFormatter = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
const spanishDateFormatter = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const transactionDayFormatter = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const madridHourFormatter = new Intl.DateTimeFormat("en", { timeZone: "Europe/Madrid", hour: "numeric", hourCycle: "h23" });
const madridDatePartsFormatter = new Intl.DateTimeFormat("en", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" });
export const euro = (value: number) => euroFormatter.format(value);
export const parseMonth = (value: string | null | undefined) => value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0, 4)) >= 1900 ? value : null;
export const monthLabel = (month: string) => {
  const safeMonth = parseMonth(month) || currentMonth();
  return monthFormatter.format(new Date(`${safeMonth}-01T12:00:00`));
};
export const monthBounds = (month: string) => {
  const safeMonth = parseMonth(month) || currentMonth();
  const [year, monthNumber] = safeMonth.split("-").map(Number);
  const endDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { start: `${safeMonth}-01`, end: `${safeMonth}-${String(endDay).padStart(2, "0")}` };
};
export function parseAmountEs(value: string): number | null {
  const normalized = value.trim().replace(/\s+/g, "");
  let canonical: string;
  if (normalized.includes(",") && normalized.includes(".")) {
    if (!/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(normalized)) return null;
    canonical = normalized.replaceAll(".", "").replace(",", ".");
  } else if (normalized.includes(",")) {
    if (!/^\d+,\d{1,2}$/.test(normalized)) return null;
    canonical = normalized.replace(",", ".");
  } else if (normalized.includes(".")) {
    if (/^\d{1,3}(?:\.\d{3})+$/.test(normalized)) canonical = normalized.replaceAll(".", "");
    else if (/^\d+\.\d{1,2}$/.test(normalized)) canonical = normalized;
    else return null;
  } else {
    if (!/^\d+$/.test(normalized)) return null;
    canonical = normalized;
  }
  const amount = Number(canonical);
  return Number.isFinite(amount) && amount <= 9_999_999_999.99 ? amount : null;
}
export const toCents = (amount: number) => Math.round((amount + Number.EPSILON) * 100);
export const fromCents = (cents: number) => cents / 100;
export const currentMonth = () => {
  const parts = madridDatePartsFormatter.formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
};
export const localToday = () => {
  const parts = madridDatePartsFormatter.formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
};
export const formatDateEs = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return spanishDateFormatter.format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
};
export const dateLabel = formatDateEs;
export const formatDate = formatDateEs;
export const transactionDayLabel = (value: string) => {
  const today = localToday();
  const yesterday = new Date(`${today}T12:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (value === today) return "Hoy";
  if (value === yesterday.toISOString().slice(0, 10)) return "Ayer";
  return transactionDayFormatter.format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
};
export const parseDateEs = (value: string) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
};
export const pageGreeting = (hour = Number(madridHourFormatter.format(new Date()))) => hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
export const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");
export const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-ES").trim();

type FilterableTransaction = { type: string; category_id: string | null; description: string };
type SearchableCategory = { id: string; name: string };
export function filterTransactions<T extends FilterableTransaction>(transactions: T[], categories: SearchableCategory[], options: { type: string; category: string; query: string }) {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const searchTerm = normalizeSearch(options.query);
  return transactions.filter((transaction) =>
    (options.type === "all" || transaction.type === options.type)
    && (options.category === "all" || transaction.category_id === options.category)
    && (!searchTerm || normalizeSearch(`${transaction.description} ${categoryNames.get(transaction.category_id || "") || ""}`).includes(searchTerm)),
  );
}
