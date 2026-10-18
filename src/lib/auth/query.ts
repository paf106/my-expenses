export type AuthQueryInput = Record<string, string | string[] | undefined>;

export function normalizeAuthQuery(query: AuthQueryInput): Record<string, string> {
  return Object.fromEntries(Object.entries(query).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : []));
}
