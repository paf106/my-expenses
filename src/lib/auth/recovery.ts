const ALLOWED_RECOVERY_PATHS = new Set(["/reset-password"]);

export function getSafeRecoveryPath(next: string | null) {
  return next && ALLOWED_RECOVERY_PATHS.has(next) ? next : "/reset-password";
}
