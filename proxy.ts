// proxy.ts — Next 16's name for middleware (the `middleware` file convention
// is deprecated). Runs on the Node.js runtime before every page request.
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register"];
const ADMIN_ROUTES = ["/admin"];

// "/admin" and "/admin/…" — but not "/administrator".
const matches = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

export default auth(function proxy(req) {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => matches(nextUrl.pathname, route));
  const isAdminRoute = ADMIN_ROUTES.some((route) => matches(nextUrl.pathname, route));

  // Redirect unauthenticated users to login, remembering where they were going
  if (!isLoggedIn && !isPublicRoute) {
    const redirectUrl = new URL("/login", nextUrl.origin);
    if (nextUrl.pathname !== "/") {
      redirectUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // Block non-admins from admin routes
  if (isAdminRoute && session?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Exclude API routes, Next internals, and any static file in /public (identified by
  // a file extension) — without this, requests like /logo.png get caught by the
  // unauthenticated-user redirect above and never actually serve the asset.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
