import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "online-voting-system",
});

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ✅ Check if there are any users in the table
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM users WHERE role = "Admin"`
    );
    const userCount = countRows[0].total;

    if (userCount === 0) {
      // ✅ First use → allow default admin/admin
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

    // ✅ Normal login check
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ? AND userpass = ? LIMIT 1",
      [username, password]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = rows[0];

    // ✅ Success
    const res = NextResponse.json({
      success: true,
      username: user.username,
      role: user.role,
      userstatus: user.userstatus,
      reqId: user.reqId,   // ✅ add this
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
res.cookies.set("reqId", user.reqId, {
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