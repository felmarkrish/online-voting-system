import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // Firestore client
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET() {
  try {
    // ✅ Fetch all elections
    const electionsSnapshot = await getDocs(collection(db, "electorial_tbl"));
    let elections = electionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // ✅ Sort manually by createdAt if available
    elections.sort((a, b) => {
      const aDate = a.createdAt?.toMillis?.() || 0;
      const bDate = b.createdAt?.toMillis?.() || 0;
      return bDate - aDate;
    });

    // ✅ Fetch candidates for the current year only
    const currentYear = new Date().getFullYear();
    const candidatesQuery = query(
      collection(db, "running_candidate"),
      where("year", "==", currentYear)
    );

    const candidatesSnapshot = await getDocs(candidatesQuery);
    const candidates = candidatesSnapshot.docs.map((doc) => doc.data());

    // ✅ Fetch population
    const populationSnapshot = await getDocs(collection(db, "population"));
    const populationMap = {};
    populationSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      populationMap[data.reqId] = {
        ...data,
        photo: data.photo || null,
      };
    });

    // ✅ Combine elections with participants
    const data = elections.map((el) => {
      const participants = candidates
        .filter((c) => c.electId === el.id)
        .map((c) => {
          const popData = populationMap[c.candidateId];
          return popData
            ? {
                ...popData,
                runCandidacy: c.candidateId,
                electID: c.electId,
              }
            : null;
        })
        .filter(Boolean);

      return {
        id: el.id,
        name: el.election_name,
        idx: el.idx || 0,
        participants,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("API GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
