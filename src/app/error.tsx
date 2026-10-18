"use client";

export default function RootError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center p-6 text-center"><h1 className="text-2xl font-semibold">Algo ha fallado</h1><p className="muted mt-2 text-sm">No se han podido mostrar estos datos. Inténtalo de nuevo.</p><button className="button-primary mt-5 px-5" onClick={() => retry()}>Volver a intentar</button></main>;
}
