// app/api/auth/logout/route.js
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Logged out successfully" });

  // Clear cookies
  res.cookies.set("logged_in", "", { path: "/", maxAge: 0 });
  res.cookies.set("role", "", { path: "/", maxAge: 0 });
  res.cookies.set("reqId", "", { path: "/", maxAge: 0 });

  return res;
}
