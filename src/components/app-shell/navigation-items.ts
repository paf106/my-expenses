import { ChartNoAxesColumn, House, Settings, WalletCards } from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Inicio", icon: House },
  { href: "/transactions", label: "Movimientos", mobileLabel: "Lista", icon: WalletCards },
  { href: "/stats", label: "Estadísticas", mobileLabel: "Informes", icon: ChartNoAxesColumn },
  { href: "/settings", label: "Ajustes", icon: Settings },
];
