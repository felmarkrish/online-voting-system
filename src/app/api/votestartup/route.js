import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "",
  database: "online-voting-system",
};

// ✅ GET by year
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year"), 10);

    if (!year) {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }

    const connection = await mysql.createConnection(DB_CONFIG);
    const [rows] = await connection.execute(
      "SELECT * FROM votestartup WHERE year = ? LIMIT 1",
      [year]
    );
    await connection.end();

    if (rows.length === 0) {
      return NextResponse.json({}, { status: 200 }); // no record yet
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (err) {
    console.error("Startup GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ PUT (insert if not exist, update if exist)
export async function PUT(req) {
  try {
    const { year, message, alreadyvotemessage, start } = await req.json();

    if (!year || !message || !alreadyvotemessage || !start) {
      return NextResponse.json(
        { error: "Year, Message, Already Vote Message, and Start are required" },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(DB_CONFIG);

    // check if year exists
    const [rows] = await connection.execute(
      "SELECT * FROM votestartup WHERE year = ? LIMIT 1",
      [year]
    );

    if (rows.length > 0) {
      // update
      await connection.execute(
        `UPDATE votestartup
         SET message = ?, alreadyvotemessage = ?, start = ?
         WHERE year = ?`,
        [message, alreadyvotemessage, start, year]
      );
    } else {
      // insert
      await connection.execute(
        `INSERT INTO votestartup (year, message, alreadyvotemessage, start)
         VALUES (?, ?, ?, ?)`,
        [year, message, alreadyvotemessage, start]
      );
    }

    await connection.end();

    return NextResponse.json(
      { success: true, message: `Election ${start === "inprogress" ? "started" : "stopped"} for ${year}` },
      { status: 200 }
    );
  } catch (err) {
    console.error("Startup PUT error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
