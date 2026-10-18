const STORAGE_KEY = "my-expenses-recent-categories-v1";
const CHANGE_EVENT = "my-expenses:recent-categories";
const MAX_RECENT_CATEGORIES = 3;

export function normalizeRecentCategoryIds(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))].slice(0, MAX_RECENT_CATEGORIES);
}

export function moveRecentCategoryToFront(ids: string[], categoryId: string) {
  return [categoryId, ...ids.filter((id) => id !== categoryId)].slice(0, MAX_RECENT_CATEGORIES);
}

export function getRecentCategorySnapshot() {
  if (typeof window === "undefined") return "[]";
  try {
    return JSON.stringify(normalizeRecentCategoryIds(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]")));
  } catch {
    return "[]";
  }
}

export function subscribeRecentCategories(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function rememberRecentCategory(categoryId: string) {
  if (typeof window === "undefined") return;
  const ids = normalizeRecentCategoryIds(JSON.parse(getRecentCategorySnapshot()));
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(moveRecentCategoryToFront(ids, categoryId)));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch { /* Recent suggestions are optional when browser storage is unavailable. */ }
}
