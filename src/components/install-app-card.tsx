"use client";

import { useSyncExternalStore } from "react";
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
  const platform = useSyncExternalStore(() => () => undefined, getInstallPlatform, () => "other");
  const isIos = platform !== "other";
  const isSafari = platform === "ios-safari";

  if (installed) return null;

  return <Card className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-3">
      <span className="rounded-xl bg-[var(--soft-blue)] p-3 text-[var(--focus)]"><Smartphone size={20}/></span>
      <div><h2 className="m-0 text-sm font-semibold">Instala Mis Gastos</h2><p className="muted mb-0 mt-1 max-w-md text-sm">Abre tus finanzas desde la pantalla de inicio, como una app.</p>
        {isSafari && <p className="muted mb-0 mt-2 text-xs">En Safari: toca Compartir y elige «Añadir a pantalla de inicio».</p>}
        {isIos && !isSafari && <p className="muted mb-0 mt-2 text-xs">Para instalarla, abre esta página en Safari, toca Compartir y elige «Añadir a pantalla de inicio».</p>}
        {!isIos && !installAvailable && <p className="muted mb-0 mt-2 text-xs">Si no aparece el botón, busca «Instalar app» en el menú del navegador.</p>}
      </div>
    </div>
    {!isIos && installAvailable && <Button onClick={() => void install()} className="shrink-0"><Download size={16}/> Instalar app</Button>}
  </Card>;
}
