const euroFormatter = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2, useGrouping: "always" });
const monthFormatter = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
const dateLabelFormatter = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" });
const shortDateFormatter = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
const madridHourFormatter = new Intl.DateTimeFormat("en", { timeZone: "Europe/Madrid", hour: "numeric", hourCycle: "h23" });
const madridDatePartsFormatter = new Intl.DateTimeFormat("en", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" });
export const euro = (value: number) => euroFormatter.format(value);
export const monthLabel = (month: string) => monthFormatter.format(new Date(`${month}-01T12:00:00`));
export const monthBounds = (month: string) => {
  const start = new Date(`${month}-01T00:00:00`);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return { start: `${month}-01`, end: `${month}-${String(end.getDate()).padStart(2, "0")}` };
};
export const currentMonth = () => {
  const parts = madridDatePartsFormatter.formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
};
export const localToday = () => {
  const parts = madridDatePartsFormatter.formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
};
export const dateLabel = (value: string) => dateLabelFormatter.format(new Date(`${value}T12:00:00`));
export const formatDate = (value: string) => shortDateFormatter.format(new Date(`${value}T12:00:00`));
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
