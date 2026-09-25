import Link from "next/link";
import { ArrowRight, Repeat2, Tags, UserRound } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import packageJson from "../../../../package.json";
export default function SettingsPage() {
  const items = [
    { href: "/settings/categories", title: "Categorías y presupuestos", detail: "Organiza tus gastos y define límites", icon: Tags },
    { href: "/settings/recurring", title: "Movimientos recurrentes", detail: "Alquiler, suscripciones y otros", icon: Repeat2 },
    { href: "/settings/account", title: "Cuenta y apariencia", detail: "Correo, tema y privacidad", icon: UserRound },
  ];
  return <div className="max-w-3xl"><PageHeading description="Personaliza categorías, movimientos y tu cuenta."/>{items.map(({ href, title, detail, icon: Icon }) => <Link key={href} href={href} className="card mb-3 flex min-h-[76px] items-center gap-4 p-4 no-underline transition-colors hover:border-[var(--focus)] sm:p-5"><span className="rounded-xl bg-[var(--soft-blue)] p-3"><Icon size={20}/></span><span className="flex-1"><strong className="block text-sm">{title}</strong><small className="muted mt-1 block text-xs sm:text-sm">{detail}</small></span><ArrowRight className="muted" size={18}/></Link>)}<footer className="muted mt-8 border-t border-[var(--line)] pt-4 text-center text-xs">Versión {packageJson.version}</footer></div>;
}
