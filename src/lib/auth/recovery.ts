const ALLOWED_RECOVERY_PATHS = new Set(["/reset-password"]);
const ALLOWED_APP_PATHS = ["/dashboard", "/transactions", "/stats", "/settings"] as const;

export function getSafeRecoveryPath(next: string | null) {
  return next && ALLOWED_RECOVERY_PATHS.has(next) ? next : "/reset-password";
}

export function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/dashboard";
  try {
    const target = new URL(next, "https://mis-gastos.invalid");
    if (target.origin !== "https://mis-gastos.invalid") return "/dashboard";
    const allowed = ALLOWED_APP_PATHS.some((path) => target.pathname === path || target.pathname.startsWith(`${path}/`));
    return allowed ? `${target.pathname}${target.search}${target.hash}` : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
