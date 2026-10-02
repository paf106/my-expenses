import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mis Gastos",
    short_name: "Mis Gastos",
    description: "Control sencillo de tus finanzas personales",
    lang: "es",
    categories: ["finance"],
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f3f5f8",
    theme_color: "#f3f5f8",
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Añadir gasto", short_name: "Gasto", url: "/dashboard?add=expense", icons: [{ src: "/icons/icon-192", sizes: "192x192", type: "image/png" }] },
      { name: "Añadir ingreso", short_name: "Ingreso", url: "/dashboard?add=income", icons: [{ src: "/icons/icon-192", sizes: "192x192", type: "image/png" }] },
      { name: "Movimientos", short_name: "Movimientos", url: "/transactions", icons: [{ src: "/icons/icon-192", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
