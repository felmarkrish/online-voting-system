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

    // ✅ Fetch population joined with active users
    const [populationRows] = await connection.execute(`
      SELECT 
        a.reqId, a.firstname, a.lastname, a.age, a.contact, a.gender, a.email, 
        a.residence, a.requestdate, a.photo,
        b.username, b.userpass, b.role
      FROM population AS a
      INNER JOIN users AS b
      ON a.reqId = b.reqId AND b.userstatus = "Active"
      ORDER BY a.id DESC
    `);

    // this is fetch the available elections and fetch as dropdown in candidateregistration page
    const [electionRows] = await connection.execute(
      "SELECT id, electId, election_name FROM electorial_tbl ORDER BY id DESC"
    );

    await connection.end();

    // ✅ Convert BLOB photo to base64 for population
    const populationData = populationRows.map((row) => ({
      ...row,
      photo: row.photo
        ? `data:image/jpeg;base64,${Buffer.from(row.photo).toString("base64")}`
        : null,
    }));

    // ✅ Return both in one response
    return NextResponse.json({
      population: populationData,
      elections: electionRows,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
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

// Insert or update candidate in running_candidate
export async function POST(req) {
  try {
    const { electId, candidateId } = await req.json();

    if (!electId || !candidateId) {
      return NextResponse.json(
        { error: "Missing electId or candidateId" },
        { status: 400 }
      );
    }

    // ✅ Get current year
    const currentYear = new Date().getFullYear();

    // Connect to DB
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "online-voting-system",
    });

    // ✅ Check if candidate already registered this year
    const [rows] = await connection.execute(
      "SELECT 1 FROM running_candidate WHERE candidateId = ? AND year = ?",
      [candidateId, currentYear]
    );

    if (rows.length > 0) {
      // ✅ Update election for this candidate in current year
      await connection.execute(
        "UPDATE running_candidate SET electId = ? WHERE candidateId = ? AND year = ?",
        [electId, candidateId, currentYear]
      );

      await connection.end();

      return NextResponse.json({
        success: true,
        message: "Candidate updated for this year!",
      });
    }

    // ✅ Otherwise, insert new record
    await connection.execute(
      "INSERT INTO running_candidate (electId, candidateId, year) VALUES (?, ?, ?)",
      [electId, candidateId, currentYear]
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      message: "Candidate registered successfully!",
    });
  } catch (error) {
    console.error("Insert error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}







