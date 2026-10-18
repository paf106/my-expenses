import Link from "next/link";

export default function NotFound() {
  return <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center p-6 text-center"><h1 className="text-2xl font-semibold">No encontramos esa página</h1><p className="muted mt-2 text-sm">Puede que el enlace haya cambiado o ya no exista.</p><Link className="button-primary mt-5 inline-flex items-center px-5 no-underline" href="/dashboard">Ir al inicio</Link></main>;
}
