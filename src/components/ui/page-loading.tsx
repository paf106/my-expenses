export function PageLoading() {
  return <div aria-label="Cargando página" aria-busy="true" className="space-y-4">
    <div className="h-8 w-48 animate-pulse rounded-xl bg-[var(--soft-blue)]" />
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-48 animate-pulse rounded-2xl bg-[var(--soft-blue)]" />
      <div className="h-48 animate-pulse rounded-2xl bg-[var(--soft-blue)]" />
      <div className="h-64 animate-pulse rounded-2xl bg-[var(--soft-blue)] md:col-span-2" />
    </div>
  </div>;
}
