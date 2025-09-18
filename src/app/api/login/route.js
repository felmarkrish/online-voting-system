import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const usersRef = collection(db, "users");

    // ✅ Check if any Admin exists
    const adminQuery = query(usersRef, where("role", "==", "Admin"), limit(1));
    const adminSnapshot = await getDocs(adminQuery);

    if (adminSnapshot.empty) {
      // First use → default admin/admin
      if (username === "admin" && password === "admin") {
        const res = NextResponse.json({
          success: true,
          username: "admin",
          role: "Admin",
          userstatus: "Active",
        });
        res.cookies.set("logged_in", "true", { httpOnly: true, path: "/", maxAge: 60*60 });
        return res;
      } else {
        return NextResponse.json({ error: "Invalid default login" }, { status: 401 });
      }
    }

    // ✅ Normal login
    const userQuery = query(
      usersRef,
      where("username", "==", username),
      where("userpass", "==", password),
      limit(1)
    );
    const userSnapshot = await getDocs(userQuery);

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

    res.cookies.set("logged_in", "true", { httpOnly: true, path: "/", maxAge: 60*60 });
    res.cookies.set("role", user.role, { httpOnly: true, path: "/", maxAge: 60*60 });
    res.cookies.set("reqId", user.reqId || "", { httpOnly: true, path: "/", maxAge: 60*60 });

    return res;

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
