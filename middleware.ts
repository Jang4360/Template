import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_ROUTES = ["/dashboard", "/payment"];

export async function middleware(req: NextRequest) {
  const { response } = await updateSession(req);
  const pathname = req.nextUrl.pathname;

  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const hasSession = req.cookies.get("sb-access-token") || req.cookies.get("supabase-auth-token");
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/payment/:path*"]
};
