import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin"; // make sure this uses admin SDK

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ✅ Use admin SDK for querying
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();
    const users = snapshot.docs.map(doc => doc.data());

    // ✅ Check if any active Admin exists
    const hasActiveAdmin = users.some(
      (u) => u.role === "Admin" && u.userStatus === "Active"
    );

    // ✅ Only allow default admin if no active Admin exists
    if (!hasActiveAdmin && username.trim() === "admin" && password.trim() === "admin") {
      const res = NextResponse.json({
        success: true,
        username: "admin",
        role: "Admin",
        userStatus: "Active",
        reqId: "",
      });
      res.cookies.set("logged_in", "true", { httpOnly: true, path: "/", maxAge: 3600 });
      res.cookies.set("role", "Admin", { httpOnly: true, path: "/", maxAge: 3600 });
      res.cookies.set("reqId", "", { httpOnly: true, path: "/", maxAge: 3600 });
      return res;
    }

    // ✅ Look for matching user in DB
    const user = users.find(
      (u) => u.username === username.trim() && u.userpass === password.trim()
    );

    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    if (user.userStatus === "Inactive") {
      return NextResponse.json(
        { error: "Account not verified", userStatus: "Inactive" },
        { status: 403 }
      );
    }

    // ✅ Successful login
    const res = NextResponse.json({
      success: true,
      username: user.username,
      role: user.role,
      userStatus: user.userStatus,
      reqId: user.reqId || "",
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
