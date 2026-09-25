export const euro = (value: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2, useGrouping: "always" }).format(value);
export const monthLabel = (month: string) => new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));
export const monthBounds = (month: string) => {
  const start = new Date(`${month}-01T00:00:00`);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return { start: `${month}-01`, end: `${month}-${String(end.getDate()).padStart(2, "0")}` };
};
export const currentMonth = () => {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
};
export const localToday = () => {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
};
export const dateLabel = (value: string) => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00`));
export const formatDate = (value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) => new Intl.DateTimeFormat("es-ES", options).format(new Date(`${value}T12:00:00`));
export const pageGreeting = (hour = new Date().getHours()) => hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
export const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");
export const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-ES").trim();
