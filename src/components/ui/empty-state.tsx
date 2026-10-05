import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

export function EmptyState({ icon, title, description, className }: { icon: ReactNode; title: string; description: string; className?: string }) {
  return <div className={cx("flex min-h-32 flex-1 flex-col items-center justify-center text-center", className)}>
    <span className="mb-2 rounded-xl bg-[var(--soft-blue)] p-3">{icon}</span>
    <p className="m-0 text-sm font-medium">{title}</p>
    <p className="muted mt-1 text-xs">{description}</p>
  </div>;
}
