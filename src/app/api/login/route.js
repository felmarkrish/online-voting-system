// app/api/login/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, query, where, limit } from "firebase/firestore";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    const userDocs = snapshot.docs;

    // Check if there are any Admin users
    const adminUsers = userDocs.filter(doc => doc.data().role === "Admin");

    if (adminUsers.length === 0) {
      // First use → allow default admin/admin
      if (username === "admin" && password === "admin") {
        const res = NextResponse.json({
          success: true,
          username: "admin",
          role: "Admin",
          userstatus: "Active",
        });
        res.cookies.set("logged_in", "true", {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60,
        });
        return res;
      } else {
        return NextResponse.json(
          { error: "Invalid default login" },
          { status: 401 }
        );
      }
    }

    // Normal login check
    const userSnapshot = await getDocs(
      query(usersRef, where("username", "==", username), where("userpass", "==", password), limit(1))
    );

    if (userSnapshot.empty) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // Success: set cookies
    const res = NextResponse.json({
      success: true,
      username: user.username,
      role: user.role,
      userstatus: user.userstatus,
      reqId: user.reqId || null,
    });

    res.cookies.set("logged_in", "true", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });
    res.cookies.set("role", user.role, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60,
    });
    res.cookies.set("reqId", user.reqId || "", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60,
    });

    return res;

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
