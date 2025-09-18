// src/middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const loggedIn = req.cookies.get("logged_in")?.value;
  const role = req.cookies.get("role")?.value;
  const reqIdCookie = req.cookies.get("reqId")?.value;
  const { pathname } = req.nextUrl;

  // ✅ Always allow login, population form, and API routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/addpopulation") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // ✅ Redirect not logged in users to login
  if (!loggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ✅ Admin-only routes
  const adminRoutes = [
    "/dashboard",
    "/addelection",
    "/candidateregistration",
    "/listpopulation",
  ];
  if (adminRoutes.some((route) => pathname.startsWith(route)) && role !== "Admin") {
    return NextResponse.redirect(new URL("/voterdashboard", req.url));
  }

  // ✅ Voter-only routes
  const voterRoutes = [
    "/voterdashboard",
    "/votepage",
    "/votemonitoring",
    "/votehistory",
  ];
  if (voterRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== "Voter") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // ✅ Ensure voter reqId matches the one in the URL
    const reqIdUrl = req.nextUrl.searchParams.get("reqId");
    if (!reqIdUrl || reqIdUrl !== reqIdCookie) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
