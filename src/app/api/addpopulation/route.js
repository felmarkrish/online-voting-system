import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

// POST - Save a new request
export async function POST(req) {
  try {
    const body = await req.json();
    const { firstname, lastname, age, contact, gender, email, residence, requestdate, photo, username, userpass, role } = body;

    // ✅ Validate required fields
    if (
      !firstname || !lastname || !age || !contact || !gender ||
      !email || !residence || !requestdate || !username || !userpass || !role || !photo
    ) {
      return NextResponse.json(
        { success: false, error: "⚠️ All fields are required" },
        { status: 400 }
      );
    }

    // ✅ Connect to DB
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "online-voting-system",
    });

    // ✅ Get current year
    const year = new Date().getFullYear();

    // ✅ Find last reqId for this year
    const [rows] = await connection.execute(
      "SELECT reqId FROM population WHERE reqId LIKE ? ORDER BY reqId DESC LIMIT 1",
      [`req-${year}-%`]
    );

    let newNumber = 1;
    if (rows.length > 0) {
      const lastReqId = rows[0].reqId; // e.g., req-2025-004
      const lastNum = parseInt(lastReqId.split("-")[2], 10);
      newNumber = lastNum + 1;
    }

    // ✅ Build new reqId (this will also be userId)
    const newReqId = `req-${year}-${String(newNumber).padStart(3, "0")}`;

    // ✅ Convert base64 photo to binary buffer (BLOB)
    let photoBuffer = null;
    if (photo) {
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
      photoBuffer = Buffer.from(base64Data, "base64");
    }

    // ✅ Insert into population table
    await connection.execute(
      `INSERT INTO population 
        (reqId, firstname, lastname, age, contact, gender, email, residence, requestdate, photo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newReqId, firstname, lastname, age, contact, gender, email, residence, requestdate, photoBuffer]
    );

    // ✅ Insert into users table (same ID as reqId)
    await connection.execute(
      "INSERT INTO users (reqId, username, userpass, role) VALUES (?, ?, ?, ?)",
      [newReqId, username, userpass, role]
    );

    await connection.end();

    // ✅ Response
    return NextResponse.json({
      success: true,
      reqId: newReqId,
      message: "✅ Request and user saved successfully",
    });

  } catch (error) {
    console.error("❌ Error saving request:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
