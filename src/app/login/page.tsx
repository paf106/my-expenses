import { AuthForm } from "@/components/auth-form";
import { normalizeAuthQuery, type AuthQueryInput } from "@/lib/auth/query";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Iniciar sesión" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<AuthQueryInput> }) { return <AuthForm mode="login" query={normalizeAuthQuery(await searchParams)} />; }
