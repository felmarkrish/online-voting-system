import { NextResponse } from "next/server";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const year = new Date().getFullYear();

    // =========================
    // 1️⃣ Fetch elections
    // =========================
    const electionsSnap = await getDocs(collection(db, "electorial_tbl"));
    const electionsMap = {};
    electionsSnap.forEach((doc) => {
      const data = doc.data();
      electionsMap[data.electId] = data;
    });
    console.log("✅ electionsMap:", electionsMap);

    // =========================
    // 2️⃣ Fetch population
    // =========================
    const popSnap = await getDocs(collection(db, "population"));
    const populationMap = {};
    popSnap.forEach((doc) => {
      const data = doc.data();
      if (data.reqId) populationMap[data.reqId] = data;
    });
    console.log("✅ populationMap:", populationMap);

    // =========================
    // 3️⃣ Fetch votes for current year
    // =========================
    const votesQuery = query(collection(db, "votedetails"), where("year", "==", year));
    const votesSnap = await getDocs(votesQuery);

    const voteCounts = {};
    votesSnap.forEach((doc) => {
      const v = doc.data();
      const { candidateId, electId } = v;

      const electionKey = electId || v.electionId;
      if (!voteCounts[electionKey]) voteCounts[electionKey] = {};
      if (!voteCounts[electionKey][candidateId]) voteCounts[electionKey][candidateId] = 0;
      voteCounts[electionKey][candidateId] += 1;

      if (!electionsMap[electionKey]) {
        console.warn(`⚠️ electionId from vote not found in electionsMap: ${electionKey}`);
      } else {
        console.log(`✅ electionId matched: ${electionKey}`);
      }
    });

    // =========================
    // 4️⃣ Build vote count candidates array
    // =========================
    const voteCountcandidates = [];
    Object.entries(voteCounts).forEach(([electionId, pops]) => {
      const election = electionsMap[electionId] || {};
      const electName = election.election_name || "Unknown";
      const numWinners = election.num_winners || 1;
      const idx = election.idx || 0;

      Object.entries(pops).forEach(([popId, totalCount]) => {
        const person = populationMap[popId] || {};
        voteCountcandidates.push({
          popId,
          firstname: person.firstname || "Unknown",
          lastname: person.lastname || "",
          photo: person.photo || null,
          elect_name: electName,
          electionId,
          numWinners,
          idx,
          totalCount,
        });
      });
    });

    voteCountcandidates.sort((a, b) => a.idx - b.idx);

    // =========================
    // 5️⃣ Fetch startup status from votestartup
    // =========================
    const startupQuery = query(collection(db, "votestartup"), where("year", "==", year));
    const startupSnap = await getDocs(startupQuery);

    let startup = { start: "start", num_winners: 1, message: "", alreadyvotemessage: "" };
    startupSnap.forEach((doc) => {
      const data = doc.data();
      startup = {
        start: data.start || "start",
        num_winners: data.num_winners || 1,
        message: data.message || "",
        alreadyvotemessage: data.alreadyvotemessage || "",
      };
    });

    // =========================
    // 6️⃣ Return response
    // =========================
    return NextResponse.json({
      voteCountcandidates,
      startup,
    });
  } catch (err) {
    console.error("Error in votemonitoring API:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
