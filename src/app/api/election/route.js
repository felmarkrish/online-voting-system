// app/api/voting/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // adjust path
import {
  collection,
  doc,
  getDocs,
  addDoc,
  getDoc,
  query,
  where,
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
        idx: el.idx || 0, // ✅ include idx here
        candidates,
      });
    }

    // ✅ sort elections by idx ascending
    elections.sort((a, b) => a.idx - b.idx);

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
    if (!reqId || !selected) {
      return NextResponse.json({ error: "Missing reqId or votes" }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const votedRef = collection(db, "votedetails");

    for (const [electId, candidates] of Object.entries(selected)) {
      for (const candidateId of candidates) {
        await addDoc(votedRef, {
          voterId: reqId,
          electId,
          candidateId,
          year: currentYear,
          createdAt: new Date(),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST voting error:", err);
    return NextResponse.json({ error: "Failed to submit votes" }, { status: 500 });
  }
}
