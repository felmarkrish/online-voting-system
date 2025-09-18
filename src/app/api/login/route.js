// app/api/login/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const usersRef = db.collection("users");

    let adminSnapshot = await usersRef.where("role", "==", "Admin").limit(1).get();

    // First-time setup: no users → default admin login
    if (adminSnapshot.empty) {
      if (username === "admin" && password === "admin") {
        const res = NextResponse.json({
          success: true,
          username: "admin",
          role: "Admin",
          userstatus: "Active",
        });
        res.cookies.set("logged_in", "true", { httpOnly: true, path: "/", maxAge: 3600 });
        return res;
      } else {
        return NextResponse.json({ error: "Invalid default login" }, { status: 401 });
      }
    }

    // Normal login
    const userSnapshot = await usersRef
      .where("username", "==", username)
      .where("userpass", "==", password)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const user = userSnapshot.docs[0].data();

    const res = NextResponse.json({
      success: true,
      username: user.username,
      role: user.role,
      userstatus: user.userstatus,
      reqId: user.reqId || null,
    });

    res.cookies.set("logged_in", "true", { httpOnly: true, path: "/", maxAge: 3600 });
    res.cookies.set("role", user.role, { httpOnly: true, path: "/", maxAge: 3600 });
    res.cookies.set("reqId", user.reqId || "", { httpOnly: true, path: "/", maxAge: 3600 });

    return res;

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
