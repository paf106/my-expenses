import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cx } from "@/lib/utils";

export function Button({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" | "danger" }) {
  const variants = {
    primary: "button-primary",
    secondary: "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--soft-blue)]",
    quiet: "text-[var(--muted)] hover:bg-[var(--soft-blue)] hover:text-[var(--ink)]",
    danger: "text-[var(--expense)] hover:bg-[var(--danger-soft)]",
  };
  return <button {...props} className={cx("inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55", variants[variant], className)} />;
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={cx("icon-button text-[var(--muted)] hover:bg-[var(--soft-blue)] hover:text-[var(--ink)]", className)} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={cx("card p-5 md:p-6", className)} />;
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-4 flex min-h-10 items-start justify-between gap-3"><div className="min-w-0"><h2 className="m-0 text-base font-semibold tracking-tight">{title}</h2>{description && <p className="muted mb-0 mt-1 text-sm">{description}</p>}</div>{action && <div className="shrink-0">{action}</div>}</div>;
}

export function Field({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx("control", className)} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx("control", className)} />;
}
