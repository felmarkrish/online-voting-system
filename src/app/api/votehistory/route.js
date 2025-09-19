// app/api/votehistory/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year"), 10);
    const voterId = searchParams.get("voterId");

    if (isNaN(year) || !voterId) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing year/voterId" },
        { status: 400 }
      );
    }

    // 1. Fetch all votes for this voter/year
    const voteQuery = query(
      collection(db, "votedetails"),
      where("voterId", "==", voterId),
      where("year", "==", year)
    );
    const voteSnap = await getDocs(voteQuery);

    if (voteSnap.empty) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 2. Load population (reqId → data)
    const popSnap = await getDocs(collection(db, "population"));
    const populationMap = {};
    popSnap.forEach((doc) => {
      const d = doc.data();
      if (d.reqId) {
        populationMap[d.reqId] = {
          firstname: d.firstname || "",
          lastname: d.lastname || "",
          photo: d.photo || null,
        };
      }
    });

    // 3. Load elections (electId → data)
    const electSnap = await getDocs(collection(db, "electorial_tbl"));
    const electionMap = {};
    electSnap.forEach((doc) => {
      const d = doc.data();
      if (d.electId) {
        electionMap[d.electId] = {
          election_name: d.election_name || "Unknown",
          num_winners: d.num_winners || 1,
          idx: d.idx || 0,
        };
      }
    });

    // 4. Join vote + population + election
    const data = voteSnap.docs.map((voteDoc) => {
      const vote = voteDoc.data();

      const person = populationMap[vote.candidateId] || {}; // <-- fixed
      const election = electionMap[vote.electId] || {}; // <-- fixed

      return {
        elect_name: election.election_name || "Unknown",
        monthdate: vote.monthdate,
        firstname: person.firstname || "Unknown",
        lastname: person.lastname || "",
        photo: person.photo || null,
        num_winners: election.num_winners || 1,
        idx: election.idx || 0,
      };
    });

    // 5. Sort by monthdate DESC
    data.sort((a, b) => new Date(b.monthdate) - new Date(a.monthdate));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching Votes:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
