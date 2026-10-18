import { AuthForm } from "@/components/auth-form";
import { normalizeAuthQuery, type AuthQueryInput } from "@/lib/auth/query";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Cambiar contraseña" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<AuthQueryInput> }) { return <AuthForm mode="reset" query={normalizeAuthQuery(await searchParams)} />; }
