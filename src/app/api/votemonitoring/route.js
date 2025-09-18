// app/api/votecount/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const currentYear = new Date().getFullYear();

    // ✅ Fetch votestartup for current year
    const startupSnap = await getDocs(
      query(collection(db, "votestartup"), where("year", "==", currentYear))
    );
    const startup = startupSnap.docs[0]?.data() || {
      year: currentYear,
      start: "",
      message: "",
      alreadyvotemessage: "",
    };

    // ✅ Fetch all votedetails for current year
    const voteSnap = await getDocs(
      query(collection(db, "votedetails"), where("year", "==", currentYear))
    );

    const voteCountMap = {}; // key: `${popId}-${elect_name}`

    for (const doc of voteSnap.docs) {
      const vote = doc.data();
      const key = `${vote.popId}-${vote.elect_name}`;
      if (!voteCountMap[key]) {
        voteCountMap[key] = { ...vote, totalCount: 0 };
      }
      voteCountMap[key].totalCount += 1;
    }

    // ✅ Fetch population info and election info
    const populationSnap = await getDocs(collection(db, "population"));
    const populationMap = {};
    for (const doc of populationSnap.docs) {
      const data = doc.data();
      populationMap[data.reqId] = data;
    }

    const electionsSnap = await getDocs(collection(db, "electorial_tbl"));
    const electionsMap = {};
    for (const doc of electionsSnap.docs) {
      const data = doc.data();
      electionsMap[data.electId] = data;
    }

    // ✅ Combine data
    const voteCountcandidates = Object.values(voteCountMap).map((v) => {
      const pop = populationMap[v.popId] || {};
      const el = electionsMap[v.electionId] || {};
      return {
        candidateId: v.popId,
        firstname: pop.firstname || "",
        lastname: pop.lastname || "",
        photo: pop.photo || null,
        elect_name: v.elect_name,
        electionId: v.electionId,
        totalCount: v.totalCount,
        popId: v.popId,
        numWinners: el.num_winners || 1,
      };
    });

    return NextResponse.json({
      success: true,
      startup,
      voteCountcandidates,
    });
  } catch (err) {
    console.error("Firestore error:", err);
    return NextResponse.json(
      { error: "Database query failed", details: err.message },
      { status: 500 }
    );
  }
}
