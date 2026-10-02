import { CardHeader } from "@/components/ui/primitives";

function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton-shimmer rounded-xl ${className}`} />;
}

function LoadingRegion({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div aria-label="Cargando página" aria-busy="true" className={className}>{children}</div>;
}

export function DashboardSkeleton() {
  return <LoadingRegion className="motion-enter"><div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2 xl:gap-6">
    <section className="card flex flex-col overflow-hidden p-5 md:p-6"><div className="mb-6 space-y-2"><Skeleton className="h-4 w-40"/><Skeleton className="h-11 w-56"/></div><Skeleton className="mb-3 h-4 w-full rounded-full"/><div className="mb-6 flex justify-between"><Skeleton className="h-4 w-36"/><Skeleton className="h-4 w-24"/></div><div className="mt-auto grid grid-cols-2 gap-3 pt-6">{[0, 1].map((item) => <div key={item} className="soft-card space-y-3 p-4"><Skeleton className="h-8 w-8"/><Skeleton className="h-4 w-16"/><Skeleton className="h-6 w-28"/></div>)}</div></section>
    <section className="card flex h-full flex-col p-5 md:p-6"><div className="mb-4 flex justify-between"><div className="space-y-2"><Skeleton className="h-5 w-28"/><Skeleton className="h-4 w-36"/></div><Skeleton className="h-10 w-20"/></div><div className="grid flex-1 grid-cols-[minmax(120px,1fr)_minmax(100px,.9fr)] items-center gap-4"><Skeleton className="mx-auto aspect-square w-full max-w-[210px] rounded-full"/><div className="space-y-4">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-4 w-full"/>)}</div></div></section>
    <section className="card space-y-5 p-5 md:p-6"><div className="space-y-2"><Skeleton className="h-5 w-28"/><Skeleton className="h-4 w-40"/></div>{[0, 1, 2].map((item) => <div key={item} className="space-y-2"><Skeleton className="h-4 w-full"/><Skeleton className="h-2 w-full rounded-full"/></div>)}</section>
    <section className="card space-y-4 p-5 md:p-6"><div className="space-y-2"><Skeleton className="h-5 w-36"/><Skeleton className="h-4 w-44"/></div>{[0, 1, 2, 3].map((item) => <div key={item} className="flex items-center gap-3 border-b border-[var(--line)] py-3"><Skeleton className="h-10 w-10 shrink-0"/><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4"/><Skeleton className="h-3 w-1/2"/></div><Skeleton className="h-4 w-20"/></div>)}</section>
  </div></LoadingRegion>;
}

export function TransactionsSkeleton() {
  return <LoadingRegion className="motion-enter"><div className="space-y-5">
    <div className="flex gap-2"><Skeleton className="h-11 flex-1"/><Skeleton className="h-11 w-11 shrink-0"/></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(180px,1.4fr)_minmax(150px,1fr)_auto]"><Skeleton className="col-span-2 h-11 sm:col-span-1 sm:col-start-1"/><Skeleton className="h-11 sm:col-start-3 sm:row-start-1"/><Skeleton className="hidden h-11 sm:col-start-2 sm:row-start-1 sm:block"/></div>
    <div className="flex items-center gap-2 sm:hidden"><Skeleton className="h-10 w-[208px] shrink-0 rounded-full"/><Skeleton className="h-11 min-w-0 flex-1"/></div>
    <div className="hidden sm:block"><Skeleton className="h-10 w-52 rounded-full"/></div>
    {[0, 1].map((day) => <section key={day} className="card overflow-hidden"><div className="flex justify-between border-b border-[var(--line)] px-4 py-3"><Skeleton className="h-4 w-32"/><Skeleton className="h-4 w-20"/></div>{[0, 1, 2].map((item) => <div key={item} className="flex items-center gap-4 border-b border-[var(--line)] px-4 py-3"><Skeleton className="h-10 w-10 shrink-0"/><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3"/><Skeleton className="h-3 w-1/3"/></div><Skeleton className="h-4 w-20"/><Skeleton className="h-10 w-10"/></div>)}</section>)}
  </div></LoadingRegion>;
}

export function StatsSkeleton() {
  return <LoadingRegion className="motion-enter"><div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2 xl:gap-6">
    <section className="grid grid-cols-3 gap-2 lg:col-span-2 sm:gap-3">{[0, 1, 2].map((item) => <div key={item} className="card space-y-3 p-2.5 sm:p-4 md:p-5"><Skeleton className="h-8 w-8"/><Skeleton className="h-3 w-12"/><Skeleton className="h-5 w-full"/></div>)}</section>
    <section className="card h-full p-5 md:p-6"><CardHeader title="Ingresos y gastos" description="Evolución de los últimos meses"/><Skeleton className="h-[260px] w-full rounded-2xl"/></section>
    <section className="card h-full p-5 md:p-6"><CardHeader title="Gastos por categoría" description="Distribución de este mes"/><div className="flex flex-col items-center"><Skeleton className="mx-auto aspect-square w-full max-w-[230px] rounded-full"/><div className="w-full space-y-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-4 w-full" />)}</div></div></section>
  </div></LoadingRegion>;
}

export function SettingsSkeleton() {
  return <LoadingRegion className="motion-enter"><div className="max-w-3xl"><Skeleton className="mb-2 h-5 w-48"/><Skeleton className="mb-6 h-4 w-72"/>{[0, 1, 2].map((item) => <div key={item} className="card mb-3 flex min-h-[76px] items-center gap-4 p-4 sm:p-5"><Skeleton className="h-11 w-11"/><div className="flex-1 space-y-2"><Skeleton className="h-4 w-48"/><Skeleton className="h-3 w-64"/></div><Skeleton className="h-5 w-5"/></div>)}</div></LoadingRegion>;
}

export function SettingsSubpageSkeleton({ kind }: { kind: "categories" | "recurring" | "account" }) {
  if (kind === "categories") return <CategoriesSkeleton />;
  if (kind === "recurring") return <RecurringSkeleton />;
  return <AccountSkeleton />;
}

export function CategoriesSkeleton() {
  return <LoadingRegion className="motion-enter"><div className="max-w-4xl space-y-4"><Skeleton className="mb-2 h-5 w-48"/><Skeleton className="mb-5 h-4 w-72"/>{[0, 1].map((section) => <section key={section} className="space-y-2 md:card md:space-y-3 md:p-6"><div className="flex justify-between px-1 md:px-0"><Skeleton className="h-5 w-24"/><Skeleton className="h-10 w-28"/></div>{[0, 1, 2, 3].map((item) => <div key={item} className="card flex min-h-[68px] items-center gap-3 p-3 md:border-0 md:p-0"><Skeleton className="h-10 w-10 shrink-0"/><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3"/><Skeleton className="h-3 w-1/3"/></div><Skeleton className="h-5 w-5"/></div>)}</section>)}</div></LoadingRegion>;
}

export function RecurringSkeleton() {
  return <LoadingRegion className="motion-enter"><div className="max-w-5xl"><Skeleton className="mb-2 h-5 w-48"/><Skeleton className="mb-5 h-4 w-72"/><div className="grid gap-4 md:gap-6 xl:grid-cols-2"><section className="card h-fit space-y-4 p-5 md:p-6"><Skeleton className="h-5 w-40"/><Skeleton className="h-4 w-64"/><Skeleton className="h-10 w-full"/>{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-11 w-full"/>)}<Skeleton className="h-11 w-full"/></section><section className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="card grid min-h-[146px] grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 p-4"><Skeleton className="h-10 w-10 shrink-0"/><div className="space-y-2"><Skeleton className="h-4 w-36"/><Skeleton className="h-3 w-28"/><Skeleton className="h-3 w-24"/></div><Skeleton className="h-5 w-20"/><Skeleton className="col-start-2 h-10 w-20"/></div>)}</section></div></div></LoadingRegion>;
}

export function AccountSkeleton() {
  return <LoadingRegion className="motion-enter"><div className="max-w-2xl space-y-4"><Skeleton className="mb-2 h-5 w-48"/><Skeleton className="mb-5 h-4 w-72"/><section className="card space-y-4 p-5 md:p-6"><Skeleton className="h-5 w-32"/><Skeleton className="h-4 w-48"/><div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-16"/>)}</div></section><section className="card space-y-4 p-5 md:p-6"><Skeleton className="h-5 w-32"/><Skeleton className="h-4 w-60"/><Skeleton className="h-11 w-full"/></section><section className="card flex justify-between p-5"><Skeleton className="h-10 w-36"/><Skeleton className="h-10 w-20"/></section><Skeleton className="h-11 w-40"/></div></LoadingRegion>;
}
