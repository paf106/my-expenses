"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSafeNextPath } from "@/lib/auth/recovery";
import { ArrowRight } from "lucide-react";
import { Button, Field } from "@/components/ui/primitives";

type AuthMode = "login" | "forgot" | "reset";
const copy = {
  login: { eyebrow: "QUÉ BIEN VERTE", title: "Hola de nuevo", body: "Entra y pon tus cuentas en orden.", button: "Iniciar sesión" },
  forgot: { eyebrow: "RECUPERA EL ACCESO", title: "¿Olvidaste tu contraseña?", body: "Te enviaremos un enlace para crear una nueva.", button: "Enviar enlace" },
  reset: { eyebrow: "UN PASO MÁS", title: "Crea una contraseña nueva", body: "Elige una contraseña segura para tu cuenta.", button: "Guardar contraseña" },
};

export function AuthForm({ mode, query }: { mode: AuthMode; query: Record<string, string> }) {
  const router = useRouter();
  const params = useMemo(() => new URLSearchParams(query), [query]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState(() => mode === "login" && params.get("password-updated") === "1" ? "Contraseña actualizada. Ya puedes iniciar sesión." : "");
  const [error, setError] = useState(() => {
    if (params.get("password-updated") === "1") return "";
    if (params.get("error") === "link") return "El enlace no es válido o ha caducado. Solicita uno nuevo.";
    if (params.get("error")) return "No se pudo completar la operación. Inténtalo de nuevo o solicita otro enlace.";
    if (mode === "reset" && ((!params.get("token_hash") && !params.get("code")) || (params.get("token_hash") && params.get("type") !== "recovery"))) return "Abre el enlace de recuperación más reciente para cambiar tu contraseña.";
    return "";
  });
  const [errorField, setErrorField] = useState<"email" | "password" | "password-confirmation" | null>(null);
  const [recoveryToken] = useState(() => params.get("token_hash") || "");
  const [recoveryType] = useState(() => params.get("type") || "");
  const recoveryVerified = useRef(false);
  const [recoveryReady, setRecoveryReady] = useState(mode !== "reset" || Boolean(params.get("token_hash")) && params.get("type") === "recovery");
  const [pending, startTransition] = useTransition();
  const content = copy[mode];
  const passwordDescription = [mode === "reset" ? "password-requirement" : null, errorField === "password" ? "auth-error" : null].filter(Boolean).join(" ");

  useEffect(() => {
    if (mode === "login" && params.get("password-updated")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("password-updated");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
    }
  }, [mode, params]);

  useEffect(() => {
    if (mode !== "reset") return;
    if (recoveryToken) {
      if (recoveryType !== "recovery") return;
      const cleanUrl = new URL(window.location.href);
      if (cleanUrl.searchParams.has("token_hash") || cleanUrl.searchParams.has("type")) {
        cleanUrl.searchParams.delete("token_hash");
        cleanUrl.searchParams.delete("type");
        window.history.replaceState(window.history.state, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
      }
      return;
    }
    const code = params.get("code");
    if (!code) return;

    const supabase = createClient();
    let recoveryEventReceived = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "PASSWORD_RECOVERY" || !session) return;
      recoveryEventReceived = true;
      setRecoveryReady(true);
      setError("");
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("code");
      window.history.replaceState(window.history.state, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    });
    // Supabase automatically exchanges PKCE codes while initializing the browser client.
    // getSession waits for that initialization; exchanging the code again would fail because it is one-time use.
    let recoveryCheckTimer: number | undefined;
    void supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (!session || sessionError) {
        setError("El enlace no es válido o ha caducado. Solicita uno nuevo; si es un enlace antiguo, ábrelo en el mismo navegador donde lo pediste.");
        return;
      }
      recoveryCheckTimer = window.setTimeout(() => {
        if (!recoveryEventReceived) setError("No se pudo confirmar la recuperación. Solicita otro enlace y ábrelo desde el mismo navegador.");
      }, 100);
    });
    return () => {
      subscription.unsubscribe();
      if (recoveryCheckTimer) window.clearTimeout(recoveryCheckTimer);
    };
  }, [mode, params, recoveryToken, recoveryType]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(""); setError(""); setErrorField(null);
    startTransition(async () => {
      const supabase = createClient();
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) { setError("No se ha podido iniciar sesión. Comprueba tu correo y contraseña."); return; }
        router.push(getSafeNextPath(params.get("next"))); router.refresh();
      } else if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (authError) {
          setErrorField("email");
          setError(authError.message.toLowerCase().includes("rate limit") || authError.message.toLowerCase().includes("too many")
            ? "Se han solicitado demasiados enlaces. Espera un poco antes de volver a intentarlo."
            : "No se pudo enviar el enlace. Comprueba la configuración del correo e inténtalo de nuevo.");
          return;
        }
        setMessage("Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña.");
      } else {
        if (password !== passwordConfirmation) { setError("Las contraseñas no coinciden."); setErrorField("password-confirmation"); document.getElementById("password-confirmation")?.focus(); return; }
        if (!recoveryReady) { setError("El enlace no es válido o ha caducado. Solicita uno nuevo."); return; }
        if (recoveryToken && recoveryType === "recovery" && !recoveryVerified.current) {
          const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: recoveryToken, type: "recovery" });
          if (verifyError) { setError("El enlace no es válido o ha caducado. Solicita uno nuevo."); setRecoveryReady(false); return; }
          recoveryVerified.current = true;
        }
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) {
          setErrorField("password");
          setError(authError.message.toLowerCase().includes("same")
            ? "La nueva contraseña debe ser distinta de la anterior."
            : "No se pudo actualizar la contraseña. Comprueba que tenga al menos 10 caracteres e inténtalo de nuevo.");
          return;
        }
        setMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
        await supabase.auth.signOut();
        router.push("/login?password-updated=1"); router.refresh();
      }
    });
  };

  return <main className="grid min-h-dvh bg-[var(--paper)] md:grid-cols-[1.02fr_.98fr]">
    <section className="relative hidden overflow-hidden bg-[#16213a] p-12 text-white md:flex md:flex-col md:justify-between lg:p-16">
      <Link href="/login" className="flex w-fit items-center gap-3 text-lg font-semibold text-white no-underline"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-2xl">€</span> Mis Gastos</Link>
      <div className="relative z-10 max-w-[490px]"><p className="mb-4 text-xs font-semibold tracking-[.16em] text-[#8ed5bd]">MENOS RUIDO. MÁS CLARIDAD.</p><p className="m-0 text-5xl font-semibold leading-[1.1] tracking-[-.05em]">Cada pequeño apunte te acerca a tus planes.</p><p className="mt-5 max-w-[390px] text-base leading-7 text-white/65">Una vista amable de lo que entra, lo que sale y lo que estás guardando.</p>
        <div className="mt-10 max-w-[390px] rounded-[22px] border border-white/10 bg-white/[.06] p-5"><div className="mb-4 flex justify-between text-sm text-white/70"><span>Gastos del periodo</span><span>Tu mes, a tu ritmo</span></div><div className="flex h-3 overflow-hidden rounded-full bg-white/10"><span className="w-[34%] bg-[#7187c9]"/><span className="w-[22%] bg-[#df8559]"/><span className="w-[13%] bg-[#cb7ca2]"/><span className="w-[31%] bg-[#d0b253]"/></div><div className="mt-4 flex justify-between text-xs text-white/70"><span>Gastos</span><span>Ahorro</span></div></div>
      </div>
      <p className="m-0 text-xs text-white/70">Privado por diseño. Tus finanzas son tuyas.</p>
      <div className="pointer-events-none absolute -right-24 -top-28 h-[400px] w-[400px] rounded-full border border-white/[.06]"/><div className="pointer-events-none absolute -right-5 -top-8 h-[270px] w-[270px] rounded-full border border-white/[.08]"/>
    </section>
    <section className="flex min-h-dvh flex-col pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] py-7 sm:px-12 md:justify-center lg:px-20">
      <Link href="/login" className="flex w-fit items-center gap-2 text-sm font-semibold text-[var(--muted)] no-underline md:hidden">€ Mis Gastos</Link>
      <div className="mx-auto w-full max-w-[400px] pt-14 md:pt-0"><p className="mb-3 text-[11px] font-semibold tracking-[.15em] text-[var(--brass)]">{content.eyebrow}</p><h1 className="m-0 text-[34px] font-semibold tracking-[-.05em] sm:text-[40px]">{content.title}</h1><p className="muted mb-8 mt-3 text-sm leading-6">{content.body}</p>
        <form onSubmit={submit} className="space-y-4">
          {mode !== "reset" && <div><label htmlFor="email" className="field-label">Correo electrónico</label><Field id="email" name="email" required type="email" spellCheck={false} autoComplete="email" value={email} aria-invalid={errorField === "email" || undefined} aria-describedby={errorField === "email" ? "auth-error" : undefined} onChange={(event) => { setEmail(event.target.value); setErrorField(null); }} placeholder="tu@correo.com" className="!min-h-12 px-4" /></div>}
          {mode !== "forgot" && <div><div className="mb-2 flex justify-between gap-2"><label htmlFor="password" className="field-label mb-0">Contraseña</label>{mode === "login" && <Link href="/forgot-password" className="text-xs font-medium text-[var(--muted)]">¿La olvidaste?</Link>}</div><Field id="password" name="password" required minLength={mode === "reset" ? 10 : 8} autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" value={password} aria-invalid={errorField === "password" || undefined} aria-describedby={passwordDescription || undefined} onChange={(event) => { setPassword(event.target.value); setErrorField(null); }} placeholder={mode === "login" ? "Contraseña" : "Al menos 10 caracteres"} className="!min-h-12 px-4" />{mode === "reset" && <p id="password-requirement" className="muted mb-0 mt-2 text-xs">Usa al menos 10 caracteres.</p>}</div>}
          {mode === "reset" && <div><label htmlFor="password-confirmation" className="field-label">Repite la contraseña</label><Field id="password-confirmation" name="password-confirmation" required minLength={10} autoComplete="new-password" type="password" value={passwordConfirmation} aria-invalid={errorField === "password-confirmation" || undefined} aria-describedby={errorField === "password-confirmation" ? "auth-error" : undefined} onChange={(event) => { setPasswordConfirmation(event.target.value); setErrorField(null); }} placeholder="Escríbela otra vez" className="!min-h-12 px-4" /></div>}
          {error && <p id="auth-error" className="m-0 text-sm text-[var(--expense)]" role="alert">{error}</p>}{message && <p className="m-0 rounded-xl bg-[color-mix(in_srgb,var(--income)_10%,transparent)] p-3 text-sm text-[var(--income)]" role="status">{message}</p>}
          {mode === "reset" && !recoveryReady && <p className="m-0 text-sm"><Link className="font-semibold text-[var(--ink)]" href="/forgot-password">Solicitar otro enlace</Link></p>}
          <Button disabled={pending || (mode === "reset" && !recoveryReady)} className="min-h-12 w-full">{pending ? "Un momento…" : content.button}{!pending && <ArrowRight size={16}/>}</Button>
        </form>
        {mode !== "login" && <p className="muted mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-[var(--ink)]">Volver a iniciar sesión</Link></p>}
      </div>
    </section>
  </main>;
}
