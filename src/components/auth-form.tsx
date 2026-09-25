"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight } from "lucide-react";
import { Button, Field } from "@/components/ui/primitives";

type AuthMode = "login" | "forgot" | "reset";
const copy = {
  login: { eyebrow: "QUÉ BIEN VERTE", title: "Hola de nuevo", body: "Entra y pon tus cuentas en orden.", button: "Iniciar sesión" },
  forgot: { eyebrow: "RECUPERA EL ACCESO", title: "¿Olvidaste tu contraseña?", body: "Te enviaremos un enlace para crear una nueva.", button: "Enviar enlace" },
  reset: { eyebrow: "UN PASO MÁS", title: "Crea una contraseña nueva", body: "Elige una contraseña segura para tu cuenta.", button: "Guardar contraseña" },
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const params = useSearchParams();
  const content = copy[mode];

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(""); setError("");
    startTransition(async () => {
      const supabase = createClient();
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) { setError("No se ha podido iniciar sesión. Comprueba tu correo y contraseña."); return; }
        router.push(params.get("next") || "/dashboard"); router.refresh();
      } else if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password` });
        if (authError) { setError(authError.message); return; }
        setMessage("Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña.");
      } else {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) { setError(authError.message); return; }
        setMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
        router.push("/dashboard"); router.refresh();
      }
    });
  };

  return <main className="grid min-h-screen bg-[var(--paper)] md:grid-cols-[1.02fr_.98fr]">
    <section className="relative hidden overflow-hidden bg-[#16213a] p-12 text-white md:flex md:flex-col md:justify-between lg:p-16">
      <Link href="/login" className="flex w-fit items-center gap-3 text-lg font-semibold text-white no-underline"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-2xl">€</span> Mis Gastos</Link>
      <div className="relative z-10 max-w-[490px]"><p className="mb-4 text-xs font-semibold tracking-[.16em] text-[#8ed5bd]">MENOS RUIDO. MÁS CLARIDAD.</p><h2 className="m-0 text-5xl font-semibold leading-[1.1] tracking-[-.05em]">Cada pequeño apunte te acerca a tus planes.</h2><p className="mt-5 max-w-[390px] text-base leading-7 text-white/65">Una vista amable de lo que entra, lo que sale y lo que estás guardando.</p>
        <div className="mt-10 max-w-[390px] rounded-[22px] border border-white/10 bg-white/[.06] p-5"><div className="mb-4 flex justify-between text-sm text-white/70"><span>Septiembre</span><span>Tu mes, a tu ritmo</span></div><div className="flex h-3 overflow-hidden rounded-full bg-white/10"><span className="w-[34%] bg-[#7187c9]"/><span className="w-[22%] bg-[#df8559]"/><span className="w-[13%] bg-[#cb7ca2]"/><span className="w-[31%] bg-[#d0b253]"/></div><div className="mt-4 flex justify-between text-xs text-white/55"><span>Gastos</span><span>Ahorro</span></div></div>
      </div>
      <p className="m-0 text-xs text-white/40">Privado por diseño. Tus finanzas son tuyas.</p>
      <div className="pointer-events-none absolute -right-24 -top-28 h-[400px] w-[400px] rounded-full border border-white/[.06]"/><div className="pointer-events-none absolute -right-5 -top-8 h-[270px] w-[270px] rounded-full border border-white/[.08]"/>
    </section>
    <section className="flex min-h-screen flex-col px-6 py-7 sm:px-12 md:justify-center lg:px-20">
      <Link href="/login" className="flex w-fit items-center gap-2 text-sm font-semibold text-[var(--muted)] no-underline md:hidden">€ Mis Gastos</Link>
      <div className="mx-auto w-full max-w-[400px] pt-14 md:pt-0"><p className="mb-3 text-[11px] font-semibold tracking-[.15em] text-[var(--brass)]">{content.eyebrow}</p><h1 className="m-0 text-[34px] font-semibold tracking-[-.05em] sm:text-[40px]">{content.title}</h1><p className="muted mb-8 mt-3 text-sm leading-6">{content.body}</p>
        <form onSubmit={submit} className="space-y-4">
          <div><label htmlFor="email" className="field-label">Correo electrónico</label><Field id="email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" className="!min-h-12 px-4" /></div>
          {mode !== "forgot" && <div><div className="mb-2 flex justify-between gap-2"><label htmlFor="password" className="text-sm font-medium">Contraseña</label>{mode === "login" && <Link href="/forgot-password" className="text-xs font-medium text-[var(--muted)]">¿La olvidaste?</Link>}</div><Field id="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Al menos 8 caracteres" className="!min-h-12 px-4" /></div>}
          {error && <p className="m-0 text-sm text-[var(--expense)]" role="alert">{error}</p>}{message && <p className="m-0 rounded-xl bg-[#1f9d7417] p-3 text-sm text-[var(--income)]" role="status">{message}</p>}
          <Button disabled={pending} className="min-h-12 w-full">{pending ? "Un momento…" : content.button}{!pending && <ArrowRight size={16}/>}</Button>
        </form>
        {mode !== "login" && <p className="muted mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-[var(--ink)]">Volver a iniciar sesión</Link></p>}
      </div>
    </section>
  </main>;
}
