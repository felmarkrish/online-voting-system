import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET() {
  try {
    // Connect to DB
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "online-voting-system",
    });

    // Fetch population joined with users
    const [rows] = await connection.execute(`
      SELECT 
        a.reqId, a.firstname, a.lastname, a.age, a.contact, a.gender, a.email, a.residence, a.requestdate, a.photo,
        b.username, b.userpass, b.role, b.userstatus
      FROM population AS a
      INNER JOIN users AS b
      ON a.reqId = b.reqId
      ORDER BY a.id DESC
    `);

    await connection.end();

    // Convert BLOB photo to base64
    const data = rows.map((row) => ({
      ...row,
      photo: row.photo
        ? `data:image/jpeg;base64,${Buffer.from(row.photo).toString("base64")}`
        : null,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching population:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update existing population record
export async function PUT(req) {
  let connection
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "online-voting-system",
    });
    const body = await req.json();
    const {
      reqId,
      firstname,
      lastname,
      age,
      contact,
      gender,
      email,
      residence,
      username,
      userpass,
      role,
      photo, // base64 string
    } = body;

    if (!reqId) {
      return NextResponse.json(
        { success: false, error: "reqId is required" },
        { status: 400 }
      );
    }

    // Update population table
      // ✅ Convert base64 photo to binary buffer (BLOB)
    let photoBuffer = null;
    if (photo) {
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
      photoBuffer = Buffer.from(base64Data, "base64");
    }
    const [popResult] = await connection.execute(
      `UPDATE population 
       SET firstname=?, lastname=?, age=?, contact=?, gender=?, email=?, residence=?, photo=?
       WHERE reqId=?`,
      [firstname, lastname, age, contact, gender, email, residence, photoBuffer, reqId]
    );

    // Update users table
    const [userResult] = await connection.execute(
      `UPDATE users
       SET username=?, userpass=?, role=?, userstatus="Active"
       WHERE reqId=?`,
      [username, userpass, role, reqId]
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      message: "✅ Population record updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating population:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Delete election
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const reqId = searchParams.get("reqId");

  if (!reqId) {
    return NextResponse.json({ error: "Missing population ID" }, { status: 400 });
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "online-voting-system",
    });

    // Delete from users first (if it references population)
    await connection.execute("DELETE FROM users WHERE reqId = ?", [reqId]);

    // Then delete from population
    await connection.execute("DELETE FROM population WHERE reqId = ?", [reqId]);

    await connection.end();
    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error("API DELETE error:", err.message);
    if (connection) await connection.end();
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

