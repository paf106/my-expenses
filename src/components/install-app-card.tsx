"use client";

import { useState, useSyncExternalStore } from "react";
import { Download, Smartphone } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import { usePwa } from "@/components/pwa-provider";

function getInstallPlatform() {
  const agent = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(agent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!ios) return "other";
  return /Safari/.test(agent) && !/CriOS|FxiOS|EdgiOS/.test(agent) ? "ios-safari" : "ios-other";
}

export function InstallAppCard() {
  const { installAvailable, installed, install } = usePwa();
  const [installing, setInstalling] = useState(false);
  const [message, setMessage] = useState("");
  const platform = useSyncExternalStore(() => () => undefined, getInstallPlatform, () => "other");
  const isIos = platform !== "other";
  const isSafari = platform === "ios-safari";

  const promptInstall = async () => {
    if (installing) return;
    setInstalling(true);
    setMessage("");
    try {
      const accepted = await install();
      if (!accepted) setMessage("No se instaló. Puedes volver a intentarlo o buscar «Instalar app» en el menú del navegador.");
    } catch {
      setMessage("El navegador no pudo abrir la instalación. Inténtalo desde su menú.");
    } finally {
      setInstalling(false);
    }
  };

  if (installed) return null;

  return <Card className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-3">
      <span className="rounded-xl bg-[var(--soft-blue)] p-3 text-[var(--focus)]"><Smartphone size={20}/></span>
      <div><h2 className="m-0 text-sm font-semibold">Instala Mis Gastos</h2><p className="muted mb-0 mt-1 max-w-md text-sm">Abre tus finanzas desde la pantalla de inicio, como una app.</p>
        {isSafari && <p className="muted mb-0 mt-2 text-xs">En Safari: toca Compartir y elige «Añadir a pantalla de inicio».</p>}
        {isIos && !isSafari && <p className="muted mb-0 mt-2 text-xs">Para instalarla, abre esta página en Safari, toca Compartir y elige «Añadir a pantalla de inicio».</p>}
        {!isIos && !installAvailable && <p className="muted mb-0 mt-2 text-xs">Si no aparece el botón, busca «Instalar app» en el menú del navegador.</p>}
        {message && <p className="mb-0 mt-2 text-xs text-[var(--expense)]" role="status">{message}</p>}
      </div>
    </div>
    {!isIos && installAvailable && <Button disabled={installing} onClick={() => void promptInstall()} className="shrink-0"><Download size={16}/>{installing ? "Abriendo…" : "Instalar app"}</Button>}
  </Card>;
}
