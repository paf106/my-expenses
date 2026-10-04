import { NextResponse, type NextRequest } from "next/server";
import { getSafeRecoveryPath } from "@/lib/auth/recovery";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const code = request.nextUrl.searchParams.get("code");
  const safeNext = getSafeRecoveryPath(request.nextUrl.searchParams.get("next"));
  if (tokenHash && type === "recovery") {
    const target = new URL(safeNext, request.url);
    target.searchParams.set("token_hash", tokenHash);
    target.searchParams.set("type", type);
    return NextResponse.redirect(target);
  }
  if (code) {
    const target = new URL("/reset-password", request.url);
    target.searchParams.set("code", code);
    return NextResponse.redirect(target);
  }
  return NextResponse.redirect(new URL("/forgot-password?error=link", request.url));
}
