import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PageHeading({ title, description, backHref, backLabel = "Ajustes" }: { title?: string; description?: string; backHref?: string; backLabel?: string }) {
  return <div className="mb-5 md:mb-6">
    {backHref && <Link href={backHref} className="mb-3 hidden min-h-11 items-center gap-2 rounded-xl pr-3 text-sm font-medium text-[var(--muted)] no-underline hover:text-[var(--ink)] md:inline-flex"><ArrowLeft size={17}/>{backLabel}</Link>}
    {title && <h2 className="m-0 text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>}
    {description && <p className="muted mb-0 mt-1.5 max-w-2xl text-sm leading-6">{description}</p>}
  </div>;
}
