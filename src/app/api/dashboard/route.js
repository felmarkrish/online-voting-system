import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET() {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "online-voting-system",
    });

    // ✅ Get all elections with participant count
    const [elections] = await connection.execute(`
      SELECT b.electID, b.election_name, COUNT(a.candidateId) AS participants_count
      FROM electorial_tbl AS b
      LEFT JOIN running_candidate AS a ON a.electID = b.electID
      GROUP BY b.electID, b.election_name
    `);

    // ✅ Get candidate details (with photo as LONGBLOB)
    const [allCandidates] = await connection.execute(`
      SELECT a.reqId, a.firstname, a.lastname, a.age, a.residence, a.photo, 
             b.candidateId AS runCandidacy, b.electID
      FROM population AS a
      INNER JOIN running_candidate AS b ON a.reqId = b.candidateId
    `);

    await connection.end();

    // ✅ Convert LONGBLOB → Base64
    const candidatesWithPhotos = allCandidates.map((c) => ({
      ...c,
      photo: c.photo
        ? `data:image/jpeg;base64,${Buffer.from(c.photo).toString("base64")}`
        : null,
    }));

    // ✅ Map elections and participants
    const data = elections.map((el) => {
      const participants = candidatesWithPhotos.filter(
        (c) => c.electID === el.electID
      );
      return {
        id: el.electID,
        name: el.election_name,
        participants,
      };
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
