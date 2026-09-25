import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Mis Gastos", short_name: "Mis Gastos", description: "Control sencillo de tus finanzas personales", start_url: "/dashboard", display: "standalone", background_color: "#f3f5f8", theme_color: "#f3f5f8", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }] };
}
