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
    
    let alreadyVoted = false;
    if (startup.start === "inprogress" && reqId) {
      const [voteCheck] = await pool.query(
        "SELECT 1 FROM votedetails WHERE voterId = ? AND year = ? LIMIT 1",
        [reqId, currentYear]
      );
      // ✅ If no row found, return safe defaults
      alreadyVoted = voteCheck.length > 0;
    }

    // Fetch elections for current year
    const [elections] = await pool.query(
      "SELECT electId, election_name, num_winners, idx FROM electorial_tbl ORDER BY idx ASC"
    );

    const results = [];
    for (const election of elections) {
      const [candidates] = await pool.query(
        `SELECT a.reqId AS candidateId, a.firstname, a.lastname
         FROM population AS a
         INNER JOIN running_candidate AS b ON a.reqId = b.candidateId
         WHERE b.electId = ? AND b.Year = ?`,
        [election.electId, currentYear]
      );

      results.push({
        electId: election.electId,
        election_name: election.election_name,
        num_winners: election.num_winners,
        candidates,
      });
    }

    return NextResponse.json({
      startup: {
        ...startup,
        alreadyVoted, // 👈 will tell frontend whether to show alreadyvotemessage
      },
      elections: results,
    });
  } catch (err) {
    console.error("DB error:", err);
    return NextResponse.json({ error: "Database query failed" }, { status: 500 });
  }
}


export async function POST(req) {
  try {
    const { reqId, selected } = await req.json();
    const currentYear = new Date().getFullYear();
    const monthdate = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    if (!reqId) {
      return NextResponse.json({ error: "Missing voter reqId" }, { status: 400 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (const [electionId, candidates] of Object.entries(selected)) {
        const [alreadyVoted] = await conn.query(
          `SELECT 1 FROM votedetails WHERE voterId = ? AND electionId = ? AND year = ?`,
          [reqId, electionId, currentYear]
        );

        if (alreadyVoted.length > 0) {
          await conn.rollback();
          return NextResponse.json({ error: "Already voted!" }, { status: 400 });
        }

        for (const popId of candidates) {
          await conn.query(
            `INSERT INTO votedetails (voterId, popId, electionId, elect_name, year, monthdate) 
             SELECT ?, ?, electId, election_name, ?, ? 
             FROM electorial_tbl WHERE electId = ?`,
            [reqId, popId, currentYear, monthdate, electionId]
          );
        }
      }

      await conn.commit();
      return NextResponse.json({ success: true, message: "Vote(s) saved" });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Vote saving error:", err);
    return NextResponse.json({ error: "Failed to save votes" }, { status: 500 });
  }
}
