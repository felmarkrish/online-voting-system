import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "online-voting-system",
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reqId = searchParams.get("reqId");

    if (!reqId) {
      return NextResponse.json({ valid: false });
    }

    const [rows] = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE reqId = ?",
      [reqId]
    );

    if (rows[0].total > 0) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false });
    }
  } catch (error) {
    console.error("Validate error:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
