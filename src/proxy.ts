import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { themeBootstrap } from "@/lib/theme-bootstrap";

const themeHash = createHash("sha256").update(themeBootstrap).digest("base64");
const isDevelopment = process.env.NODE_ENV === "development";

function getContentSecurityPolicy(nonce: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "https://*.supabase.co";
  const supabaseWebSocketOrigin = supabaseOrigin.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
  const devWebSocketOrigins = isDevelopment ? " ws://localhost:3000 wss://localhost:3000" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'sha256-${themeHash}'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigin} ${supabaseWebSocketOrigin} https://vitals.vercel-insights.com${devWebSocketOrigins}`,
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64");
  const csp = getContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  const refreshedCookies = new Map<string, { name: string; value: string; options: Parameters<typeof response.cookies.set>[2] }>();
  const authHeaders = new Map<string, string>();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        requestHeaders.set("cookie", request.cookies.toString());
        cookiesToSet.forEach((cookie) => refreshedCookies.set(cookie.name, cookie));
        Object.entries(headers).forEach(([name, value]) => authHeaders.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        response.headers.set("Content-Security-Policy", csp);
        refreshedCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        authHeaders.forEach((value, name) => response.headers.set(name, value));
      },
    } },
  );
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const path = request.nextUrl.pathname;
  const redirectWithSession = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    redirect.headers.set("Content-Security-Policy", csp);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    for (const header of ["Cache-Control", "Expires", "Pragma"]) {
      const value = response.headers.get(header);
      if (value) redirect.headers.set(header, value);
    }
    return redirect;
  };
  if (!user && ["/dashboard", "/transactions", "/stats", "/settings"].some((route) => path === route || path.startsWith(`${route}/`))) {
    const url = request.nextUrl.clone(); url.pathname = "/login"; url.searchParams.set("next", `${path}${request.nextUrl.search}`); return redirectWithSession(url);
  }
  if (user && path === "/login") { const url = request.nextUrl.clone(); url.pathname = "/dashboard"; url.search = ""; return redirectWithSession(url); }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|icons/|apple-icon|sw.js|offline.html|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
