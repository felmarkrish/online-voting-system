// app/api/voting/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // adjust path
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  addDoc,
  setDoc,
} from "firebase/firestore";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reqId = searchParams.get("reqId");
    const currentYear = new Date().getFullYear();

    // ✅ Fetch votestartup for current year
    const startupRef = doc(db, "votestartup", `${currentYear}`);
    const startupSnap = await getDoc(startupRef);
    const startup = startupSnap.exists()
      ? startupSnap.data()
      : {
          year: currentYear,
          start: "",
          message: "",
          alreadyvotemessage: "",
        };

    // ✅ Check if voter already voted
    let alreadyVoted = false;
    if (startup.start === "inprogress" && reqId) {
      const votedRef = collection(db, "votedetails");
      const votedQuery = query(
        votedRef,
        where("voterId", "==", reqId),
        where("year", "==", currentYear)
      );
      const votedSnap = await getDocs(votedQuery);
      alreadyVoted = !votedSnap.empty;
    }

    // ✅ Fetch elections
    const electionsRef = collection(db, "electorial_tbl");
    const electionsSnap = await getDocs(electionsRef);
    const elections = [];
    for (const docSnap of electionsSnap.docs) {
      const el = docSnap.data();
      el.id = docSnap.id;

      // ✅ Fetch candidates for this election
      const candidatesRef = collection(db, "running_candidate");
      const candidatesQuery = query(
        candidatesRef,
        where("electId", "==", el.id),
        where("year", "==", currentYear)
      );
      const candidatesSnap = await getDocs(candidatesQuery);

      const candidates = [];
      for (const cSnap of candidatesSnap.docs) {
        const candidate = cSnap.data();
        // ✅ Get candidate info from population
        const popSnap = await getDoc(doc(db, "population", candidate.candidateId));
        if (popSnap.exists()) {
          const popData = popSnap.data();
          candidates.push({
            candidateId: candidate.candidateId,
            firstname: popData.firstname,
            lastname: popData.lastname,
          });
        }
      }

      elections.push({
        electId: el.id,
        election_name: el.election_name,
        num_winners: el.num_winners || 1,
        candidates,
      });
    }

    return NextResponse.json({
      startup: {
        ...startup,
        alreadyVoted,
      },
      elections,
    });
  } catch (err) {
    console.error("GET voting error:", err);
    return NextResponse.json({ error: "Failed to fetch voting data" }, { status: 500 });
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

    // ✅ Loop through elections
    for (const [electionId, candidates] of Object.entries(selected)) {
      for (const candidateId of candidates) {
        const voteRef = doc(db, "votedetails", `${electionId}_${candidateId}_${reqId}`);
        const voteSnap = await getDoc(voteRef);

        if (voteSnap.exists()) {
          return NextResponse.json({ error: "Already voted!" }, { status: 400 });
        }

        // ✅ Save vote
        await setDoc(voteRef, {
          voterId: reqId,
          popId: candidateId,
          electionId,
          year: currentYear,
          monthdate,
        });
      }
    }

    return NextResponse.json({ success: true, message: "Vote(s) saved" });
  } catch (err) {
    console.error("POST voting error:", err);
    return NextResponse.json({ error: "Failed to save votes" }, { status: 500 });
  }
}
