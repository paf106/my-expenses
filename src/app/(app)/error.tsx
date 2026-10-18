"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/primitives";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="card mx-auto flex min-h-60 max-w-xl flex-col items-center justify-center p-6 text-center">
    <h2 className="m-0 text-lg font-semibold">No se ha podido cargar esta página</h2>
    <p className="muted mt-2 text-sm">Comprueba tu conexión e inténtalo de nuevo.</p>
    <Button type="button" onClick={retry} className="mt-4">Reintentar</Button>
  </div>;
}
