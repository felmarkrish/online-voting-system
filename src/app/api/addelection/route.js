import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "",
  database: "online-voting-system",
};

// Get all elections
export async function GET() {
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    const [rows] = await connection.execute(
      "SELECT * FROM electorial_tbl ORDER BY idx"
    );
    await connection.end();
    return NextResponse.json(rows);
  } catch (err) {
    console.error("API GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Add or silently update election
export async function POST(req) {
  try {
    const { election_name, num_winners, createddate, Indexes } = await req.json();
    if (!election_name || !num_winners) {
      return NextResponse.json(
        { error: "Election name and number of winners are required" },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(DB_CONFIG);

    // Check if election name already exists
    const [existing] = await connection.execute(
      "SELECT * FROM electorial_tbl WHERE election_name = ?",
      [election_name]
    );

    if (existing.length > 0) {
      // If exists, update silently instead of error
      const existingId = existing[0].electId;
      await connection.execute(
        "UPDATE electorial_tbl SET num_winners = ?, idx = ?, WHERE electId = ?",
         [num_winners, Indexes, existingId]  // make sure you pass Indexes too
      );
      await connection.end();
      return NextResponse.json({
        message: "Election updated silently",
        electId: existingId,
      });
    }

    // If not exists, insert new election
    const [lastRow] = await connection.execute(
      "SELECT electId FROM electorial_tbl ORDER BY electId DESC LIMIT 1"
    );

    let newIdNumber = 1;
    if (lastRow.length > 0) {
      const lastId = lastRow[0].electId; // e.g., "2025-003"
      const lastNum = parseInt(lastId.split("-")[1], 10);
      newIdNumber = lastNum + 1;
    }

    const newElectID = `2025-${String(newIdNumber).padStart(3, "0")}`;

    await connection.execute(
      "INSERT INTO electorial_tbl (electId, election_name, num_winners, createddate, idx) VALUES (?, ?, ?, ?, ?)",
      [newElectID, election_name, num_winners, createddate, Indexes]
    );

    await connection.end();

    return NextResponse.json({
      message: "Election added successfully",
      electId: newElectID,
    });
  } catch (err) {
    console.error("API POST error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Update election
export async function PUT(req) {
  try {
    const { electId, election_name, num_winners, Indexes } = await req.json();
    if (!electId || !election_name || !num_winners) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const connection = await mysql.createConnection(DB_CONFIG);

    // Prevent duplicate names for other elections
    const [existing] = await connection.execute(
      "SELECT * FROM electorial_tbl WHERE election_name = ? AND electID != ?",
      [election_name, electId]
    );

    if (existing.length > 0) {
      await connection.end();
      return NextResponse.json(
        { error: "Another election with the same name exists" },
        { status: 400 }
      );
    }

    await connection.execute(
      "UPDATE electorial_tbl SET election_name = ?, num_winners = ?, idx = ? WHERE electID = ?",
      [election_name, num_winners, Indexes, electId]
    );
    await connection.end();

    return NextResponse.json({ message: "Election updated successfully" });
  } catch (err) {
    console.error("API PUT error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Delete election
export async function DELETE(req) {
  try {
    const { electId } = await req.json();
    if (!electId) {
      return NextResponse.json({ error: "Missing election ID" }, { status: 400 });
    }

    const connection = await mysql.createConnection(DB_CONFIG);
    await connection.execute("DELETE FROM electorial_tbl WHERE electID = ?", [electId]);
    await connection.end();

    return NextResponse.json({ message: "Election deleted successfully" });
  } catch (err) {
    console.error("API DELETE error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
