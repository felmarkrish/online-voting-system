import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET(req) {
  let connection;
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year"), 10); // ensure integer
    const voterId = searchParams.get("voterId");

    if (isNaN(year) || !voterId) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing year/voterId" },
        { status: 400 }
      );
    }

    // Connect to DB
    connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "online-voting-system",
    });

    // Query with photo blob
    const [rows] = await connection.execute(
      `SELECT v.elect_name, v.monthdate, p.firstname, p.lastname, p.photo
       FROM votedetails v
       INNER JOIN population p ON v.popId = p.reqId
       WHERE v.voterId = ? AND v.year = ?
       ORDER BY v.monthdate DESC`,
      [voterId, year]
    );

    // Convert blob → base64
    const data = rows.map((row) => ({
      ...row,
      photo: row.photo
        ? `data:image/jpeg;base64,${row.photo.toString("base64")}`
        : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching Votes:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
