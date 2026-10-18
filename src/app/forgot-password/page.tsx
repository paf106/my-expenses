import { AuthForm } from "@/components/auth-form";
import { normalizeAuthQuery, type AuthQueryInput } from "@/lib/auth/query";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Recuperar contraseña" };
export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<AuthQueryInput> }) { return <AuthForm mode="forgot" query={normalizeAuthQuery(await searchParams)} />; }
