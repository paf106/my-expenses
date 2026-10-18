"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { document.title = "Error · Mis Gastos"; }, []);
  return <html lang="es"><body className="min-h-dvh bg-[#f3f5f8] p-6 font-sans text-[#16213a]"><main className="mx-auto flex min-h-[70dvh] max-w-lg flex-col items-center justify-center text-center"><h1 className="text-2xl font-semibold">No se pudo cargar la aplicación</h1><p className="mt-2 text-sm">Prueba de nuevo. Si el problema continúa, vuelve a iniciar sesión más tarde.</p><button className="mt-5 min-h-11 rounded-xl bg-[#16213a] px-5 font-semibold text-white" onClick={() => retry()}>Volver a intentar</button></main></body></html>;
}
