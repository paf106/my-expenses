import { ChartNoAxesColumn, House, Settings, WalletCards } from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Inicio", icon: House },
  { href: "/transactions", label: "Movimientos", icon: WalletCards },
  { href: "/stats", label: "Estadísticas", icon: ChartNoAxesColumn },
  { href: "/settings", label: "Ajustes", icon: Settings },
];
