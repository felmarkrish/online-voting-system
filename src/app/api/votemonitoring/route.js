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
    const currentYear = new Date().getFullYear();


     // ✅ Fetch votestartup for current year only
    const [startupRows] = await pool.query(
      "SELECT * FROM votestartup WHERE year = ? LIMIT 1",
      [currentYear]
    );
    // ✅ If no row found, set safe defaults
    let startup = startupRows[0] || {
      year: currentYear,
      start: "",
      message: "",
      alreadyvotemessage: "",
    };

    const [rows] = await pool.execute(
      `SELECT 
  p.reqId AS popId,
  p.firstname,
  p.lastname,
  v.elect_name,
  v.electionId,
  p.photo,
  el.num_winners,
  el.idx,
  COUNT(v.popId) AS totalCount
FROM votedetails AS v
INNER JOIN population AS p 
  ON v.popId = p.reqId AND v.year = ?
INNER JOIN electorial_tbl AS el 
  ON el.electId = v.electionId
GROUP BY p.reqId, v.elect_name, v.electionId
ORDER BY el.idx`,
      [currentYear]
    );

    const voteCountcandidates = rows.map((row) => ({
      vid: row.id,
      startupid:startupRows.id,
      candidateId: row.candidateId,
      firstname: row.firstname,
      lastname: row.lastname,
      photo: row.photo
        ? `data:image/jpeg;base64,${Buffer.from(row.photo).toString("base64")}`
        : null,
      elect_name: row.elect_name,
      electionId: row.electionId,
      totalCount: row.totalCount,
      popId: row.popId,
      numWinners: row.num_winners,
    }));

    return NextResponse.json({
      success: true,
      startup,
      voteCountcandidates,
    });
  } catch (err) {
    console.error("DB error:", err);
    return NextResponse.json(
      { error: "Database query failed", details: err.message },
      { status: 500 }
    );
  }
}
